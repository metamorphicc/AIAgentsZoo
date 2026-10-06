import { NextResponse } from "next/server";

import { getAgents, getEnclosures, getRuntimeControl, storageMode } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [agents, enclosures, runtime] = await Promise.all([getAgents(), getEnclosures(), getRuntimeControl()]);
    const durable = storageMode !== "ephemeral";

    return NextResponse.json(
      {
        ok: true,
        storage: storageMode,
        durable,
        provider: process.env.AGENT_PROVIDER === "openai" ? "openai" : "demo",
        agents: agents.length,
        enclosures: enclosures.length,
        runtimePaused: runtime.paused,
        walletAuth: true,
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
