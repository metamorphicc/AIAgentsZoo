import { z } from "zod";
import { readJsonBody } from "@/lib/auth/json-body";
import { guardMutation } from "@/lib/auth/mutation";
import { forbiddenResponse } from "@/lib/auth/session";
import { setResourceVisibility } from "@/lib/zoo-store";

const schema = z.object({ kind: z.enum(["enclosure", "control-agent"]), id: z.string().min(1).max(100), hidden: z.boolean() });

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "moderate-visibility", limit: 30 });
  if ("response" in auth) return auth.response;
  if (auth.session.role !== "admin") return forbiddenResponse();
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) return Response.json({ error: "Visibility input is invalid" }, { status: 400 });
  try {
    await setResourceVisibility(parsed.data.kind, parsed.data.id, parsed.data.hidden, auth.session.address);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Custom resource not found. System resources cannot be hidden." }, { status: 404 });
  }
}
