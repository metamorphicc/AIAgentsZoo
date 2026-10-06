export const speciesIds = ["raven", "beaver", "owl", "meerkat"] as const;
export type SpeciesId = (typeof speciesIds)[number];

export const agentStatuses = ["sleeping", "working", "paused", "error"] as const;
export type AgentStatus = (typeof agentStatuses)[number];

export const eventTypes = [
  "woke_up",
  "observation",
  "sighting",
  "request",
  "artifact",
  "feed_refilled",
  "warning",
  "went_to_sleep",
] as const;
export type ZooEventType = (typeof eventTypes)[number];

export type Agent = {
  id: string;
  name: string;
  species: SpeciesId;
  emoji: string;
  role: string;
  description: string;
  status: AgentStatus;
  feed: number;
  feedMax: number;
  enclosureId: string;
  ownerAddress: string | null;
  task: string;
  lastAwakeAt: string | null;
  createdAt: string;
};

export type Enclosure = {
  id: string;
  name: string;
  description: string;
  territory: string;
  ownerAddress: string | null;
  agentCount: number;
  feed: number;
  feedMax: number;
  createdAt: string;
};

export type AuthRole = "guardian" | "admin";

export type AuthSession = {
  address: string;
  role: AuthRole;
  expiresAt: string;
};

export type RuntimeControl = {
  paused: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
};

export type ZooEvent = {
  id: string;
  agentId: string;
  targetAgentId: string | null;
  type: ZooEventType;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  agentId: string;
  task: string;
  provider: "demo" | "openai";
  status: "running" | "completed" | "failed";
  summary: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type Artifact = {
  id: string;
  agentId: string;
  title: string;
  body: string;
  createdAt: string;
};
