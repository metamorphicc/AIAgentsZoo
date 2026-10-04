import { randomUUID } from "node:crypto";

import {
  completeAgentRun,
  failAgentRun,
  getAgent,
  getAgentEvents,
  getAgentRuns,
  getArtifacts,
  getRecentEvents,
  insertArtifact,
  insertEvent,
  startAgentRun,
} from "@/lib/db";

import { createDemoDecision } from "./providers/demo";
import { createOpenAIDecision } from "./providers/openai";

export class AgentRunError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "NO_FEED" | "UNAVAILABLE" | "FAILED",
    message: string,
  ) {
    super(message);
    this.name = "AgentRunError";
  }
}

export async function runAgentCycle(agentId: string, taskOverride?: string) {
  const agent = getAgent(agentId);

  if (!agent) throw new AgentRunError("NOT_FOUND", "Agent not found");

  const task = taskOverride?.trim() || agent.task;
  const provider = process.env.AGENT_PROVIDER === "openai" ? "openai" : "demo";
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  try {
    startAgentRun({ agentId, runId, provider, task, createdAt: startedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "AGENT_NOT_FOUND") {
      throw new AgentRunError("NOT_FOUND", "Agent not found");
    }
    if (message === "NO_FEED") {
      throw new AgentRunError("NO_FEED", "This agent has no compute feed left");
    }
    if (message.startsWith("AGENT_UNAVAILABLE:")) {
      throw new AgentRunError(
        "UNAVAILABLE",
        `Agent is currently unavailable: ${message.split(":")[1]}`,
      );
    }
    throw error;
  }

  try {
    const recentEvents = getRecentEvents(10);
    const decision =
      provider === "openai"
        ? await createOpenAIDecision({ agent, task, recentEvents })
        : createDemoDecision({ agent, task, recentEvents });

    for (const event of decision.events) {
      const targetAgentId = event.targetAgentId && getAgent(event.targetAgentId)
        ? event.targetAgentId
        : null;

      insertEvent({
        agentId,
        targetAgentId,
        type: event.type,
        summary: event.summary,
        payload: { details: event.details, runId },
      });
    }

    if (agent.species === "beaver") {
      const lastArtifactAt = getArtifacts(20)
        .find((artifact) => artifact.agentId === agent.id)?.createdAt;
      const incomingSignals = recentEvents
        .filter((event) =>
          event.targetAgentId === agent.id
          && (!lastArtifactAt || event.createdAt > lastArtifactAt)
        )
        .slice(0, 3);

      if (incomingSignals.length > 0) {
        const artifact = insertArtifact({
          agentId,
          title: "Habitat field note",
          body: incomingSignals
            .map((event) => `- ${event.summary}`)
            .join("\n"),
        });

        insertEvent({
          agentId,
          type: "artifact",
          summary: `Beaver published “${artifact.title}” from ${incomingSignals.length} incoming signal${incomingSignals.length === 1 ? "" : "s"}.`,
          payload: { artifactId: artifact.id, sourceEventIds: incomingSignals.map((event) => event.id), runId },
        });
      }
    }

    completeAgentRun({
      agentId,
      runId,
      summary: decision.summary,
      completedAt: new Date().toISOString(),
    });

    return {
      agent: getAgent(agentId),
      run: getAgentRuns(agentId, 1)[0],
      events: getAgentEvents(agentId, 10),
      artifacts: getArtifacts(10).filter((artifact) => artifact.agentId === agentId),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown runtime error";

    failAgentRun({
      agentId,
      runId,
      error: message,
      completedAt: new Date().toISOString(),
    });

    throw new AgentRunError("FAILED", message);
  }
}
