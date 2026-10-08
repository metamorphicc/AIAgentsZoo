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
        provider: process.env.AGENT_PROVIDER === "openai" ? "openai" : "local",
        agents: agents.length,
        enclosures: enclosures.length,
        runtimePaused: runtime.paused,
        walletAuth: true,
        checkedAt: new Date().toISOString(),
      },
      { status: durable ? 200 : 206 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Storage health check failed" },
      { status: 503 },
    );
  }
}
