import { createHash } from "node:crypto";

export function requestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedHost
    ? `${forwardedProto ?? requestUrl.protocol.replace(":", "")}://${forwardedHost}`
    : requestUrl.origin;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  return origin === requestOrigin(request);
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "ai-agent-zoo";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function forbiddenOriginResponse() {
  return Response.json(
    { error: "This request did not originate from the AI Agent Zoo interface." },
    { status: 403 },
  );
}
