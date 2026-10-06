import { z } from "zod";

import { createEnclosure, getEnclosures } from "@/lib/zoo-store";

const createEnclosureSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(4).max(280),
  territory: z.string().trim().min(2).max(160),
});

export async function GET() {
  return Response.json({ enclosures: await getEnclosures() });
}

export async function POST(request: Request) {
  const parsed = createEnclosureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enclosure input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const enclosure = await createEnclosure(parsed.data);
  return Response.json({ enclosure }, { status: 201 });
}
