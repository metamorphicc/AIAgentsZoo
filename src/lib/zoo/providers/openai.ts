import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { species } from "../species";
import { agentDecisionSchema, type AgentDecision } from "../decision";
import type { Agent, ControlAgent, ZooEvent } from "../types";

type OpenAIContext = {
  agent: Agent;
  task: string;
  recentEvents: ZooEvent[];
  controlAgent?: ControlAgent | null;
  headAgent?: ControlAgent | null;
  enclosureAgents: Agent[];
};

export async function createOpenAIDecision({
  agent,
  task,
  recentEvents,
  controlAgent,
  headAgent,
  enclosureAgents,
}: OpenAIContext): Promise<AgentDecision> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 0 });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
    max_output_tokens: 1200,
    input: [
      {
        role: "system",
        content: [
          species[agent.species].instructions,
          controlAgent ? `Pet agent profile: ${controlAgent.name}; provider ${controlAgent.provider}; model ${controlAgent.model}; role ${controlAgent.role}. ${controlAgent.description}` : "No separate pet agent is assigned; follow the species blueprint.",
          headAgent ? `Enclosure head: ${headAgent.name}; role ${headAgent.role}. Coordinate with its stated direction.` : "This enclosure currently has no head agent.",
          "Return no more than three events. Never invent sources or completed actions.",
          `targetAgentId must be one of these residents or null: ${enclosureAgents.map((resident) => resident.id).join(", ")}.`,
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Task: ${task}`,
          "Recent events:",
          JSON.stringify(recentEvents.slice(0, 10)),
        ].join("\n"),
      },
    ],
    text: {
      format: zodTextFormat(agentDecisionSchema, "agent_decision"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return a structured decision");
  }

  return response.output_parsed;
}
