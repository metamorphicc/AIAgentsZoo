import { agentDecisionSchema, type AgentDecision } from "../decision";
import type { Agent, Enclosure, ZooEvent } from "../types";

type LocalContext = {
  agent: Agent;
  task: string;
  recentEvents: ZooEvent[];
  enclosureAgents: Agent[];
  enclosure: Enclosure | null;
  incomingSignals: ZooEvent[];
};

// Species rules operate on the actual local ledger, with no invented external sources.
export function createLocalDecision({ agent, task, recentEvents, enclosureAgents, enclosure, incomingSignals }: LocalContext): AgentDecision {
  const details = [`Task: ${task.slice(0, 280)}`, `Territory: ${enclosure?.territory ?? agent.enclosureId}`];
  const builder = enclosureAgents.find((resident) => resident.species === "beaver" && resident.id !== agent.id);
  const problems = enclosureAgents.filter((resident) => resident.status === "error" || resident.feed <= 0);
  const observation = `${enclosureAgents.length} residents; ${enclosureAgents.reduce((sum, resident) => sum + resident.feed, 0)} feed available; ${recentEvents.length} ledger records inspected.`;
  const decisions: Record<Agent["species"], AgentDecision> = {
    raven: {
      summary: builder ? `Inspected the habitat ledger and sent an observation to ${builder.name}.` : "Inspected the habitat ledger; no builder is assigned in this enclosure.",
      events: [
        { type: "observation", summary: `${agent.name} inspected ${enclosure?.name ?? "the enclosure"}: ${observation}`, targetAgentId: null, details },
        ...(builder ? [{ type: "sighting" as const, summary: `Mission: ${task.slice(0, 280)}. Habitat snapshot: ${observation}`, targetAgentId: builder.id, details: ["Source: this enclosure's resident records and event ledger."] }] : []),
      ],
    },
    beaver: {
      summary: incomingSignals.length ? `Reviewed ${incomingSignals.length} incoming signal(s) for a field note.` : "Checked the inbox; no new signals are available to build from.",
      events: [{ type: "observation", summary: `${agent.name} checked ${incomingSignals.length} new incoming signal(s).`, targetAgentId: null, details }],
    },
    owl: {
      summary: `Reviewed ${recentEvents.length} enclosure events for the memory record.`,
      events: [{ type: "observation", summary: `${agent.name} indexed ${recentEvents.length} enclosure events.`, targetAgentId: null, details }],
    },
    meerkat: {
      summary: problems.length ? `Health check found ${problems.length} resident(s) needing attention.` : "Checked resident status and feed; no exhausted or failed residents were found.",
      events: [{ type: problems.length ? "warning" : "observation", summary: (problems.length ? `Attention: ${problems.map((resident) => `${resident.name} (${resident.status}, ${resident.feed} feed)`).join(", ")}.` : `${agent.name} checked ${enclosureAgents.length} resident(s): budgets available, no error states.`).slice(0, 500), targetAgentId: null, details }],
    },
  };
  return agentDecisionSchema.parse(decisions[agent.species]);
}
