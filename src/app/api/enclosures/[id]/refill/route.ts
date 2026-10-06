import { getEnclosure, refillEnclosure } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const enclosure = await getEnclosure(id);
  if (!enclosure) return Response.json({ error: "Enclosure not found" }, { status: 404 });
  const agents = await refillEnclosure(id);
  return Response.json({ agents });
}
