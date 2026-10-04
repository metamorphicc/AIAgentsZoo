import { getAgent, getAgentEvents, getAgentRuns } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  return Response.json({
    agent,
    runs: getAgentRuns(id),
    events: getAgentEvents(id),
  });
}
