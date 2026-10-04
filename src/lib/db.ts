import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { initialAgents } from "@/lib/zoo/species";
import type { Agent, AgentRun, Artifact, ZooEvent } from "@/lib/zoo/types";

const databasePath = process.env.DATABASE_PATH
  ? resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : join(process.cwd(), "data", "zoo.db");
mkdirSync(dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & {
  zooDatabase?: DatabaseSync;
};

export const db = globalDatabase.zooDatabase ?? new DatabaseSync(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.zooDatabase = db;
}

db.exec("PRAGMA busy_timeout = 5000");
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    emoji TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sleeping',
    feed INTEGER NOT NULL DEFAULT 10,
    feed_max INTEGER NOT NULL DEFAULT 10,
    task TEXT NOT NULL,
    last_awake_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    target_agent_id TEXT REFERENCES agents(id),
    type TEXT NOT NULL,
    summary TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    task TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS events_agent_created_idx
    ON events(agent_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS runs_agent_created_idx
    ON agent_runs(agent_id, created_at DESC);
`);

const insertAgent = db.prepare(`
  INSERT OR IGNORE INTO agents (
    id, name, species, emoji, role, description, status,
    feed, feed_max, task, last_awake_at, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const agent of initialAgents) {
  insertAgent.run(
    agent.id,
    agent.name,
    agent.species,
    agent.emoji,
    agent.role,
    agent.description,
    agent.status,
    agent.feed,
    agent.feedMax,
    agent.task,
    agent.lastAwakeAt,
    agent.createdAt,
  );
}

type AgentRow = {
  id: string;
  name: string;
  species: Agent["species"];
  emoji: string;
  role: string;
  description: string;
  status: Agent["status"];
  feed: number;
  feed_max: number;
  task: string;
  last_awake_at: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  agent_id: string;
  target_agent_id: string | null;
  type: ZooEvent["type"];
  summary: string;
  payload_json: string;
  created_at: string;
};

type RunRow = {
  id: string;
  agent_id: string;
  task: string;
  provider: AgentRun["provider"];
  status: AgentRun["status"];
  summary: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

type ArtifactRow = {
  id: string;
  agent_id: string;
  title: string;
  body: string;
  created_at: string;
};

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    emoji: row.emoji,
    role: row.role,
    description: row.description,
    status: row.status,
    feed: row.feed,
    feedMax: row.feed_max,
    task: row.task,
    lastAwakeAt: row.last_awake_at,
    createdAt: row.created_at,
  };
}

function mapEvent(row: EventRow): ZooEvent {
  return {
    id: row.id,
    agentId: row.agent_id,
    targetAgentId: row.target_agent_id,
    type: row.type,
    summary: row.summary,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

function mapRun(row: RunRow): AgentRun {
  return {
    id: row.id,
    agentId: row.agent_id,
    task: row.task,
    provider: row.provider,
    status: row.status,
    summary: row.summary,
    error: row.error,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    agentId: row.agent_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function getAgents(): Agent[] {
  return (db.prepare("SELECT * FROM agents ORDER BY created_at, id").all() as AgentRow[]).map(mapAgent);
}

export function getAgent(id: string): Agent | null {
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as AgentRow | undefined;
  return row ? mapAgent(row) : null;
}

export function getRecentEvents(limit = 20): ZooEvent[] {
  return (
    db.prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT ?").all(limit) as EventRow[]
  ).map(mapEvent);
}

export function getAgentEvents(agentId: string, limit = 50): ZooEvent[] {
  return (
    db
      .prepare("SELECT * FROM events WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(agentId, limit) as EventRow[]
  ).map(mapEvent);
}

export function getAgentRuns(agentId: string, limit = 20): AgentRun[] {
  return (
    db
      .prepare("SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(agentId, limit) as RunRow[]
  ).map(mapRun);
}

export function getArtifacts(limit = 20): Artifact[] {
  return (
    db.prepare("SELECT * FROM artifacts ORDER BY created_at DESC LIMIT ?").all(limit) as ArtifactRow[]
  ).map(mapArtifact);
}
