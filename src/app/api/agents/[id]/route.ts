import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { assignAnimalControlAgent, getAgent, getAgentEvents, getAgentRuns } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  return Response.json({
    agent,
    runs: await getAgentRuns(id),
    events: await getAgentEvents(id),
  });
}

const assignmentSchema = z.object({
  controlAgentId: z.string().trim().max(100).nullable(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await guardMutation(request, { scope: "assign-animal-agent", limit: 30, windowMs: 60_000 });
  if ("response" in auth) return auth.response;
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Agent assignment is invalid" }, { status: 400 });
  const { id } = await params;

  try {
    const animal = await assignAnimalControlAgent({
      animalId: id,
      controlAgentId: parsed.data.controlAgentId || null,
      ownerAddress: auth.session.address,
      isAdmin: auth.session.role === "admin",
    });
    return Response.json({ agent: animal });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "ANIMAL_NOT_FOUND" || code === "CONTROL_AGENT_NOT_FOUND") {
      return Response.json({ error: code === "ANIMAL_NOT_FOUND" ? "Animal not found" : "AI agent not found" }, { status: 404 });
    }
    if (code === "ANIMAL_FORBIDDEN" || code === "CONTROL_AGENT_FORBIDDEN") {
      return Response.json({ error: "This wallet cannot make that assignment" }, { status: 403 });
    }
    return Response.json({ error: "The animal agent could not be assigned" }, { status: 500 });
  }
}
