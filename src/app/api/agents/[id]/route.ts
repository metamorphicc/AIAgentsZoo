import { getAgent, getAgentEvents, getAgentRuns } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  return Response.json({
    agent,
    runs: await getAgentRuns(id),
    events: await getAgentEvents(id),
  });
}
