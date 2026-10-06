import { NextResponse } from "next/server";

import { getAgents, getEnclosures, storageMode } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [agents, enclosures] = await Promise.all([getAgents(), getEnclosures()]);
    const durable = storageMode !== "ephemeral";

    return NextResponse.json(
      {
        ok: true,
        storage: storageMode,
        durable,
        provider: process.env.AGENT_PROVIDER === "openai" ? "openai" : "demo",
        agents: agents.length,
        enclosures: enclosures.length,
        checkedAt: new Date().toISOString(),
      },
      { status: durable ? 200 : 206 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Health check failed" },
      { status: 503 },
    );
  }
}
