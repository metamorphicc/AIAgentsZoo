import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { getAgent, ownsAgent } from "@/lib/zoo-store";
import { AgentRunError, runAgentCycle } from "@/lib/zoo/run-agent";

const wakeRequestSchema = z.object({
  task: z.string().trim().min(1).max(1000).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await guardMutation(request, { scope: "wake-agent", limit: 12, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
  if (auth.session.role !== "admin" && !ownsAgent(agent, auth.session.address)) return forbiddenResponse();

  let body: unknown = {};
  const rawBody = await request.text();

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }
  }

  const parsed = wakeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Task input is invalid", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await runAgentCycle(id, parsed.data.task);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AgentRunError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FAILED" ? 500 : 409;
      return Response.json({ error: error.message, code: error.code }, { status });
    }

    return Response.json({ error: "The agent could not be awakened" }, { status: 500 });
  }
}
