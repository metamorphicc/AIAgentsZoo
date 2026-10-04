import { getAgents } from "@/lib/db";

export function GET() {
  return Response.json({ agents: getAgents() });
}
