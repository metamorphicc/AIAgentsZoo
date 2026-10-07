import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { createClient, type Client, type InStatement, type Row } from "@libsql/client";

import { getDatabasePath } from "@/lib/database-path";
import { initialAgents, species } from "@/lib/zoo/species";
import type {
  Agent,
  AgentRun,
  Artifact,
  AuthRole,
  AuthSession,
  ControlAgent,
  ControlAgentProvider,
  Enclosure,
  RuntimeControl,
  SpeciesId,
  ZooEvent,
} from "@/lib/zoo/types";

const remoteUrl = process.env.TURSO_DATABASE_URL?.trim() || undefined;
export const storageMode = remoteUrl ? "turso" : process.env.VERCEL ? "ephemeral" : "local-libsql";
const localPath = getDatabasePath({
  DATABASE_PATH: process.env.DATABASE_PATH,
  VERCEL: remoteUrl ? undefined : process.env.VERCEL,
});

if (!remoteUrl) mkdirSync(dirname(localPath), { recursive: true });

const globalStore = globalThis as typeof globalThis & {
  zooStoreClient?: Client;
  zooStoreReady?: Promise<void>;
};

export const zooStore = globalStore.zooStoreClient ?? createClient({
  url: remoteUrl ?? `file:${localPath.replaceAll("\\", "/")}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
  timeout: 5000,
});

if (process.env.NODE_ENV !== "production") globalStore.zooStoreClient = zooStore;

const defaultEnclosure = {
  id: "habitat-01",
  name: "Habitat 01",
  description: "The founding enclosure for Grok's four autonomous species.",
  territory: "Shared local event ledger",
  headAgentId: "grok-orchestrator",
  createdAt: "2026-10-04T00:00:00.000Z",
};

const defaultControlAgent: ControlAgent = {
  id: "grok-orchestrator",
  name: "Grok",
  provider: "grok",
  model: "Grok",
  role: "Head orchestrator",
  description: "Routes intent across the founding habitat and coordinates its four specialist pets.",
  endpointUrl: null,
  ownerAddress: null,
  createdAt: "2026-10-04T00:00:00.000Z",
};

function value(row: Row, key: string) {
  return row[key];
}

async function ensureColumn(table: "agents" | "enclosures", column: string, definition: string) {
  const columns = await zooStore.execute(`PRAGMA table_info(${table})`);
  if (columns.rows.some((row) => String(value(row, "name")) === column)) return;
  try {
    await zooStore.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (error) {
    const refreshed = await zooStore.execute(`PRAGMA table_info(${table})`);
    if (!refreshed.rows.some((row) => String(value(row, "name")) === column)) throw error;
  }
}

function mapAgent(row: Row): Agent {
  return {
    id: String(value(row, "id")),
    name: String(value(row, "name")),
    species: String(value(row, "species")) as SpeciesId,
    emoji: String(value(row, "emoji")),
    role: String(value(row, "role")),
    description: String(value(row, "description")),
    status: String(value(row, "status")) as Agent["status"],
    feed: Number(value(row, "feed")),
    feedMax: Number(value(row, "feed_max")),
    enclosureId: String(value(row, "enclosure_id") ?? defaultEnclosure.id),
    controlAgentId: value(row, "control_agent_id") ? String(value(row, "control_agent_id")) : null,
    ownerAddress: value(row, "owner_address") ? String(value(row, "owner_address")) : null,
    task: String(value(row, "task")),
    lastAwakeAt: value(row, "last_awake_at") ? String(value(row, "last_awake_at")) : null,
    createdAt: String(value(row, "created_at")),
  };
}

function mapControlAgent(row: Row): ControlAgent {
  return {
    id: String(value(row, "id")),
    name: String(value(row, "name")),
    provider: String(value(row, "provider")) as ControlAgentProvider,
    model: String(value(row, "model")),
    role: String(value(row, "role")),
    description: String(value(row, "description")),
    endpointUrl: value(row, "endpoint_url") ? String(value(row, "endpoint_url")) : null,
    ownerAddress: value(row, "owner_address") ? String(value(row, "owner_address")) : null,
    createdAt: String(value(row, "created_at")),
  };
}

function mapEvent(row: Row): ZooEvent {
  return {
    id: String(value(row, "id")),
    agentId: String(value(row, "agent_id")),
    targetAgentId: value(row, "target_agent_id") ? String(value(row, "target_agent_id")) : null,
    type: String(value(row, "type")) as ZooEvent["type"],
    summary: String(value(row, "summary")),
    payload: JSON.parse(String(value(row, "payload_json") ?? "{}")) as Record<string, unknown>,
    createdAt: String(value(row, "created_at")),
  };
}

function mapRun(row: Row): AgentRun {
  return {
    id: String(value(row, "id")),
    agentId: String(value(row, "agent_id")),
    task: String(value(row, "task")),
    provider: String(value(row, "provider")) as AgentRun["provider"],
    status: String(value(row, "status")) as AgentRun["status"],
    summary: value(row, "summary") ? String(value(row, "summary")) : null,
    error: value(row, "error") ? String(value(row, "error")) : null,
    createdAt: String(value(row, "created_at")),
    completedAt: value(row, "completed_at") ? String(value(row, "completed_at")) : null,
  };
}

function mapArtifact(row: Row): Artifact {
  return {
    id: String(value(row, "id")),
    agentId: String(value(row, "agent_id")),
    title: String(value(row, "title")),
    body: String(value(row, "body")),
    createdAt: String(value(row, "created_at")),
  };
}

function mapEnclosure(row: Row): Enclosure {
  return {
    id: String(value(row, "id")),
    name: String(value(row, "name")),
    description: String(value(row, "description")),
    territory: String(value(row, "territory")),
    headAgentId: value(row, "head_agent_id") ? String(value(row, "head_agent_id")) : null,
    ownerAddress: value(row, "owner_address") ? String(value(row, "owner_address")) : null,
    agentCount: Number(value(row, "agent_count") ?? 0),
    feed: Number(value(row, "feed") ?? 0),
    feedMax: Number(value(row, "feed_max") ?? 0),
    createdAt: String(value(row, "created_at")),
  };
}

async function initializeStore() {
  const schema: InStatement[] = [
    `CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS control_agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      endpoint_url TEXT,
      owner_address TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS enclosures (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      territory TEXT NOT NULL,
      head_agent_id TEXT REFERENCES control_agents(id),
      owner_address TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sleeping',
      feed INTEGER NOT NULL DEFAULT 10,
      feed_max INTEGER NOT NULL DEFAULT 10,
      enclosure_id TEXT REFERENCES enclosures(id),
      control_agent_id TEXT REFERENCES control_agents(id),
      owner_address TEXT,
      task TEXT NOT NULL,
      last_awake_at TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      target_agent_id TEXT REFERENCES agents(id),
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      task TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS auth_nonces (
      address TEXT PRIMARY KEY,
      nonce TEXT NOT NULL,
      message TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      rate_key TEXT NOT NULL,
      bucket TEXT NOT NULL,
      count INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (rate_key, bucket)
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_controls (
      control_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS events_agent_created_idx ON events(agent_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS runs_agent_created_idx ON agent_runs(agent_id, created_at DESC)`,
  ];

  await zooStore.batch(schema, "write");

  await ensureColumn("agents", "enclosure_id", "enclosure_id TEXT");
  await ensureColumn("agents", "control_agent_id", "control_agent_id TEXT");
  await ensureColumn("agents", "owner_address", "owner_address TEXT");
  await ensureColumn("enclosures", "head_agent_id", "head_agent_id TEXT");
  await ensureColumn("enclosures", "owner_address", "owner_address TEXT");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS agents_enclosure_idx ON agents(enclosure_id, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS agents_owner_idx ON agents(owner_address, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS agents_control_agent_idx ON agents(control_agent_id, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS enclosures_owner_idx ON enclosures(owner_address, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS enclosures_head_agent_idx ON enclosures(head_agent_id, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS control_agents_owner_idx ON control_agents(owner_address, created_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS sessions_address_idx ON auth_sessions(address, expires_at)");
  await zooStore.execute("CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits(expires_at)");

  await zooStore.execute({
    sql: `INSERT INTO control_agents (
      id, name, provider, model, role, description, endpoint_url, owner_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
    args: [
      defaultControlAgent.id,
      defaultControlAgent.name,
      defaultControlAgent.provider,
      defaultControlAgent.model,
      defaultControlAgent.role,
      defaultControlAgent.description,
      defaultControlAgent.endpointUrl,
      defaultControlAgent.ownerAddress,
      defaultControlAgent.createdAt,
    ],
  });

  await zooStore.execute({
    sql: `INSERT INTO enclosures (id, name, description, territory, head_agent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
    args: [defaultEnclosure.id, defaultEnclosure.name, defaultEnclosure.description, defaultEnclosure.territory, defaultEnclosure.headAgentId, defaultEnclosure.createdAt],
  });

  const agentHierarchyMigration = await zooStore.execute("SELECT value FROM app_metadata WHERE key = 'agent_hierarchy_v1'");
  if (agentHierarchyMigration.rows[0]?.value !== "done") {
    await zooStore.batch([
      {
        sql: "UPDATE enclosures SET head_agent_id = ? WHERE id = ? AND head_agent_id IS NULL",
        args: [defaultControlAgent.id, defaultEnclosure.id],
      },
      {
        sql: "UPDATE agents SET control_agent_id = ? WHERE id IN ('raven-1', 'beaver-1', 'owl-1', 'meerkat-1') AND control_agent_id IS NULL",
        args: [defaultControlAgent.id],
      },
      `INSERT INTO app_metadata (key, value) VALUES ('agent_hierarchy_v1', 'done')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ], "write");
  }

  await zooStore.execute({
    sql: "UPDATE agents SET enclosure_id = ? WHERE enclosure_id IS NULL OR enclosure_id = ''",
    args: [defaultEnclosure.id],
  });

  const locale = await zooStore.execute("SELECT value FROM app_metadata WHERE key = 'content_locale'");
  if (locale.rows[0]?.value !== "en-v2") {
    await zooStore.batch([
      "DELETE FROM artifacts",
      "DELETE FROM events",
      "DELETE FROM agent_runs",
      "UPDATE agents SET status = 'sleeping', feed = feed_max, last_awake_at = NULL",
      `INSERT INTO app_metadata (key, value) VALUES ('content_locale', 'en-v2')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ], "write");
  }

  const seedStatements: InStatement[] = initialAgents.map((agent) => ({
    sql: `INSERT INTO agents (
      id, name, species, emoji, role, description, status, feed, feed_max,
      enclosure_id, control_agent_id, task, last_awake_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      species = excluded.species,
      emoji = excluded.emoji,
      role = excluded.role,
      description = excluded.description,
      task = excluded.task`,
    args: [
      agent.id,
      agent.name,
      agent.species,
      agent.emoji,
      agent.role,
      agent.description,
      agent.status,
      agent.feed,
      agent.feedMax,
      agent.enclosureId,
      agent.controlAgentId,
      agent.task,
      agent.lastAwakeAt,
      agent.createdAt,
    ],
  }));
  await zooStore.batch(seedStatements, "write");
}

const storeReady = globalStore.zooStoreReady ?? initializeStore();
if (process.env.NODE_ENV !== "production") globalStore.zooStoreReady = storeReady;

async function ready() {
  await storeReady;
}

export async function ensureZooStoreReady() {
  await ready();
}

export async function getAgents(): Promise<Agent[]> {
  await ready();
  const result = await zooStore.execute("SELECT * FROM agents ORDER BY created_at, id");
  return result.rows.map(mapAgent);
}

export async function getAgent(id: string): Promise<Agent | null> {
  await ready();
  const result = await zooStore.execute({ sql: "SELECT * FROM agents WHERE id = ?", args: [id] });
  return result.rows[0] ? mapAgent(result.rows[0]) : null;
}

export async function getControlAgents(): Promise<ControlAgent[]> {
  await ready();
  const result = await zooStore.execute("SELECT * FROM control_agents ORDER BY created_at, name");
  return result.rows.map(mapControlAgent);
}

export async function getControlAgent(id: string): Promise<ControlAgent | null> {
  await ready();
  const result = await zooStore.execute({ sql: "SELECT * FROM control_agents WHERE id = ?", args: [id] });
  return result.rows[0] ? mapControlAgent(result.rows[0]) : null;
}

export async function createControlAgent(input: {
  name: string;
  provider: ControlAgentProvider;
  model: string;
  role: string;
  description: string;
  endpointUrl?: string | null;
  ownerAddress: string;
}): Promise<ControlAgent> {
  await ready();
  const id = `operator-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  await zooStore.execute({
    sql: `INSERT INTO control_agents (
      id, name, provider, model, role, description, endpoint_url, owner_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.name, input.provider, input.model, input.role, input.description, input.endpointUrl || null, input.ownerAddress, createdAt],
  });
  return (await getControlAgent(id))!;
}

async function assertControlAgentAccess(id: string | null | undefined, ownerAddress: string, allowSystemAgent = false) {
  if (!id) return;
  const controlAgent = await getControlAgent(id);
  if (!controlAgent) throw new Error("CONTROL_AGENT_NOT_FOUND");
  if (controlAgent.ownerAddress?.toLowerCase() !== ownerAddress.toLowerCase() && !(allowSystemAgent && !controlAgent.ownerAddress)) {
    throw new Error("CONTROL_AGENT_FORBIDDEN");
  }
}

export async function getEnclosures(): Promise<Enclosure[]> {
  await ready();
  const result = await zooStore.execute(`
    SELECT e.*, COUNT(a.id) AS agent_count,
      COALESCE(SUM(a.feed), 0) AS feed,
      COALESCE(SUM(a.feed_max), 0) AS feed_max
    FROM enclosures e
    LEFT JOIN agents a ON a.enclosure_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at, e.name
  `);
  return result.rows.map(mapEnclosure);
}

export async function getEnclosure(id: string): Promise<Enclosure | null> {
  await ready();
  const result = await zooStore.execute({
    sql: `SELECT e.*, COUNT(a.id) AS agent_count,
      COALESCE(SUM(a.feed), 0) AS feed,
      COALESCE(SUM(a.feed_max), 0) AS feed_max
      FROM enclosures e LEFT JOIN agents a ON a.enclosure_id = e.id
      WHERE e.id = ? GROUP BY e.id`,
    args: [id],
  });
  return result.rows[0] ? mapEnclosure(result.rows[0]) : null;
}

export async function getEnclosureAgents(enclosureId: string): Promise<Agent[]> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT * FROM agents WHERE enclosure_id = ? ORDER BY created_at, id",
    args: [enclosureId],
  });
  return result.rows.map(mapAgent);
}

export async function createEnclosure(input: {
  name: string;
  description: string;
  territory: string;
  headAgentId?: string | null;
  ownerAddress: string;
  allowSystemAgent?: boolean;
}): Promise<Enclosure> {
  await ready();
  await assertControlAgentAccess(input.headAgentId, input.ownerAddress, input.allowSystemAgent);
  const id = `enclosure-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  await zooStore.execute({
    sql: "INSERT INTO enclosures (id, name, description, territory, head_agent_id, owner_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, input.name, input.description, input.territory, input.headAgentId || null, input.ownerAddress, createdAt],
  });
  return (await getEnclosure(id))!;
}

export async function assignEnclosureHead(input: {
  enclosureId: string;
  headAgentId: string | null;
  ownerAddress: string;
  isAdmin?: boolean;
}): Promise<Enclosure> {
  await ready();
  const enclosure = await getEnclosure(input.enclosureId);
  if (!enclosure) throw new Error("ENCLOSURE_NOT_FOUND");
  if (!input.isAdmin && enclosure.ownerAddress?.toLowerCase() !== input.ownerAddress.toLowerCase()) {
    throw new Error("ENCLOSURE_FORBIDDEN");
  }
  await assertControlAgentAccess(input.headAgentId, input.ownerAddress, input.isAdmin);
  await zooStore.execute({
    sql: "UPDATE enclosures SET head_agent_id = ? WHERE id = ?",
    args: [input.headAgentId || null, input.enclosureId],
  });
  return (await getEnclosure(input.enclosureId))!;
}

export async function createAgent(input: {
  name: string;
  species: SpeciesId;
  role?: string;
  description?: string;
  task?: string;
  feedMax: number;
  enclosureId: string;
  controlAgentId?: string | null;
  ownerAddress: string;
  allowSystemEnclosure?: boolean;
}): Promise<Agent> {
  await ready();
  const enclosure = await getEnclosure(input.enclosureId);
  if (!enclosure) throw new Error("ENCLOSURE_NOT_FOUND");
  if (enclosure.ownerAddress !== input.ownerAddress && !input.allowSystemEnclosure) {
    throw new Error("ENCLOSURE_FORBIDDEN");
  }
  await assertControlAgentAccess(input.controlAgentId, input.ownerAddress, input.allowSystemEnclosure);

  const blueprint = species[input.species];
  const id = `${input.species}-${randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  await zooStore.execute({
    sql: `INSERT INTO agents (
      id, name, species, emoji, role, description, status, feed, feed_max,
      enclosure_id, control_agent_id, owner_address, task, last_awake_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'sleeping', ?, ?, ?, ?, ?, ?, NULL, ?)`,
    args: [
      id,
      input.name,
      input.species,
      blueprint.emoji,
      input.role || blueprint.role,
      input.description || blueprint.description,
      input.feedMax,
      input.feedMax,
      input.enclosureId,
      input.controlAgentId || null,
      input.ownerAddress,
      input.task || blueprint.defaultTask,
      createdAt,
    ],
  });
  return (await getAgent(id))!;
}

export async function assignAnimalControlAgent(input: {
  animalId: string;
  controlAgentId: string | null;
  ownerAddress: string;
  isAdmin?: boolean;
}): Promise<Agent> {
  await ready();
  const animal = await getAgent(input.animalId);
  if (!animal) throw new Error("ANIMAL_NOT_FOUND");
  if (!input.isAdmin && animal.ownerAddress?.toLowerCase() !== input.ownerAddress.toLowerCase()) {
    throw new Error("ANIMAL_FORBIDDEN");
  }
  await assertControlAgentAccess(input.controlAgentId, input.ownerAddress, input.isAdmin);
  await zooStore.execute({
    sql: "UPDATE agents SET control_agent_id = ? WHERE id = ?",
    args: [input.controlAgentId || null, input.animalId],
  });
  return (await getAgent(input.animalId))!;
}

export async function getRecentEvents(limit = 20): Promise<ZooEvent[]> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT * FROM events ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows.map(mapEvent);
}

export async function getAgentEvents(agentId: string, limit = 50): Promise<ZooEvent[]> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT * FROM events WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?",
    args: [agentId, limit],
  });
  return result.rows.map(mapEvent);
}

export async function getAgentRuns(agentId: string, limit = 20): Promise<AgentRun[]> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?",
    args: [agentId, limit],
  });
  return result.rows.map(mapRun);
}

export async function getArtifacts(limit = 20): Promise<Artifact[]> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT * FROM artifacts ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows.map(mapArtifact);
}

export async function getArtifact(id: string): Promise<Artifact | null> {
  await ready();
  const result = await zooStore.execute({ sql: "SELECT * FROM artifacts WHERE id = ?", args: [id] });
  return result.rows[0] ? mapArtifact(result.rows[0]) : null;
}

export async function insertArtifact(input: {
  agentId: string;
  title: string;
  body: string;
  createdAt?: string;
}): Promise<Artifact> {
  await ready();
  const artifact: Artifact = {
    id: randomUUID(),
    agentId: input.agentId,
    title: input.title,
    body: input.body,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  await zooStore.execute({
    sql: "INSERT INTO artifacts (id, agent_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [artifact.id, artifact.agentId, artifact.title, artifact.body, artifact.createdAt],
  });
  return artifact;
}

export async function insertEvent(input: {
  agentId: string;
  targetAgentId?: string | null;
  type: ZooEvent["type"];
  summary: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
}): Promise<ZooEvent> {
  await ready();
  const event: ZooEvent = {
    id: randomUUID(),
    agentId: input.agentId,
    targetAgentId: input.targetAgentId ?? null,
    type: input.type,
    summary: input.summary,
    payload: input.payload ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  await zooStore.execute({
    sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [event.id, event.agentId, event.targetAgentId, event.type, event.summary, JSON.stringify(event.payload), event.createdAt],
  });
  return event;
}

export async function sendSignal(input: {
  agentId: string;
  targetAgentId: string;
  summary: string;
}): Promise<ZooEvent> {
  const [source, target] = await Promise.all([getAgent(input.agentId), getAgent(input.targetAgentId)]);
  if (!source || !target) throw new Error("AGENT_NOT_FOUND");
  if (source.id === target.id) throw new Error("SAME_AGENT");
  return insertEvent({
    agentId: source.id,
    targetAgentId: target.id,
    type: "request",
    summary: input.summary,
    payload: { operatorInitiated: true },
  });
}

export async function refillAgent(agentId: string): Promise<Agent | null> {
  const agent = await getAgent(agentId);
  if (!agent) return null;
  const eventId = randomUUID();
  const createdAt = new Date().toISOString();
  await zooStore.batch([
    { sql: "UPDATE agents SET feed = feed_max WHERE id = ?", args: [agentId] },
    {
      sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
        VALUES (?, ?, NULL, 'feed_refilled', ?, ?, ?)`,
      args: [eventId, agentId, `Operator refilled compute feed from ${agent.feed} to ${agent.feedMax}.`, JSON.stringify({ previous: agent.feed, current: agent.feedMax }), createdAt],
    },
  ], "write");
  return getAgent(agentId);
}

export async function refillEnclosure(enclosureId: string): Promise<Agent[]> {
  const agents = await getEnclosureAgents(enclosureId);
  if (agents.length === 0) return [];
  const createdAt = new Date().toISOString();
  const statements: InStatement[] = [];
  for (const agent of agents) {
    statements.push({ sql: "UPDATE agents SET feed = feed_max WHERE id = ?", args: [agent.id] });
    statements.push({
      sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
        VALUES (?, ?, NULL, 'feed_refilled', ?, ?, ?)`,
      args: [randomUUID(), agent.id, `Operator refilled ${agent.name}'s compute feed from ${agent.feed} to ${agent.feedMax}.`, JSON.stringify({ enclosureId, previous: agent.feed, current: agent.feedMax }), createdAt],
    });
  }
  await zooStore.batch(statements, "write");
  return getEnclosureAgents(enclosureId);
}

export async function startAgentRun(input: {
  agentId: string;
  runId: string;
  provider: AgentRun["provider"];
  task: string;
  createdAt: string;
}): Promise<AgentRun> {
  await ready();
  const transaction = await zooStore.transaction("write");
  try {
    const result = await transaction.execute({
      sql: `UPDATE agents SET status = 'working', feed = feed - 1, last_awake_at = ?
        WHERE id = ? AND status = 'sleeping' AND feed > 0`,
      args: [input.createdAt, input.agentId],
    });

    if (result.rowsAffected === 0) {
      const selected = await transaction.execute({ sql: "SELECT * FROM agents WHERE id = ?", args: [input.agentId] });
      const agent = selected.rows[0] ? mapAgent(selected.rows[0]) : null;
      if (!agent) throw new Error("AGENT_NOT_FOUND");
      if (agent.feed <= 0) throw new Error("NO_FEED");
      throw new Error(`AGENT_UNAVAILABLE:${agent.status}`);
    }

    await transaction.execute({
      sql: `INSERT INTO agent_runs (id, agent_id, task, provider, status, created_at)
        VALUES (?, ?, ?, ?, 'running', ?)`,
      args: [input.runId, input.agentId, input.task, input.provider, input.createdAt],
    });
    await transaction.execute({
      sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
        VALUES (?, ?, NULL, 'woke_up', ?, ?, ?)`,
      args: [randomUUID(), input.agentId, `Awakened with task: ${input.task}`, JSON.stringify({ runId: input.runId, provider: input.provider }), input.createdAt],
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
  return (await getAgentRuns(input.agentId, 1))[0];
}

export async function completeAgentRun(input: {
  agentId: string;
  runId: string;
  summary: string;
  completedAt: string;
}): Promise<void> {
  await ready();
  await zooStore.batch([
    {
      sql: "UPDATE agent_runs SET status = 'completed', summary = ?, completed_at = ? WHERE id = ?",
      args: [input.summary, input.completedAt, input.runId],
    },
    {
      sql: "UPDATE agents SET status = 'sleeping', last_awake_at = ? WHERE id = ?",
      args: [input.completedAt, input.agentId],
    },
    {
      sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
        VALUES (?, ?, NULL, 'went_to_sleep', ?, ?, ?)`,
      args: [randomUUID(), input.agentId, `Cycle completed: ${input.summary}`, JSON.stringify({ runId: input.runId }), input.completedAt],
    },
  ], "write");
}

export async function failAgentRun(input: {
  agentId: string;
  runId: string;
  error: string;
  completedAt: string;
}): Promise<void> {
  await ready();
  await zooStore.batch([
    {
      sql: "UPDATE agent_runs SET status = 'failed', error = ?, completed_at = ? WHERE id = ?",
      args: [input.error, input.completedAt, input.runId],
    },
    { sql: "UPDATE agents SET status = 'error' WHERE id = ?", args: [input.agentId] },
    {
      sql: `INSERT INTO events (id, agent_id, target_agent_id, type, summary, payload_json, created_at)
        VALUES (?, ?, NULL, 'warning', ?, ?, ?)`,
      args: [randomUUID(), input.agentId, `Cycle failed: ${input.error}`, JSON.stringify({ runId: input.runId }), input.completedAt],
    },
  ], "write");
}

export async function saveAuthNonce(input: {
  address: string;
  nonce: string;
  message: string;
  expiresAt: string;
}): Promise<void> {
  await ready();
  const createdAt = new Date().toISOString();
  await zooStore.execute({
    sql: `INSERT INTO auth_nonces (address, nonce, message, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        nonce = excluded.nonce,
        message = excluded.message,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at`,
    args: [input.address, input.nonce, input.message, input.expiresAt, createdAt],
  });
}

export async function getAuthNonce(address: string): Promise<{
  nonce: string;
  message: string;
  expiresAt: string;
} | null> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT nonce, message, expires_at FROM auth_nonces WHERE address = ?",
    args: [address],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    nonce: String(value(row, "nonce")),
    message: String(value(row, "message")),
    expiresAt: String(value(row, "expires_at")),
  };
}

export async function consumeAuthNonce(address: string, nonce: string): Promise<boolean> {
  await ready();
  const result = await zooStore.execute({
    sql: "DELETE FROM auth_nonces WHERE address = ? AND nonce = ?",
    args: [address, nonce],
  });
  return result.rowsAffected === 1;
}

export async function createAuthSession(input: {
  tokenHash: string;
  address: string;
  role: AuthRole;
  expiresAt: string;
}): Promise<AuthSession> {
  await ready();
  const createdAt = new Date().toISOString();
  await zooStore.batch([
    {
      sql: "DELETE FROM auth_sessions WHERE expires_at <= ?",
      args: [createdAt],
    },
    {
      sql: `INSERT INTO auth_sessions (token_hash, address, role, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)`,
      args: [input.tokenHash, input.address, input.role, input.expiresAt, createdAt],
    },
  ], "write");
  return { address: input.address, role: input.role, expiresAt: input.expiresAt };
}

export async function getAuthSession(tokenHash: string): Promise<AuthSession | null> {
  await ready();
  const now = new Date().toISOString();
  const result = await zooStore.execute({
    sql: `SELECT address, role, expires_at FROM auth_sessions
      WHERE token_hash = ? AND expires_at > ?`,
    args: [tokenHash, now],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    address: String(value(row, "address")),
    role: String(value(row, "role")) as AuthRole,
    expiresAt: String(value(row, "expires_at")),
  };
}

export async function deleteAuthSession(tokenHash: string): Promise<void> {
  await ready();
  await zooStore.execute({ sql: "DELETE FROM auth_sessions WHERE token_hash = ?", args: [tokenHash] });
}

export async function consumeRateLimit(input: {
  key: string;
  scope: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  await ready();
  const now = Date.now();
  const windowStart = Math.floor(now / input.windowMs) * input.windowMs;
  const expiresAt = windowStart + input.windowMs;
  const bucket = `${input.scope}:${windowStart}`;
  await zooStore.execute({ sql: "DELETE FROM rate_limits WHERE expires_at <= ?", args: [now] });
  const result = await zooStore.execute({
    sql: `INSERT INTO rate_limits (rate_key, bucket, count, expires_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(rate_key, bucket) DO UPDATE SET count = count + 1
      RETURNING count`,
    args: [input.key, bucket, expiresAt],
  });
  const count = Number(value(result.rows[0], "count"));
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}

export async function getRuntimeControl(): Promise<RuntimeControl> {
  await ready();
  const result = await zooStore.execute({
    sql: "SELECT value, updated_by, updated_at FROM runtime_controls WHERE control_key = 'runtime_paused'",
    args: [],
  });
  const row = result.rows[0];
  return {
    paused: row ? String(value(row, "value")) === "true" : false,
    updatedBy: row && value(row, "updated_by") ? String(value(row, "updated_by")) : null,
    updatedAt: row && value(row, "updated_at") ? String(value(row, "updated_at")) : null,
  };
}

export async function setRuntimePaused(paused: boolean, updatedBy: string): Promise<RuntimeControl> {
  await ready();
  const updatedAt = new Date().toISOString();
  await zooStore.execute({
    sql: `INSERT INTO runtime_controls (control_key, value, updated_by, updated_at)
      VALUES ('runtime_paused', ?, ?, ?)
      ON CONFLICT(control_key) DO UPDATE SET
        value = excluded.value,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at`,
    args: [paused ? "true" : "false", updatedBy, updatedAt],
  });
  return { paused, updatedBy, updatedAt };
}
