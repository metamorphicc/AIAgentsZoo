import { randomUUID } from "node:crypto";

import {
  completeAgentRun,
  failAgentRun,
  getAgent,
  getControlAgent,
  getAgentEvents,
  getEnclosureAgents,
  getAgentRuns,
  getAgentArtifacts,
  getEnclosure,
  getEnclosureEvents,
  getIncomingSignals,
  getRuntimeControl,
  insertArtifact,
  insertEvent,
  startAgentRun,
} from "@/lib/zoo-store";

import { createLocalDecision } from "./providers/local";
import { createOpenAIDecision } from "./providers/openai";

export class AgentRunError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "NO_FEED" | "UNAVAILABLE" | "PAUSED" | "LIMIT" | "FAILED",
    message: string,
  ) {
    super(message);
    this.name = "AgentRunError";
  }
}

export async function runAgentCycle(agentId: string, taskOverride?: string, habitatRunId?: string) {
  const runtime = await getRuntimeControl();
  if (runtime.paused) {
    throw new AgentRunError("PAUSED", "The habitat runtime is paused by an administrator");
  }
  const agent = await getAgent(agentId);

  if (!agent) throw new AgentRunError("NOT_FOUND", "Agent not found");

  const task = taskOverride?.trim() || agent.task;
  const provider = process.env.AGENT_PROVIDER === "openai" ? "openai" : "local";
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  try {
    await startAgentRun({ agentId, runId, provider, task, createdAt: startedAt, habitatRunId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "AGENT_NOT_FOUND") {
      throw new AgentRunError("NOT_FOUND", "Agent not found");
    }
    if (message === "NO_FEED") {
      throw new AgentRunError("NO_FEED", "This agent has no compute feed left");
    }
    if (message === "CYCLE_LIMIT") throw new AgentRunError("LIMIT", "The runtime cycle allowance has been reached. Try again in the next budget window.");
    if (message === "HABITAT_BUSY") throw new AgentRunError("UNAVAILABLE", "This enclosure already has a workflow in progress.");
    if (message.startsWith("AGENT_UNAVAILABLE:")) {
      throw new AgentRunError(
        "UNAVAILABLE",
        `Agent is currently unavailable: ${message.split(":")[1]}`,
      );
    }
    throw error;
  }

  try {
    const [recentEvents, enclosure, enclosureAgents, controlAgent, lastArtifacts] = await Promise.all([
      getEnclosureEvents(agent.enclosureId, 30),
      getEnclosure(agent.enclosureId),
      getEnclosureAgents(agent.enclosureId),
      agent.controlAgentId ? getControlAgent(agent.controlAgentId) : null,
      getAgentArtifacts(agent.id, 1),
    ]);
    const incomingSignals = await getIncomingSignals(agent.id, lastArtifacts[0]?.createdAt);
    const headAgent = enclosure?.headAgentId ? await getControlAgent(enclosure.headAgentId) : null;
    const decision =
      provider === "openai"
        ? await createOpenAIDecision({ agent, task, recentEvents, controlAgent, headAgent, enclosureAgents })
        : createLocalDecision({ agent, task, recentEvents, enclosureAgents, enclosure, incomingSignals });

    for (const event of decision.events) {
      const requestedTarget = event.targetAgentId ? await getAgent(event.targetAgentId) : null;
      if (event.targetAgentId && (!requestedTarget || requestedTarget.enclosureId !== agent.enclosureId)) {
        await insertEvent({ agentId, type: "warning", summary: "A handoff was rejected because its recipient is outside this enclosure.", payload: { runId } });
        continue;
      }
      const targetAgentId = requestedTarget?.id ?? null;

      await insertEvent({
        agentId,
        targetAgentId,
        type: event.type,
        summary: event.summary,
        payload: {
          details: event.details,
          runId,
          controlAgentId: controlAgent?.id ?? null,
          headAgentId: headAgent?.id ?? null,
        },
      });
    }

    if (agent.species === "beaver") {
      if (incomingSignals.length > 0) {
        const artifact = await insertArtifact({
          agentId,
          title: `${enclosure?.name ?? "Habitat"} — field note`,
          body: [`Mission: ${task}`, `Territory: ${enclosure?.territory ?? agent.enclosureId}`, "", "Observations", ...incomingSignals.map((event) => `- ${event.summary}\n  Source event: ${event.id}`)].join("\n"),
        });
        const archivist = enclosureAgents.find((resident) => resident.species === "owl");

        await insertEvent({
          agentId,
          targetAgentId: archivist?.id ?? null,
          type: "artifact",
          summary: `Beaver published “${artifact.title}” from ${incomingSignals.length} incoming signal${incomingSignals.length === 1 ? "" : "s"}.`,
          payload: { artifactId: artifact.id, sourceEventIds: incomingSignals.map((event) => event.id), runId },
        });
        if (archivist) await insertEvent({ agentId, targetAgentId: archivist.id, type: "request", summary: `Archive the field note: ${artifact.title}.`, payload: { artifactId: artifact.id, runId } });
      }
    }

    if (agent.species === "owl") {
      const sources = recentEvents.filter((event) => event.type === "artifact" && (!lastArtifacts[0] || event.createdAt > lastArtifacts[0].createdAt)).slice(0, 5);
      if (sources.length) {
        const memory = await insertArtifact({ agentId, title: `${enclosure?.name ?? "Habitat"} — memory record`, body: [`Mission: ${task}`, "", "Recorded outputs", ...sources.map((event) => `- ${event.summary}\n  Source event: ${event.id}; artifact: ${String(event.payload.artifactId ?? "")}`)].join("\n") });
        const sentinel = enclosureAgents.find((resident) => resident.species === "meerkat");
        await insertEvent({ agentId, targetAgentId: sentinel?.id ?? null, type: "artifact", summary: `${agent.name} published a memory record referencing ${sources.length} output(s).`, payload: { artifactId: memory.id, sourceEventIds: sources.map((event) => event.id), runId } });
      }
    }

    await completeAgentRun({
      agentId,
      runId,
      summary: decision.summary,
      completedAt: new Date().toISOString(),
    });

    return {
      agent: await getAgent(agentId),
      run: (await getAgentRuns(agentId, 1))[0],
      events: await getAgentEvents(agentId, 10),
      artifacts: await getAgentArtifacts(agentId),
    };
  } catch {
    const message = "The cycle could not finish. Check the runtime configuration and retry.";

    await failAgentRun({
      agentId,
      runId,
      error: message,
      completedAt: new Date().toISOString(),
    });

    throw new AgentRunError("FAILED", message);
  }
}
