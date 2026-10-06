import { z } from "zod";

import { createWalletChallenge } from "@/lib/auth/siwe";
import { forbiddenOriginResponse, isSameOrigin, requestFingerprint, requestOrigin } from "@/lib/auth/request";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";

const challengeSchema = z.object({
  address: z.string().trim().min(42).max(42),
  chainId: z.number().int().positive().max(10_000_000),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();
  const rate = await checkRateLimit({
    key: requestFingerprint(request),
    scope: "auth-challenge",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const parsed = challengeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Wallet address or chain is invalid." }, { status: 400 });
  }

  try {
    return Response.json(await createWalletChallenge({
      ...parsed.data,
      origin: requestOrigin(request),
    }));
  } catch {
    return Response.json({ error: "The wallet challenge could not be created." }, { status: 400 });
  }
}
