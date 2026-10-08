import type { Agent, Artifact, SpeciesId } from "./types";

export const workflowSpecies: SpeciesId[] = ["raven", "beaver", "owl", "meerkat"];

export function workflowResidents(agents: Agent[]) {
  return workflowSpecies.flatMap((species) => {
    const animal = agents.find((candidate) => candidate.species === species);
    return animal ? [animal] : [];
  });
}

export function isReadyForCycle(agent: Agent, now = Date.now()) {
  return agent.feed > 0 && (agent.status === "sleeping" || agent.status === "error"
    || (agent.status === "working" && Boolean(agent.lastAwakeAt) && now - Date.parse(agent.lastAwakeAt!) >= 180_000));
}

export type WorkflowUpdate =
  | { type: "started"; mission: string; runId: string }
  | { type: "running"; agentId: string; species: SpeciesId; name: string }
  | { type: "completed"; agentId: string; species: SpeciesId; name: string; summary: string; artifactIds: string[] }
  | { type: "finished"; artifacts: Artifact[]; cycles: number }
  | { type: "error"; error: string };
