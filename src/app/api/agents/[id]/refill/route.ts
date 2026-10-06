import { refillAgent } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const agent = await refillAgent(id);
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
  return Response.json({ agent });
}
