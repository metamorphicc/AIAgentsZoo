import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
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
  const auth = await guardMutation(request, { scope: "create-enclosure", limit: 5, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const parsed = createEnclosureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enclosure input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const enclosure = await createEnclosure({ ...parsed.data, ownerAddress: auth.session.address });
  return Response.json({ enclosure }, { status: 201 });
}
