import Link from "next/link";

import { AgentMark } from "@/components/product-ui";
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
  const workingAgents = agents.filter((agent) => agent.status === "working").length;
  const sleepingAgents = agents.filter((agent) => agent.status === "sleeping").length;
  const lastEvent = events[0];

  return (
    <ZooShell active="zoo">
      <div className="zoo-dashboard">
        <header className="operator-home">
          <div className="operator-home__profile">
            <div className="operator-home__bar">
              <span>OPERATOR HOME</span>
              <span className="operator-home__node"><i aria-hidden="true" />LOCAL NODE · OFF-CHAIN</span>
            </div>

            <div className="operator-identity">
              <span className="operator-identity__mark" aria-hidden="true">G</span>
              <div>
                <h1>Grok</h1>
                <span>Head orchestrator · Visual command layer</span>
              </div>
            </div>

            <div className="operator-home__brief">
              <h2>{agents.length} species are connected.</h2>
              <p>Start with Raven. Its next bounded cycle scouts the habitat, writes to the public trace, and can route a useful signal to Beaver.</p>
            </div>

            <div className="operator-home__actions">
              <Link className="action-button action-button--accent" href="/agents/raven-1">OPEN RAVEN</Link>
              <Link className="action-button" href="/manage">MANAGE LIMITS</Link>
            </div>

            <dl className="operator-home__facts">
              <div><dt>Control</dt><dd>Explicit</dd></div>
              <div><dt>Route</dt><dd>Event ledger</dd></div>
              <div><dt>Feed</dt><dd>{feed} / {feedMax}</dd></div>
            </dl>
          </div>

          <aside className="operator-guide" aria-labelledby="first-run-title">
            <div className="operator-guide__head">
              <h2 id="first-run-title">Your first run</h2>
              <b>{events.length > 0 ? "TRACE OPEN" : "READY"}</b>
            </div>
            <ol>
              <li>
                <Link href="/agents/raven-1"><span>01</span><div><strong>Wake Raven</strong><small>Give the scout one bounded cycle.</small></div><i aria-hidden="true">↗</i></Link>
              </li>
              <li>
                <Link href="/trace"><span>02</span><div><strong>Follow the handoff</strong><small>Read every observation and routed signal.</small></div><i aria-hidden="true">↗</i></Link>
              </li>
              <li>
                <Link href="/artifacts"><span>03</span><div><strong>Inspect the result</strong><small>Open Beaver&apos;s output when it is published.</small></div><i aria-hidden="true">↗</i></Link>
              </li>
            </ol>
            <p>Grok&apos;s command layer is visual in this build. Agent cycles remain explicit and operator-controlled.</p>
          </aside>
        </header>

        <section className="habitat-pulse" aria-labelledby="habitat-pulse-title">
          <div className="habitat-pulse__head">
            <h2 id="habitat-pulse-title">Habitat pulse</h2>
            <p>{lastEvent ? <>Last event <time dateTime={lastEvent.createdAt}>{formatDate(lastEvent.createdAt)}</time></> : "No events recorded yet"}</p>
          </div>
          <div className="habitat-pulse__body">
            <div className="habitat-budget">
              <div><span>Compute available</span><strong>{feed}<i> / {feedMax}</i></strong></div>
              <meter aria-label={`${feed} of ${feedMax} compute feed available`} max={feedMax} value={feed}>{feed} of {feedMax}</meter>
              <small>Shared bounded cycle budget across all species</small>
            </div>
            <dl className="habitat-stats">
              <div><dt>Species</dt><dd>{String(agents.length).padStart(2, "0")}</dd><small>{sleepingAgents} sleeping · {workingAgents} working</small></div>
              <div><dt>Trace</dt><dd>{String(events.length).padStart(2, "0")}</dd><small>Events in current window</small></div>
              <div><dt>Outputs</dt><dd>{String(artifacts.length).padStart(2, "0")}</dd><small>Published artifacts</small></div>
            </dl>
          </div>
        </section>

      <section className="zoo-overview-grid">
        <div className="network-panel">
          <div className="section-heading"><div><h2>Grok command map</h2></div><Link href="/nodes">Inspect node ↗</Link></div>
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
          <div className="section-heading"><div><h2>Latest trace</h2></div><Link href="/trace">All events ↗</Link></div>
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
          <div className="section-heading"><div><h2>Latest artifacts</h2></div><Link href="/artifacts">Open registry ↗</Link></div>
          {artifacts.length === 0 ? <p className="quiet-copy">The registry is empty. The Beaver publishes here after receiving a useful signal.</p> : artifacts.map((artifact) => (
            <Link href={`/artifacts/${artifact.id}`} className="artifact-line" key={artifact.id}><span>{artifact.title}</span><small>{agentNames.get(artifact.agentId)} · {formatDate(artifact.createdAt)}</small></Link>
          ))}
        </div>
      </section>
      </div>
    </ZooShell>
  );
}
