import { z } from "zod";

import { guardMutation } from "@/lib/auth/mutation";
import { createControlAgent, getControlAgents } from "@/lib/zoo-store";
import { controlAgentProviders } from "@/lib/zoo/types";

const optionalEndpoint = z.union([
  z.literal(""),
  z.url().refine((url) => url.startsWith("https://") || url.startsWith("http://"), "Endpoint must use HTTP or HTTPS"),
]).optional();

const createControlAgentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  provider: z.enum(controlAgentProviders),
  model: z.string().trim().min(1).max(120),
  role: z.string().trim().min(2).max(100),
  description: z.string().trim().min(4).max(360),
  endpointUrl: optionalEndpoint,
});

export async function GET() {
  return Response.json({ agents: await getControlAgents() });
}

export async function POST(request: Request) {
  const auth = await guardMutation(request, { scope: "create-control-agent", limit: 10, windowMs: 60 * 60 * 1000 });
  if ("response" in auth) return auth.response;
  const parsed = createControlAgentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "AI agent input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  const agent = await createControlAgent({
    ...parsed.data,
    endpointUrl: parsed.data.endpointUrl || null,
    ownerAddress: auth.session.address,
  });
  return Response.json({ agent }, { status: 201 });
}
