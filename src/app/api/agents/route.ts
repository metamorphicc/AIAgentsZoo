import { z } from "zod";
import { readJsonBody } from "@/lib/auth/json-body";
import { quotaError } from "@/lib/launch-limits";

import { guardMutation } from "@/lib/auth/mutation";
import { createAgent, getAgents } from "@/lib/zoo-store";
import { speciesIds } from "@/lib/zoo/types";

const createAgentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  species: z.enum(speciesIds),
  role: z.string().trim().max(80).optional(),
  description: z.string().trim().max(280).optional(),
  task: z.string().trim().max(1000).optional(),
  feedMax: z.coerce.number().int().min(1).max(100).default(10),
  enclosureId: z.string().trim().min(1).max(100),
  controlAgentId: z.string().trim().max(100).optional(),
});

export async function GET() {
  return Response.json({ agents: await getAgents() });
}

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "create-agent", limit: 12, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const parsed = createAgentSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return Response.json({ error: "Animal input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const agent = await createAgent({
      ...parsed.data,
      controlAgentId: parsed.data.controlAgentId || null,
      ownerAddress: auth.session.address,
      allowSystemEnclosure: auth.session.role === "admin",
    });
    return Response.json({ agent }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "RESOURCE_LIMIT") return Response.json({ error: quotaError }, { status: 409 });
    if (error instanceof Error && error.message === "ENCLOSURE_NOT_FOUND") {
      return Response.json({ error: "Enclosure not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "ENCLOSURE_FORBIDDEN") {
      return Response.json({ error: "This wallet does not own that enclosure" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CONTROL_AGENT_NOT_FOUND") {
      return Response.json({ error: "AI agent not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "CONTROL_AGENT_FORBIDDEN") {
      return Response.json({ error: "This wallet does not own that AI agent" }, { status: 403 });
    }
    return Response.json({ error: "The animal could not be created" }, { status: 500 });
  }
}
