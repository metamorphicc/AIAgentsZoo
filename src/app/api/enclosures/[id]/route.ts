import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { assignEnclosureHead, getEnclosure } from "@/lib/zoo-store";

const assignmentSchema = z.object({
  headAgentId: z.string().trim().max(100).nullable(),
});

type EnclosureRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: EnclosureRouteContext) {
  const { id } = await context.params;
  const enclosure = await getEnclosure(id);
  return enclosure
    ? Response.json({ enclosure })
    : Response.json({ error: "Enclosure not found" }, { status: 404 });
}

export async function PATCH(request: Request, context: EnclosureRouteContext) {
  const auth = await guardMutation(request, { scope: "assign-enclosure-agent", limit: 20, windowMs: 60_000 });
  if ("response" in auth) return auth.response;
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Agent assignment is invalid" }, { status: 400 });
  const { id } = await context.params;

  try {
    const enclosure = await assignEnclosureHead({
      enclosureId: id,
      headAgentId: parsed.data.headAgentId || null,
      ownerAddress: auth.session.address,
      isAdmin: auth.session.role === "admin",
    });
    return Response.json({ enclosure });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "ENCLOSURE_NOT_FOUND" || code === "CONTROL_AGENT_NOT_FOUND") {
      return Response.json({ error: code === "ENCLOSURE_NOT_FOUND" ? "Enclosure not found" : "AI agent not found" }, { status: 404 });
    }
    if (code === "ENCLOSURE_FORBIDDEN" || code === "CONTROL_AGENT_FORBIDDEN") {
      return Response.json({ error: "This wallet cannot make that assignment" }, { status: 403 });
    }
    return Response.json({ error: "The head agent could not be assigned" }, { status: 500 });
  }
}
