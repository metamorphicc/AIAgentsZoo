import { forbiddenOriginResponse, isSameOrigin, requestFingerprint } from "./request";
import { checkRateLimit, rateLimitResponse } from "./rate-limit";
import { authRequiredResponse, getSession } from "./session";

export async function guardMutation(request: Request, input: {
  scope: string;
  limit?: number;
  windowMs?: number;
}) {
  if (!isSameOrigin(request)) return { response: forbiddenOriginResponse() } as const;
  const session = await getSession();
  if (!session) return { response: authRequiredResponse() } as const;

  const rate = await checkRateLimit({
    key: `${session.address.toLowerCase()}:${requestFingerprint(request)}`,
    scope: input.scope,
    limit: input.limit ?? 20,
    windowMs: input.windowMs ?? 60_000,
  });
  if (!rate.allowed) return { response: rateLimitResponse(rate.retryAfterSeconds) } as const;

  return { session } as const;
}
