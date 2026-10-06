import { consumeRateLimit } from "@/lib/zoo-store";

export async function checkRateLimit(input: {
  key: string;
  scope: string;
  limit: number;
  windowMs: number;
}) {
  return consumeRateLimit(input);
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many requests. Wait before trying again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}
