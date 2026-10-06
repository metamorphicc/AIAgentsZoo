import { forbiddenOriginResponse, isSameOrigin } from "@/lib/auth/request";
import { revokeCurrentSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();
  await revokeCurrentSession();
  return Response.json({ ok: true });
}
