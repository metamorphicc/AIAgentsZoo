import { z } from "zod";
import { readJsonBody } from "@/lib/auth/json-body";
import { quotaError } from "@/lib/launch-limits";
import { isPublicEndpoint } from "@/lib/public-endpoint";

import { guardMutation } from "@/lib/auth/mutation";
import { createControlAgent, getControlAgents } from "@/lib/zoo-store";
import { controlAgentProviders } from "@/lib/zoo/types";

const optionalEndpoint = z.union([
  z.literal(""),
  z.string().max(2048).refine(isPublicEndpoint, "Use an HTTP(S) URL without credentials, query parameters, or fragments"),
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
  const parsed = createControlAgentSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return Response.json({ error: "AI agent input is invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const agent = await createControlAgent({
      ...parsed.data,
      endpointUrl: parsed.data.endpointUrl || null,
      ownerAddress: auth.session.address,
    });
    return Response.json({ agent }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "RESOURCE_LIMIT") return Response.json({ error: quotaError }, { status: 409 });
    return Response.json({ error: "The agent could not be registered" }, { status: 500 });
  }
}
