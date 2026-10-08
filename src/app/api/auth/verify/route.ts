import { z } from "zod";
import { readJsonBody } from "@/lib/auth/json-body";

import { requestFingerprint, forbiddenOriginResponse, isSameOrigin, requestOrigin } from "@/lib/auth/request";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";
import { issueSession } from "@/lib/auth/session";
import { verifyWalletChallenge } from "@/lib/auth/siwe";
import { storageMode } from "@/lib/zoo-store";

const verifySchema = z.object({
  address: z.string().trim().min(42).max(42),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(2048),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();
  if (storageMode === "ephemeral") {
    return Response.json({ error: "Wallet sign-in is unavailable until durable storage is configured for this deployment." }, { status: 503 });
  }
  const globalRate = await checkRateLimit({ key: "global", scope: "auth-verify", limit: 200, windowMs: 60_000 });
  if (!globalRate.allowed) return rateLimitResponse(globalRate.retryAfterSeconds);
  const rate = await checkRateLimit({
    key: requestFingerprint(request),
    scope: "auth-verify",
    limit: 8,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const parsed = verifySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return Response.json({ error: "The wallet signature payload is invalid." }, { status: 400 });
  }

  try {
    const address = await verifyWalletChallenge({ ...parsed.data, origin: requestOrigin(request) });
    const session = await issueSession(address);
    return Response.json({ session });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_SIGNATURE";
    const errorMessage = code === "CHALLENGE_EXPIRED"
      ? "The sign-in request expired. Start again from Connect wallet."
      : "The signature could not be verified for this wallet.";
    return Response.json({ error: errorMessage }, { status: 401 });
  }
}
