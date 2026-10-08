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

  const limit = input.limit ?? 20;
  const windowMs = input.windowMs ?? 60_000;
  // Wallet quotas survive IP changes; network and global quotas bound new-wallet spam.
  for (const [key, multiplier] of [
    [`wallet:${session.address.toLowerCase()}`, 1],
    [`network:${requestFingerprint(request)}`, 5],
    ["global", 50],
  ] as const) {
    const rate = await checkRateLimit({ key, scope: input.scope, limit: limit * multiplier, windowMs });
    if (!rate.allowed) return { response: rateLimitResponse(rate.retryAfterSeconds) } as const;
  }

  return { session } as const;
}
