import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let store: typeof import("../zoo-store");
let runCycle: typeof import("./run-agent").runAgentCycle;
const owner = "0x0000000000000000000000000000000000000001";

beforeAll(async () => {
  // libSQL's in-memory connection never touches local or production records.
  vi.stubEnv("TURSO_DATABASE_URL", "file::memory:");
  vi.stubEnv("TURSO_AUTH_TOKEN", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("AGENT_PROVIDER", "local");
  vi.stubEnv("RUNTIME_DAILY_CYCLE_LIMIT", "500");
  store = await import("../zoo-store");
  await store.ensureZooStoreReady();
  runCycle = (await import("./run-agent")).runAgentCycle;
});

afterAll(() => {
  store?.zooStore.close();
  vi.unstubAllEnvs();
});

describe("launch runtime boundaries", () => {
  it("publishes a sourced field note and memory through four real local cycles", async () => {
    for (const id of ["raven-1", "beaver-1", "owl-1", "meerkat-1"]) await runCycle(id, "Inspect the founding enclosure.");
    const artifacts = await store.getArtifacts();
    expect(artifacts.some((artifact) => artifact.agentId === "beaver-1" && artifact.body.includes("Source event:"))).toBe(true);
    expect(artifacts.some((artifact) => artifact.agentId === "owl-1" && artifact.body.includes("artifact:"))).toBe(true);
    const count = artifacts.length;
    await runCycle("beaver-1");
    expect((await store.getArtifacts()).length).toBe(count);
    expect((await store.getAgent("raven-1"))?.feed).toBe(9);
  });

  it("does not duplicate a replayed habitat request", async () => {
    const id = randomUUID();
    await store.claimHabitatRun(id, "habitat-01", "Inspect");
    await expect(runCycle("raven-1")).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(store.claimHabitatRun(randomUUID(), "habitat-01", "Inspect")).rejects.toThrow("HABITAT_BUSY");
    await store.finishHabitatRun(id, "completed");
    await expect(store.claimHabitatRun(id, "habitat-01", "Inspect")).rejects.toThrow("HABITAT_BUSY");
  });

  it("enforces enclosure quotas and rejects assignments across owners", async () => {
    for (let i = 0; i < 3; i++) await store.createEnclosure({ name: `Research ${i}`, description: "Research territory", territory: "Shared ledger", ownerAddress: owner });
    await expect(store.createEnclosure({ name: "Overflow", description: "Research territory", territory: "Shared ledger", ownerAddress: owner })).rejects.toThrow("RESOURCE_LIMIT");
    await expect(store.createAgent({ name: "Intruder", species: "raven", feedMax: 10, enclosureId: "habitat-01", ownerAddress: owner })).rejects.toThrow("ENCLOSURE_FORBIDDEN");
  });

  it("cannot bypass a daily cycle cap by refilling feed", async () => {
    vi.stubEnv("RUNTIME_DAILY_CYCLE_LIMIT", "1");
    await store.refillAgent("raven-1");
    await expect(runCycle("raven-1")).rejects.toMatchObject({ code: "LIMIT" });
    vi.stubEnv("RUNTIME_DAILY_CYCLE_LIMIT", "500");
  });

  it("hides a custom enclosure and its residents, trace, and outputs without deleting them", async () => {
    const enclosure = (await store.getEnclosures()).find((item) => item.ownerAddress === owner)!;
    const animal = await store.createAgent({ name: "Local scout", species: "raven", feedMax: 10, enclosureId: enclosure.id, ownerAddress: owner });
    const artifact = await store.insertArtifact({ agentId: animal.id, title: "Record", body: "A local record" });
    await store.insertEvent({ agentId: animal.id, type: "observation", summary: "A local observation" });
    await store.setResourceVisibility("enclosure", enclosure.id, true, owner);
    expect(await store.getAgent(animal.id)).toBeNull();
    expect(await store.getArtifact(artifact.id)).toBeNull();
    expect((await store.getRecentEvents(100)).some((event) => event.agentId === animal.id)).toBe(false);
    expect((await store.getEnclosures(true)).find((item) => item.id === enclosure.id)?.hidden).toBe(true);
    await store.setResourceVisibility("enclosure", enclosure.id, false, owner);
    expect(await store.getArtifact(artifact.id)).not.toBeNull();
  });
});
