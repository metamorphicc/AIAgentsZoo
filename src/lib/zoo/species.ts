import type { Agent, SpeciesId } from "./types";

type SpeciesDefinition = {
  id: SpeciesId;
  name: string;
  emoji: string;
  role: string;
  description: string;
  defaultTask: string;
  instructions: string;
};

export const species: Record<SpeciesId, SpeciesDefinition> = {
  raven: {
    id: "raven",
    name: "Raven",
    emoji: "🐦‍⬛",
    role: "Scout",
    description: "Finds verifiable signals and routes useful observations to builders.",
    defaultTask: "Find three useful observations about the current habitat activity.",
    instructions:
      "You are Raven, a careful scout. Extract verifiable observations, never fabricate sources, and route useful signals to Beaver.",
  },
  beaver: {
    id: "beaver",
    name: "Beaver",
    emoji: "🦫",
    role: "Builder",
    description: "Turns incoming observations into small, inspectable artifacts.",
    defaultTask: "Build a short artifact from Raven’s latest observations.",
    instructions:
      "You are Beaver, a practical builder. Create clear Markdown artifacts using only received observations.",
  },
  owl: {
    id: "owl",
    name: "Owl",
    emoji: "🦉",
    role: "Archivist",
    description: "Compresses outcomes into memory and records what the network has tried.",
    defaultTask: "Summarize the habitat’s latest results into a short memory entry.",
    instructions:
      "You are Owl, the archivist. Store concise factual conclusions and identify the events they came from.",
  },
  meerkat: {
    id: "meerkat",
    name: "Meerkat",
    emoji: "🦦",
    role: "Sentinel",
    description: "Watches agent health, compute budgets, and stalled runs.",
    defaultTask: "Check habitat health and report any operational risks.",
    instructions:
      "You are Meerkat, the sentinel. Check statuses and budgets. Never modify another agent’s data; only report risks.",
  },
};

export const initialAgents: Agent[] = [
  {
    id: "raven-1",
    name: "Raven 01",
    species: "raven",
    emoji: species.raven.emoji,
    role: species.raven.role,
    description: species.raven.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    enclosureId: "habitat-01",
    controlAgentId: "grok-orchestrator",
    ownerAddress: null,
    task: species.raven.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "beaver-1",
    name: "Beaver 01",
    species: "beaver",
    emoji: species.beaver.emoji,
    role: species.beaver.role,
    description: species.beaver.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    enclosureId: "habitat-01",
    controlAgentId: "grok-orchestrator",
    ownerAddress: null,
    task: species.beaver.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "owl-1",
    name: "Owl 01",
    species: "owl",
    emoji: species.owl.emoji,
    role: species.owl.role,
    description: species.owl.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    enclosureId: "habitat-01",
    controlAgentId: "grok-orchestrator",
    ownerAddress: null,
    task: species.owl.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "meerkat-1",
    name: "Meerkat 01",
    species: "meerkat",
    emoji: species.meerkat.emoji,
    role: species.meerkat.role,
    description: species.meerkat.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    enclosureId: "habitat-01",
    controlAgentId: "grok-orchestrator",
    ownerAddress: null,
    task: species.meerkat.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
];
