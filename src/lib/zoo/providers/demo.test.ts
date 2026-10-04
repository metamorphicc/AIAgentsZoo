import { describe, expect, it } from "vitest";

import { initialAgents } from "../species";
import { agentDecisionSchema } from "../decision";
import { createDemoDecision } from "./demo";

describe("createDemoDecision", () => {
  it.each(initialAgents)("creates a valid decision for $species", (agent) => {
    const result = createDemoDecision({
      agent,
      task: agent.task,
      recentEvents: [],
    });

    expect(agentDecisionSchema.safeParse(result).success).toBe(true);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events.length).toBeLessThanOrEqual(3);
  });

  it("passes Raven's signal to Beaver", () => {
    const raven = initialAgents.find((agent) => agent.species === "raven");
    expect(raven).toBeDefined();

    const result = createDemoDecision({
      agent: raven!,
      task: raven!.task,
      recentEvents: [],
    });

    expect(result.events.some((event) => event.targetAgentId === "beaver-1")).toBe(true);
  });
});
