import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { species } from "../species";
import { agentDecisionSchema, type AgentDecision } from "../decision";
import type { Agent, ZooEvent } from "../types";

type OpenAIContext = {
  agent: Agent;
  task: string;
  recentEvents: ZooEvent[];
};

export async function createOpenAIDecision({
  agent,
  task,
  recentEvents,
}: OpenAIContext): Promise<AgentDecision> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
    input: [
      {
        role: "system",
        content: [
          species[agent.species].instructions,
          "Return no more than three events. Never invent sources or completed actions.",
          "targetAgentId must be raven-1, beaver-1, owl-1, meerkat-1, or null.",
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
