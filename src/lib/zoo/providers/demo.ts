import { agentDecisionSchema, type AgentDecision } from "../decision";
import type { Agent, ControlAgent, ZooEvent } from "../types";

type DemoContext = {
  agent: Agent;
  task: string;
  recentEvents: ZooEvent[];
  controlAgent?: ControlAgent | null;
  headAgent?: ControlAgent | null;
};

export function createDemoDecision({ agent, task, recentEvents, controlAgent, headAgent }: DemoContext): AgentDecision {
  const recentCount = recentEvents.length;
  const agentContext = controlAgent
    ? `${controlAgent.name} (${controlAgent.role}) operates this pet`
    : "The species blueprint operates this pet";
  const headContext = headAgent ? `${headAgent.name} coordinates the enclosure` : "The enclosure has no head agent";

  const decisions: Record<Agent["species"], AgentDecision> = {
    raven: {
      summary: "Collected observations and routed a useful signal to Beaver.",
      events: [
        {
          type: "observation",
          summary: `Raven recorded its active task: ${task}`,
          targetAgentId: null,
          details: ["This is a deterministic observation with no external search.", agentContext, headContext],
        },
        {
          type: "sighting",
          summary: "The MVP proves a public trace, bounded compute feed, and one complete agent cycle.",
          targetAgentId: "beaver-1",
          details: ["The signal was routed to Beaver as input for a future artifact."],
        },
      ],
    },
    beaver: {
      summary: "Reviewed incoming events and prepared a small artifact plan.",
      events: [
        {
          type: "observation",
          summary: `Beaver can read ${recentCount} recent events from the shared ledger.`,
          targetAgentId: null,
          details: ["Artifact creation is the next extension of this cycle.", agentContext, headContext],
        },
      ],
    },
    owl: {
      summary: "Compressed the current habitat state into a short memory record.",
      events: [
        {
          type: "observation",
          summary: `Memory includes ${recentCount} recent events; active task: ${task}`,
          targetAgentId: null,
          details: ["This record was derived only from the local event ledger.", agentContext, headContext],
        },
      ],
    },
    meerkat: {
      summary: "Checked habitat health and completed the watch cycle.",
      events: [
        {
          type: "observation",
          summary: `Meerkat inspected a ledger window of ${recentCount} events.`,
          targetAgentId: null,
          details: ["No critical issues were detected in the demo cycle.", agentContext, headContext],
        },
      ],
    },
  };

  return agentDecisionSchema.parse(decisions[agent.species]);
}
