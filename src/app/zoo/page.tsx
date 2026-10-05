import Link from "next/link";

import { AgentMark, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { getAgents, getArtifacts, getRecentEvents } from "@/lib/db";
import { formatDate, formatEventType, formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ZooPage() {
  const agents = getAgents();
  const events = getRecentEvents(8);
  const artifacts = getArtifacts(3);
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  const feed = agents.reduce((total, agent) => total + agent.feed, 0);
  const feedMax = agents.reduce((total, agent) => total + agent.feedMax, 0);
  const liveSignal = events.find((event) => event.targetAgentId);

  return (
    <ZooShell active="zoo">
      <PageHeading
        eyebrow="Habitat 01 / Orchestration preview"
        title="THE ZOO HAS A CONDUCTOR."
        description="Grok now sits above four autonomous species in the command map. The visual hierarchy is live; direct Grok runtime dispatch is the next integration step."
        actions={<><Link className="action-button action-button--accent" href="/agents">ENTER HABITAT</Link><Link className="action-button" href="/trace">VIEW TRACE</Link></>}
      />

      <section className="metric-strip" aria-label="Habitat metrics">
        <div><span>Agents</span><strong>{String(agents.length).padStart(2, "0")}</strong><small>4 operational species</small></div>
        <div><span>Compute feed</span><strong>{feed}<i>/{feedMax}</i></strong><small>Bounded cycle budget</small></div>
        <div><span>Events</span><strong>{events.length}</strong><small>Current trace window</small></div>
        <div><span>Artifacts</span><strong>{artifacts.length}</strong><small>Visible outputs</small></div>
      </section>

      <section className="zoo-overview-grid">
        <div className="network-panel">
          <div className="section-heading"><div><p>COMMAND TOPOLOGY</p><h2>Grok command map</h2></div><Link href="/nodes">Inspect node ↗</Link></div>
          <div className="network-stage network-stage--orchestrated">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="orchestrator-stem" d="M50 12 L50 57" />
              <path d="M18 34 L50 57 L82 34" /><path d="M18 83 L50 57 L82 83" />
              <path className={liveSignal ? "signal-path" : undefined} d="M18 34 C38 22 62 22 82 34" />
            </svg>
            <div className="network-orchestrator" aria-label="Grok, head orchestrator; visual preview only">
              <span aria-hidden="true">G</span>
              <span><small>HEAD ORCHESTRATOR</small><b>GROK</b></span>
              <i>VISUAL PREVIEW</i>
            </div>
            <div className="network-core"><span aria-hidden="true" /><b>EVENT LEDGER</b><small>{liveSignal ? `${agentNames.get(liveSignal.agentId)} → ${agentNames.get(liveSignal.targetAgentId ?? "")}` : "Waiting for a routed signal"}</small></div>
            {agents.map((agent) => (
              <Link className={`network-agent network-agent--${agent.species}`} href={`/agents/${agent.id}`} key={agent.id}>
                <AgentMark agent={agent} />
                <span><b>{agent.name}</b><small>{agent.role} / {formatStatus(agent.status)}</small></span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="pulse-panel">
          <div className="section-heading"><div><p>RUNTIME PULSE</p><h2>Latest trace</h2></div><Link href="/trace">All events ↗</Link></div>
          {events.length === 0 ? <p className="quiet-copy">No events yet. Wake Raven to open the public trace.</p> : (
            <ol className="compact-trace">
              {events.slice(0, 6).map((event) => <li key={event.id}><span>{formatEventType(event.type)}</span><p>{event.summary}</p><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time></li>)}
            </ol>
          )}
        </aside>
      </section>

      <section className="zoo-bottom-grid">
        <div className="current-mission">
          <p className="page-eyebrow">Next proof</p>
          <h2>RAVEN FINDS IT. BEAVER BUILDS IT.</h2>
          <p>The first complete network loop routes a signal between two species and publishes a common artifact without a human conversation.</p>
          <Link className="text-link" href="/tasks">Open task board ↗</Link>
        </div>
        <div className="latest-artifacts">
          <div className="section-heading"><div><p>REGISTRY</p><h2>Latest artifacts</h2></div><Link href="/artifacts">Open registry ↗</Link></div>
          {artifacts.length === 0 ? <p className="quiet-copy">The registry is empty. The Beaver publishes here after receiving a useful signal.</p> : artifacts.map((artifact) => (
            <Link href={`/artifacts/${artifact.id}`} className="artifact-line" key={artifact.id}><span>{artifact.title}</span><small>{agentNames.get(artifact.agentId)} · {formatDate(artifact.createdAt)}</small></Link>
          ))}
        </div>
      </section>
    </ZooShell>
  );
}
