import Link from "next/link";
import { notFound } from "next/navigation";

import { Owl3DViewport } from "@/components/owl-3d-lab";
import { AgentMark, EmptyState } from "@/components/product-ui";
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
      <section className="animal-passport-stage">
        <aside className="animal-passport-summary">
          <div className="animal-passport-nav">
            <Link href="/agents">← All animals</Link>
            <span className={`status-label status-label--${agent.status}`}><i />{formatStatus(agent.status)}</span>
          </div>

          <div className="animal-passport-identity">
            <AgentMark agent={agent} />
            <p>{agent.species} / {agent.role}</p>
            <h1>{agent.name}</h1>
            <p>{agent.description}</p>
          </div>

          <dl className="animal-passport-stats">
            <div><dt>Compute feed</dt><dd>{agent.feed}<span> / {agent.feedMax}</span></dd></div>
            <div><dt>Last cycle</dt><dd>{formatDate(agent.lastAwakeAt)}</dd></div>
            <div><dt>Recorded runs</dt><dd>{runs.length}</dd></div>
            <div><dt>Trace events</dt><dd>{events.length}</dd></div>
          </dl>

          <div className="animal-passport-task">
            <span>Current task</span>
            <p>{agent.task}</p>
          </div>

          <WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} />
        </aside>

        <div className="animal-passport-model">
          {agent.species === "owl" ? (
            <Owl3DViewport />
          ) : (
            <div className="animal-model-pending">
              <AgentMark agent={agent} />
              <div>
                <span>3D specimen status</span>
                <strong>Model in production</strong>
                <p>The live habitat is ready. This animal is waiting for its rigged 3D body.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="agent-detail-grid">
        <div className="task-panel animal-facts-panel">
          <div className="section-heading"><h2>Passport</h2><span>{agent.id}</span></div>
          <dl><div><dt>Guardian</dt><dd>Local operator</dd></div><div><dt>Territory</dt><dd>Habitat 01 · shared event ledger</dd></div><div><dt>Schedule</dt><dd>Manual wake · event-ready</dd></div><div><dt>Access</dt><dd>Read shared events · write own trace</dd></div></dl>
        </div>
        <div className="cycle-panel">
          <div className="section-heading"><h2>Cycle history</h2><span>{runs.length} runs</span></div>
          {runs.length === 0 ? <EmptyState title="No cycles yet">Wake this animal to create its first runtime record.</EmptyState> : <ol className="cycle-list">{runs.map((run) => <li key={run.id}><div><span className={`status-label status-label--${run.status === "failed" ? "error" : "sleeping"}`}><i />{formatStatus(run.status)}</span><time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time></div><p>{run.summary ?? run.task}</p><small>{run.provider}</small></li>)}</ol>}
        </div>
      </section>

      <section className="agent-ledger">
        <div className="section-heading"><h2>Public trace</h2><Link href="/trace">Full ledger ↗</Link></div>
        {events.length === 0 ? <EmptyState title="No trace emitted">The ledger updates after the first cycle.</EmptyState> : <ol className="ledger-list ledger-list--agent">{events.map((event) => <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-badge">{formatEventType(event.type)}</span><p>{event.summary}</p></li>)}</ol>}
      </section>
    </ZooShell>
  );
}
