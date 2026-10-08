import { describe, expect, it } from "vitest";
import { initialAgents } from "../species";
import { createLocalDecision } from "./local";

describe("ledger-based species work", () => {
  it("does not invent a builder or an external search", () => {
    const raven = { ...initialAgents[0], id: "custom-raven", enclosureId: "custom" };
    const result = createLocalDecision({ agent: raven, task: "Inspect", enclosureAgents: [raven], enclosure: null, recentEvents: [], incomingSignals: [] });
    expect(result.events.every((event) => event.targetAgentId === null)).toBe(true);
    expect(result.summary).toContain("no builder");
  });
  it("routes to the actual builder in the same enclosure", () => {
    const builder = { ...initialAgents[1], id: "my-builder" };
    const result = createLocalDecision({ agent: initialAgents[0], task: "Inspect", enclosureAgents: [initialAgents[0], builder], enclosure: null, recentEvents: [], incomingSignals: [] });
    expect(result.events.some((event) => event.targetAgentId === "my-builder")).toBe(true);
    expect(result.summary).not.toContain("beaver-1");
  });
  it("reports actual exhausted budgets", () => {
    const result = createLocalDecision({ agent: initialAgents[3], task: "Check", enclosureAgents: [{ ...initialAgents[0], feed: 0 }], enclosure: null, recentEvents: [], incomingSignals: [] });
    expect(result.events[0].type).toBe("warning");
    expect(result.events[0].summary).toContain("0 feed");
  });
});
