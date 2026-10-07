import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { createEnclosure, getEnclosures } from "@/lib/zoo-store";

const createEnclosureSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(4).max(280),
  territory: z.string().trim().min(2).max(160),
  headAgentId: z.string().trim().max(100).optional(),
});

export async function GET() {
  return Response.json({ enclosures: await getEnclosures() });
}

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "create-enclosure", limit: 5, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const parsed = createEnclosureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enclosure input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const enclosure = await createEnclosure({
      ...parsed.data,
      headAgentId: parsed.data.headAgentId || null,
      ownerAddress: auth.session.address,
      allowSystemAgent: auth.session.role === "admin",
    });
    return Response.json({ enclosure }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "CONTROL_AGENT_NOT_FOUND") return Response.json({ error: "AI agent not found" }, { status: 404 });
    if (code === "CONTROL_AGENT_FORBIDDEN") return Response.json({ error: "This wallet does not own that AI agent" }, { status: 403 });
    return Response.json({ error: "The enclosure could not be created" }, { status: 500 });
  }
}
