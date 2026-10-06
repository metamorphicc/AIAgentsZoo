import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { getEnclosure, ownsEnclosure, refillEnclosure } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await guardMutation(_request, { scope: "refill-enclosure", limit: 10, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const enclosure = await getEnclosure(id);
  if (!enclosure) return Response.json({ error: "Enclosure not found" }, { status: 404 });
  if (auth.session.role !== "admin" && !ownsEnclosure(enclosure, auth.session.address)) return forbiddenResponse();
  const agents = await refillEnclosure(id);
  return Response.json({ agents });
}
