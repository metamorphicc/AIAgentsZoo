import { z } from "zod";

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
});

export async function GET() {
  return Response.json({ agents: await getAgents() });
}

export async function POST(request: Request) {
  const parsed = createAgentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Animal input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const agent = await createAgent(parsed.data);
    return Response.json({ agent }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ENCLOSURE_NOT_FOUND") {
      return Response.json({ error: "Enclosure not found" }, { status: 404 });
    }
    return Response.json({ error: "The animal could not be created" }, { status: 500 });
  }
}
