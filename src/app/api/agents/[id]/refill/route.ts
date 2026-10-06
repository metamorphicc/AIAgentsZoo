import { canManageResource } from "@/lib/auth/authorization";
import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { getAgent, refillAgent } from "@/lib/zoo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await guardMutation(_request, { scope: "refill-agent", limit: 20, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const selected = await getAgent(id);
  if (!selected) return Response.json({ error: "Agent not found" }, { status: 404 });
  if (!canManageResource(auth.session, selected.ownerAddress)) return forbiddenResponse();
  const agent = await refillAgent(id);
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
  return Response.json({ agent });
}
