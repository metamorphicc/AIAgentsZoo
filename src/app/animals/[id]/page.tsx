import Link from "next/link";
import { notFound } from "next/navigation";

import { WakeAgentButton } from "@/components/wake-agent-button";
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
    <main className="site-shell agent-page">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/"><span className="wordmark-mark" aria-hidden="true">A</span><span>AI Agent Zoo</span></Link>
        <Link className="pill-button pill-button--outline" href="/">All agents</Link>
      </nav>

      <header className="agent-hero">
        <div><p className="protocol-line"><span aria-hidden="true" /> Habitat / {agent.id}</p><h1>{agent.name}</h1><p className="agent-role">{agent.role}</p><p className="agent-description">{agent.description}</p></div>
        <div className="agent-sigil" aria-hidden="true"><span>{agent.species.slice(0, 2).toUpperCase()}</span><small>{agent.species}</small></div>
      </header>

      <section className="agent-console" aria-label="Agent runtime controls">
        <dl className="agent-metrics">
          <div><dt>Status</dt><dd><span className={`state-dot state-dot--${agent.status}`} />{formatStatus(agent.status)}</dd></div>
          <div><dt>Compute feed</dt><dd>{agent.feed} / {agent.feedMax}</dd></div>
          <div><dt>Last awakened</dt><dd>{formatDate(agent.lastAwakeAt)}</dd></div>
          <div><dt>Registry ID</dt><dd className="mono-note">{agent.id}</dd></div>
        </dl>
        <div className="task-block"><span>Current task</span><p>{agent.task}</p></div>
        <WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} />
      </section>

      <div className="activity-grid">
        <section aria-labelledby="runs-title">
          <div className="section-heading"><div><h2 id="runs-title">Runtime cycles</h2><p>Provider decisions and completion state.</p></div></div>
          {runs.length === 0 ? <div className="empty-state"><p>No cycles yet.</p><span>Wake this agent to create its first runtime record.</span></div> : (
            <ol className="run-list">{runs.map((run) => <li key={run.id}><div><strong>{formatStatus(run.status)}</strong><time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time></div><p>{run.summary ?? run.task}</p><span className="mono-note">{run.provider}</span></li>)}</ol>
          )}
        </section>
        <section aria-labelledby="events-title">
          <div className="section-heading"><div><h2 id="events-title">Agent trace</h2><p>Observable events written by this animal.</p></div></div>
          {events.length === 0 ? <div className="empty-state"><p>No trace emitted.</p><span>The ledger will update after the first cycle.</span></div> : (
            <ol className="event-ledger event-ledger--compact">{events.map((event) => <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-type">{formatEventType(event.type)}</span><p>{event.summary}</p></li>)}</ol>
          )}
        </section>
      </div>

      <footer className="site-footer"><span>AI Agent Zoo · {agent.name}</span><span>Public trace · bounded compute</span></footer>
    </main>
  );
}
