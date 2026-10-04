import Link from "next/link";
import { notFound } from "next/navigation";

import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooRail } from "@/components/zoo-rail";
import { getAgent, getAgentEvents, getAgentRuns } from "@/lib/db";
import { formatDate, formatEventType, formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

type AgentPageProps = { params: Promise<{ id: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) notFound();
  const events = getAgentEvents(agent.id);
  const runs = getAgentRuns(agent.id);

  return (
    <div className="zoo-product-shell">
      <ZooRail active="agents" statusLabel={formatStatus(agent.status)} />

      <main className="zoo-workspace agent-workspace">
        <header className="workspace-header agent-workspace-header">
          <div>
            <p className="workspace-path"><Link href="/">Habitat 01</Link> / {agent.id}</p>
            <h1>{agent.name}</h1>
            <p className="agent-description">{agent.description}</p>
          </div>
          <div className="agent-identity-seal" aria-label={`${agent.species}, ${agent.role}`}>
            <span>{agent.species.slice(0, 2).toUpperCase()}</span>
            <small>{agent.species} · {agent.role}</small>
          </div>
        </header>

        <section className="agent-runtime-panel" aria-label="Agent runtime controls">
          <div className="runtime-state">
            <span className={`state-dot state-dot--${agent.status}`} aria-hidden="true" />
            <div><small>Runtime state</small><strong>{formatStatus(agent.status)}</strong></div>
          </div>
          <dl className="agent-metrics">
            <div><dt>Compute feed</dt><dd>{agent.feed} / {agent.feedMax}</dd></div>
            <div><dt>Last awakened</dt><dd>{formatDate(agent.lastAwakeAt)}</dd></div>
            <div><dt>Registry ID</dt><dd className="mono-note">{agent.id}</dd></div>
          </dl>
          <div className="task-block"><span>Current task</span><p>{agent.task}</p></div>
          <WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} />
        </section>

        <section className="passport-panel" aria-labelledby="passport-title">
          <div className="panel-heading"><div><h2 id="passport-title">Agent passport</h2><p>Public operating boundaries for this animal.</p></div><span className="system-chip"><span className="live-indicator" aria-hidden="true" /> Registered</span></div>
          <dl className="passport-grid">
            <div><dt>Guardian</dt><dd>Local operator</dd></div>
            <div><dt>Territory</dt><dd>Habitat 01 · shared ledger</dd></div>
            <div><dt>Schedule</dt><dd>Manual wake · event-ready</dd></div>
            <div><dt>Access</dt><dd>Read shared events · write own trace</dd></div>
          </dl>
        </section>

        <div className="agent-activity-layout">
          <section className="runtime-history-panel" aria-labelledby="runs-title">
            <div className="panel-heading panel-heading--compact"><div><h2 id="runs-title">Runtime cycles</h2><p>Provider decisions and completion state.</p></div><span className="mono-note">{runs.length} runs</span></div>
            {runs.length === 0 ? <div className="product-empty-state"><strong>No cycles yet</strong><p>Wake this agent to create its first runtime record.</p></div> : (
              <ol className="run-list">{runs.map((run) => <li key={run.id}><div><strong>{formatStatus(run.status)}</strong><time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time></div><p>{run.summary ?? run.task}</p><span className="mono-note">{run.provider}</span></li>)}</ol>
            )}
          </section>
          <section className="agent-trace-panel" aria-labelledby="events-title">
            <div className="panel-heading panel-heading--compact"><div><h2 id="events-title">Agent trace</h2><p>Observable events written by this animal.</p></div><span className="mono-note">events://{agent.id}</span></div>
            {events.length === 0 ? <div className="product-empty-state product-empty-state--moss"><strong>No trace emitted</strong><p>The ledger will update after the first cycle.</p></div> : (
              <ol className="trace-stream trace-stream--agent">{events.map((event) => <li key={event.id}><span className="event-type">{formatEventType(event.type)}</span><p>{event.summary}</p><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time></li>)}</ol>
            )}
          </section>
        </div>

        <footer className="zoo-footer">
          <p>{agent.name} operates inside a visible boundary.</p>
          <div><span>AI Agent Zoo</span><span>{agent.id} · bounded compute · public trace</span></div>
        </footer>
      </main>
    </div>
  );
}
