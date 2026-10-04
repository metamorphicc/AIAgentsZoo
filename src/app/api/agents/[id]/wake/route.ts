import { z } from "zod";

import { AgentRunError, runAgentCycle } from "@/lib/zoo/run-agent";

const wakeRequestSchema = z.object({
  task: z.string().trim().min(1).max(1000).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown = {};
  const rawBody = await request.text();

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Тело запроса должно быть JSON" }, { status: 400 });
    }
  }

  const parsed = wakeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Некорректная задача", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await runAgentCycle(id, parsed.data.task);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AgentRunError) {
      const status = error.code === "NOT_FOUND" ? 404 : error.code === "FAILED" ? 500 : 409;
      return Response.json({ error: error.message, code: error.code }, { status });
    }

    return Response.json({ error: "Не удалось разбудить животное" }, { status: 500 });
  }
}
