import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { getRuntimeControl, setRuntimePaused } from "@/lib/zoo-store";

const runtimeSchema = z.object({ paused: z.boolean() });

export async function GET() {
  return Response.json({ runtime: await getRuntimeControl() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "admin-runtime", limit: 20, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  if (auth.session.role !== "admin") return forbiddenResponse();

  const parsed = runtimeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Runtime state must be true or false." }, { status: 400 });
  }
  return Response.json({
    runtime: await setRuntimePaused(parsed.data.paused, auth.session.address),
  });
}
