import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { getDatabasePath } from "@/lib/database-path";
import { initialAgents } from "@/lib/zoo/species";
import type { Agent, AgentRun, Artifact, ZooEvent } from "@/lib/zoo/types";

const databasePath = getDatabasePath();
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
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

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

const storedLocale = db
  .prepare("SELECT value FROM app_metadata WHERE key = 'content_locale'")
  .get() as { value: string } | undefined;

if (storedLocale?.value !== "en-v2") {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(`
      DELETE FROM artifacts;
      DELETE FROM events;
      DELETE FROM agent_runs;
      UPDATE agents SET status = 'sleeping', feed = feed_max, last_awake_at = NULL;
    `);
    db.prepare(`
      INSERT INTO app_metadata (key, value) VALUES ('content_locale', 'en-v2')
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const insertAgent = db.prepare(`
  INSERT INTO agents (
    id, name, species, emoji, role, description, status,
    feed, feed_max, task, last_awake_at, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    species = excluded.species,
    emoji = excluded.emoji,
    role = excluded.role,
    description = excluded.description,
    task = excluded.task
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
    enclosureId: "habitat-01",
    ownerAddress: null,
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

export function getArtifact(id: string): Artifact | null {
  const row = db.prepare("SELECT * FROM artifacts WHERE id = ?").get(id) as ArtifactRow | undefined;
  return row ? mapArtifact(row) : null;
}

export function insertArtifact(input: {
  agentId: string;
  title: string;
  body: string;
  createdAt?: string;
}): Artifact {
  const artifact: Artifact = {
    id: randomUUID(),
    agentId: input.agentId,
    title: input.title,
    body: input.body,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO artifacts (id, agent_id, title, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    artifact.id,
    artifact.agentId,
    artifact.title,
    artifact.body,
    artifact.createdAt,
  );

  return artifact;
}

export function startAgentRun(input: {
  agentId: string;
  runId: string;
  provider: AgentRun["provider"];
  task: string;
  createdAt: string;
}): AgentRun {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = db
      .prepare(`
        UPDATE agents
        SET status = 'working', feed = feed - 1, last_awake_at = ?
        WHERE id = ? AND status = 'sleeping' AND feed > 0
      `)
      .run(input.createdAt, input.agentId);

    if (Number(result.changes) === 0) {
      const agent = getAgent(input.agentId);

      if (!agent) throw new Error("AGENT_NOT_FOUND");
      if (agent.feed <= 0) throw new Error("NO_FEED");
      throw new Error(`AGENT_UNAVAILABLE:${agent.status}`);
    }

    db.prepare(`
      INSERT INTO agent_runs (
        id, agent_id, task, provider, status, created_at
      ) VALUES (?, ?, ?, ?, 'running', ?)
    `).run(input.runId, input.agentId, input.task, input.provider, input.createdAt);

    insertEvent({
      agentId: input.agentId,
      type: "woke_up",
      summary: `Awakened with task: ${input.task}`,
      payload: { runId: input.runId, provider: input.provider },
      createdAt: input.createdAt,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getAgentRuns(input.agentId, 1)[0];
}

export function insertEvent(input: {
  agentId: string;
  targetAgentId?: string | null;
  type: ZooEvent["type"];
  summary: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}): ZooEvent {
  const event: ZooEvent = {
    id: randomUUID(),
    agentId: input.agentId,
    targetAgentId: input.targetAgentId ?? null,
    type: input.type,
    summary: input.summary,
    payload: input.payload ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO events (
      id, agent_id, target_agent_id, type, summary, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.agentId,
    event.targetAgentId,
    event.type,
    event.summary,
    JSON.stringify(event.payload),
    event.createdAt,
  );

  return event;
}

export function completeAgentRun(input: {
  agentId: string;
  runId: string;
  summary: string;
  completedAt: string;
}): void {
  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(`
      UPDATE agent_runs
      SET status = 'completed', summary = ?, completed_at = ?
      WHERE id = ?
    `).run(input.summary, input.completedAt, input.runId);

    db.prepare(`
      UPDATE agents SET status = 'sleeping', last_awake_at = ? WHERE id = ?
    `).run(input.completedAt, input.agentId);

    insertEvent({
      agentId: input.agentId,
      type: "went_to_sleep",
      summary: `Cycle completed: ${input.summary}`,
      payload: { runId: input.runId },
      createdAt: input.completedAt,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function failAgentRun(input: {
  agentId: string;
  runId: string;
  error: string;
  completedAt: string;
}): void {
  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(`
      UPDATE agent_runs
      SET status = 'failed', error = ?, completed_at = ?
      WHERE id = ?
    `).run(input.error, input.completedAt, input.runId);

    db.prepare("UPDATE agents SET status = 'error' WHERE id = ?").run(input.agentId);

    insertEvent({
      agentId: input.agentId,
      type: "warning",
      summary: `Cycle failed: ${input.error}`,
      payload: { runId: input.runId },
      createdAt: input.completedAt,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
