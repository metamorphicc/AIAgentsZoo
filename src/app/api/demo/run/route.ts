import { randomUUID } from "node:crypto";

import { forbiddenOriginResponse, isSameOrigin, requestFingerprint } from "@/lib/auth/request";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOriginResponse();
  const rate = await checkRateLimit({
    key: requestFingerprint(request),
    scope: "guest-demo",
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds);

  const runId = `demo-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  return Response.json({
    runId,
    isolated: true,
    createdAt,
    steps: [
      { actor: "Grok", type: "dispatch", summary: "Split one bounded mission into scout, build, archive, and watch duties." },
      { actor: "Raven 01", type: "observation", summary: "Found a release signal and attached its source to the temporary run." },
      { actor: "Beaver 01", type: "artifact", summary: "Built a field note from Raven’s observation without writing to the public registry." },
      { actor: "Owl 01", type: "memory", summary: "Compressed the handoff into reusable context for this browser session." },
      { actor: "Meerkat 01", type: "health", summary: "Confirmed that the demo stayed inside its single-cycle budget." },
    ],
    artifact: {
      title: "Isolated habitat field note",
      body: "A temporary Raven → Beaver proof produced for this visitor. It was not persisted to the shared Zoo database.",
    },
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
