import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { getAgent, ownsAgent, sendSignal } from "@/lib/zoo-store";

const signalSchema = z.object({
  agentId: z.string().trim().min(1).max(100),
  targetAgentId: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "publish-signal", limit: 30, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const parsed = signalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Signal input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [source, target] = await Promise.all([
      getAgent(parsed.data.agentId),
      getAgent(parsed.data.targetAgentId),
    ]);
    if (!source || !target) {
      return Response.json({ error: "Source or target animal not found" }, { status: 404 });
    }
    const isAdmin = auth.session.role === "admin";
    if (!isAdmin && (!ownsAgent(source, auth.session.address) || !ownsAgent(target, auth.session.address))) {
      return forbiddenResponse();
    }
    const event = await sendSignal(parsed.data);
    return Response.json({ event }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "AGENT_NOT_FOUND") return Response.json({ error: "Source or target animal not found" }, { status: 404 });
    if (code === "SAME_AGENT") return Response.json({ error: "Choose two different animals" }, { status: 400 });
    return Response.json({ error: "The signal could not be published" }, { status: 500 });
  }
}
