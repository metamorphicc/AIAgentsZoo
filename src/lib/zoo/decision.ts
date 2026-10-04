import { z } from "zod";

export const decisionEventTypes = ["observation", "sighting", "request", "warning"] as const;

export const agentDecisionSchema = z.object({
  summary: z.string().min(1).max(500),
  events: z
    .array(
      z.object({
        type: z.enum(decisionEventTypes),
        summary: z.string().min(1).max(500),
        targetAgentId: z.string().nullable(),
        details: z.array(z.string().max(300)).max(5),
      }),
    )
    .max(3),
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;
