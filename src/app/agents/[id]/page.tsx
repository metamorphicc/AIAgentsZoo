import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentMark, EmptyState, PageHeading } from "@/components/product-ui";
import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooShell } from "@/components/zoo-shell";
import { getAgent, getAgentEvents, getAgentRuns } from "@/lib/db";
import { formatDate, formatEventType, formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) notFound();
  const events = getAgentEvents(agent.id);
  const runs = getAgentRuns(agent.id);

  return (
    <ZooShell active="agents">
      <PageHeading
        eyebrow={`Agent registry / ${agent.id}`}
        title={agent.name.toUpperCase()}
        description={agent.description}
        actions={<Link className="action-button" href="/agents">ALL AGENTS</Link>}
      />

      <section className="agent-command-panel">
        <div className="agent-command-identity"><AgentMark agent={agent} /><div><span>{agent.species.toUpperCase()} / {agent.role.toUpperCase()}</span><strong>{formatStatus(agent.status)}</strong></div></div>
        <div className="command-stat"><span>Compute feed</span><strong>{agent.feed}<i> / {agent.feedMax}</i></strong></div>
        <div className="command-stat"><span>Last cycle</span><strong>{formatDate(agent.lastAwakeAt)}</strong></div>
        <WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} />
      </section>

      <section className="agent-detail-grid">
        <div className="task-panel">
          <p className="page-eyebrow">CURRENT TASK</p><h2>{agent.task}</h2>
          <dl><div><dt>Guardian</dt><dd>Local operator</dd></div><div><dt>Territory</dt><dd>Habitat 01 · shared event ledger</dd></div><div><dt>Schedule</dt><dd>Manual wake · event-ready</dd></div><div><dt>Access</dt><dd>Read shared events · write own trace</dd></div></dl>
        </div>
        <div className="cycle-panel">
          <div className="section-heading"><div><p>RUNTIME</p><h2>Cycle history</h2></div><span>{runs.length} runs</span></div>
          {runs.length === 0 ? <EmptyState title="No cycles yet">Wake this agent to create its first runtime record.</EmptyState> : <ol className="cycle-list">{runs.map((run) => <li key={run.id}><div><span className={`status-label status-label--${run.status === "failed" ? "error" : "sleeping"}`}><i />{formatStatus(run.status)}</span><time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time></div><p>{run.summary ?? run.task}</p><small>{run.provider}</small></li>)}</ol>}
        </div>
      </section>

      <section className="agent-ledger">
        <div className="section-heading"><div><p>PUBLIC RECORD</p><h2>Agent trace</h2></div><Link href="/trace">Full ledger ↗</Link></div>
        {events.length === 0 ? <EmptyState title="No trace emitted">The ledger updates after the first cycle.</EmptyState> : <ol className="ledger-list ledger-list--agent">{events.map((event) => <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-badge">{formatEventType(event.type)}</span><p>{event.summary}</p></li>)}</ol>}
      </section>
    </ZooShell>
  );
}
