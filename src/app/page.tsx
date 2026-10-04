import Link from "next/link";

import { ZooRail } from "@/components/zoo-rail";
import { getAgents, getArtifacts, getRecentEvents } from "@/lib/db";
import { formatDate, formatEventType, formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const agents = getAgents();
  const events = getRecentEvents(12);
  const artifacts = getArtifacts(6);
  const provider = process.env.AGENT_PROVIDER === "openai" ? "OpenAI" : "Deterministic demo";
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  const totalFeed = agents.reduce((total, agent) => total + agent.feed, 0);
  const maximumFeed = agents.reduce((total, agent) => total + agent.feedMax, 0);
  const speciesCount = new Set(agents.map((agent) => agent.species)).size;
  const latestSignal = events.find((event) => event.targetAgentId);
  const hasRavenBeaverSignal = events.some(
    (event) => event.agentId === "raven-1" && event.targetAgentId === "beaver-1",
  );
  const habitatStatus = agents.some((agent) => agent.status === "error")
    ? "Needs attention"
    : agents.some((agent) => agent.status === "working")
      ? "Agents active"
      : "Habitat healthy";

  return (
    <div className="zoo-product-shell">
      <ZooRail active="habitat" statusLabel={habitatStatus} />

      <main className="zoo-workspace">
        <header className="workspace-header">
          <div>
            <p className="workspace-path">Zoo network / Habitat 01</p>
            <h1>Habitat overview</h1>
          </div>
          <div className="workspace-statuses" aria-label="Network status">
            <span className="system-chip"><span className="live-indicator" aria-hidden="true" />{habitatStatus}</span>
            <span className="system-chip system-chip--quiet">Off-chain · {provider}</span>
          </div>
        </header>

        <section className="habitat-summary" aria-label="Habitat summary">
          <div><span>Registered agents</span><strong>{agents.length}</strong><small>{speciesCount} species registered</small></div>
          <div><span>Compute feed</span><strong>{totalFeed}<i> / {maximumFeed}</i></strong><small>One unit per cycle</small></div>
          <div><span>Trace window</span><strong>{events.length}</strong><small>Latest public events</small></div>
          <div><span>Visible artifacts</span><strong>{artifacts.length}</strong><small>Latest registry outputs</small></div>
        </section>

        <section className="ecosystem-layout" id="habitat-map" aria-labelledby="map-title">
          <div className="habitat-map-panel">
            <div className="panel-heading">
              <div><h2 id="map-title">Live habitat map</h2><p>Agents share a ledger, route signals, and leave a public trail.</p></div>
              <span className="map-legend"><span aria-hidden="true" /> Live route</span>
            </div>

            <div className="habitat-canvas">
              <svg className="habitat-connections" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
                <path d="M24 25 L50 50" />
                <path d="M76 25 L50 50" />
                <path d="M24 75 L50 50" />
                <path d="M76 75 L50 50" />
                <path className={hasRavenBeaverSignal ? "connection-live" : undefined} d="M24 25 C40 10 60 10 76 25" />
              </svg>

              <div className="ledger-core">
                <span className="live-indicator" aria-hidden="true" />
                <strong>Shared ledger</strong>
                <small>{latestSignal ? `${agentNames.get(latestSignal.agentId)} → ${agentNames.get(latestSignal.targetAgentId ?? "")}` : "Waiting for first route"}</small>
              </div>

              {agents.map((agent) => (
                <Link className={`habitat-node habitat-node--${agent.species}`} href={`/animals/${agent.id}`} key={agent.id}>
                  <span className="habitat-node-mark" aria-hidden="true">{agent.species.slice(0, 2).toUpperCase()}</span>
                  <span><strong>{agent.name}</strong><small>{agent.role} · {formatStatus(agent.status)}</small></span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="agent-roster-panel" id="agents" aria-labelledby="agents-title">
            <div className="panel-heading panel-heading--compact">
              <div><h2 id="agents-title">Agents</h2><p>Species are operational roles.</p></div>
              <span className="mono-note">{agents.length} total</span>
            </div>
            <div className="agent-roster">
              {agents.map((agent) => (
                <Link className="roster-agent" href={`/animals/${agent.id}`} key={agent.id}>
                  <span className="roster-agent-mark" aria-hidden="true">{agent.species.slice(0, 2).toUpperCase()}</span>
                  <span className="roster-agent-copy"><strong>{agent.name}</strong><small>{agent.role}</small></span>
                  <span className="roster-agent-feed"><small>{agent.feed}/{agent.feedMax}</small><meter min="0" max={agent.feedMax} value={agent.feed}>{agent.feed} of {agent.feedMax}</meter></span>
                </Link>
              ))}
            </div>
            <p className="roster-note">Feed is the current compute limit—not a wallet balance.</p>
          </aside>
        </section>

        <section className="operations-layout" aria-label="Zoo operations">
          <div className="trace-panel" id="trace">
            <div className="panel-heading">
              <div><h2>Public trace</h2><p>Recent actions across the habitat.</p></div>
              <span className="mono-note">events://local</span>
            </div>
            {events.length === 0 ? (
              <div className="product-empty-state"><strong>No traces yet</strong><p>Open Raven and run the first cycle to write to the shared ledger.</p><Link href="/animals/raven-1">Open Raven</Link></div>
            ) : (
              <ol className="trace-stream">
                {events.slice(0, 8).map((event) => (
                  <li key={event.id}>
                    <span className="trace-agent">{agentNames.get(event.agentId) ?? event.agentId}</span>
                    <span className="event-type">{formatEventType(event.type)}</span>
                    <p>{event.summary}</p>
                    <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="artifact-panel" id="artifacts">
            <div className="panel-heading panel-heading--compact">
              <div><h2>Artifacts</h2><p>Outputs built from shared signals.</p></div>
              <span className="mono-note">registry://local</span>
            </div>
            {artifacts.length === 0 ? (
              <div className="product-empty-state product-empty-state--moss">
                <strong>No artifacts published</strong>
                <p>Run Raven, then Beaver. Beaver will turn incoming signals into an inspectable field note.</p>
                <Link href="/animals/raven-1">Start with Raven</Link>
              </div>
            ) : (
              <div className="artifact-list">
                {artifacts.map((artifact) => (
                  <article className="artifact-record" key={artifact.id}>
                    <div><span>{agentNames.get(artifact.agentId) ?? artifact.agentId}</span><time dateTime={artifact.createdAt}>{formatDate(artifact.createdAt)}</time></div>
                    <h3>{artifact.title}</h3>
                    <p>{artifact.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="protocol-bar" aria-label="Protocol state">
          <div><span>Identity</span><strong>Stable local IDs</strong></div>
          <div><span>Transport</span><strong>Shared event ledger</strong></div>
          <div><span>Budget</span><strong>Bounded compute feed</strong></div>
          <div><span>Settlement</span><strong>Off-chain</strong></div>
        </section>

        <footer className="zoo-footer">
          <p>Every action leaves a trace.</p>
          <div><span>AI Agent Zoo</span><span>Habitat 01 · local registry · no token contract deployed</span></div>
        </footer>
      </main>
    </div>
  );
}
