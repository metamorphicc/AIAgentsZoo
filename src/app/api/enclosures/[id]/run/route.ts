import { z } from "zod";
import { canManageResource } from "@/lib/auth/authorization";
import { readJsonBody } from "@/lib/auth/json-body";
import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { claimHabitatRun, finishHabitatRun, getAgentArtifacts, getEnclosure, getEnclosureAgents, getRuntimeControl } from "@/lib/zoo-store";
import { AgentRunError, runAgentCycle } from "@/lib/zoo/run-agent";
import { isReadyForCycle, workflowResidents, type WorkflowUpdate } from "@/lib/zoo/workflow";

export const maxDuration = 120;
const inputSchema = z.object({ requestId: z.uuid(), task: z.string().trim().min(3).max(1000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardMutation(request, { scope: "run-habitat", limit: 6, windowMs: 3_600_000 });
  if ("response" in auth) return auth.response;
  const parsed = inputSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return Response.json({ error: "Provide a mission of 3–1000 characters." }, { status: 400 });
  const { id } = await params;
  const enclosure = await getEnclosure(id);
  if (!enclosure) return Response.json({ error: "Enclosure not found" }, { status: 404 });
  if (!canManageResource(auth.session, enclosure.ownerAddress)) return forbiddenResponse();
  const residents = workflowResidents(await getEnclosureAgents(id));
  if (!residents.length) return Response.json({ error: "Add an animal before running the habitat." }, { status: 409 });
  // Enclosure control alone does not grant control of another wallet's residents.
  if (residents.some((animal) => !canManageResource(auth.session, animal.ownerAddress))) return forbiddenResponse();
  if ((await getRuntimeControl()).paused) return Response.json({ error: "The habitat runtime is paused." }, { status: 409 });
  if (residents.some((animal) => !isReadyForCycle(animal))) return Response.json({ error: "Participating residents must be available with feed remaining." }, { status: 409 });
  const { requestId, task } = parsed.data;
  try {
    await claimHabitatRun(requestId, id, task);
  } catch {
    return Response.json({ error: "A habitat run is already active, or this request was already processed." }, { status: 409 });
  }
  const startedAt = new Date().toISOString();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (update: WorkflowUpdate) => {
        try { controller.enqueue(encoder.encode(`${JSON.stringify(update)}\n`)); } catch { /* Disconnected readers cannot cancel recorded work. */ }
      };
      try {
        send({ type: "started", mission: task, runId: requestId });
        for (const animal of residents) {
          send({ type: "running", agentId: animal.id, species: animal.species, name: animal.name });
          const result = await runAgentCycle(animal.id, task, requestId);
          send({ type: "completed", agentId: animal.id, species: animal.species, name: animal.name, summary: result.run.summary ?? "Cycle recorded.", artifactIds: result.artifacts.filter((artifact) => artifact.createdAt >= startedAt).map((artifact) => artifact.id) });
        }
        const artifacts = (await Promise.all(residents.map((animal) => getAgentArtifacts(animal.id)))).flat().filter((artifact) => artifact.createdAt >= startedAt);
        await finishHabitatRun(requestId, "completed");
        send({ type: "finished", cycles: residents.length, artifacts });
      } catch (error) {
        await finishHabitatRun(requestId, "failed");
        send({ type: "error", error: error instanceof AgentRunError ? error.message : "The habitat run stopped. Completed steps remain in the trace." });
      } finally {
        try { controller.close(); } catch { /* The reader may have disconnected. */ }
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
