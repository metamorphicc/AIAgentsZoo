import Link from "next/link";

import { HabitatWorkflow } from "@/components/habitat-workflow";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate, formatEventType } from "@/lib/format";
import { shortAddress } from "@/lib/auth/config";
import { canManageResource } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { getAgents, getArtifacts, getControlAgents, getEnclosures, getRecentEvents, getRuntimeControl } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ZooPage() {
  const [agents, controlAgents, events, artifacts, enclosures, session, runtime] = await Promise.all([
    getAgents(),
    getControlAgents(),
    getRecentEvents(8),
    getArtifacts(3),
    getEnclosures(),
    getSession(),
    getRuntimeControl(),
  ]);
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  const feed = agents.reduce((total, agent) => total + agent.feed, 0);
  const feedMax = agents.reduce((total, agent) => total + agent.feedMax, 0);
  const workingAgents = agents.filter((agent) => agent.status === "working").length;
  const sleepingAgents = agents.filter((agent) => agent.status === "sleeping").length;
  const lastEvent = events[0];
  const ownedHeadedEnclosure = session
    ? enclosures.find((enclosure) => enclosure.ownerAddress?.toLowerCase() === session.address.toLowerCase() && enclosure.headAgentId) ?? enclosures.find((enclosure) => enclosure.ownerAddress?.toLowerCase() === session.address.toLowerCase())
    : null;
  const activeEnclosure = ownedHeadedEnclosure ?? enclosures.find((enclosure) => enclosure.id === "habitat-01") ?? enclosures[0];
  const orchestrator = controlAgents.find((agent) => agent.id === activeEnclosure?.headAgentId);
  const networkAgents = activeEnclosure ? agents.filter((agent) => agent.enclosureId === activeEnclosure.id) : [];
  const orchestratorName = orchestrator?.name ?? "Habitat";

  return (
    <ZooShell active="zoo">
      <div className="zoo-dashboard">
        <header className="operator-home">
          <div className="operator-home__profile">
            <div className="operator-home__bar">
              <span>{session ? `${session.role.toUpperCase()} HOME` : "VISITOR HOME"}</span>
              <span className="operator-home__node"><i aria-hidden="true" />{runtime.paused ? "RUNTIME PAUSED" : "RUNTIME READY"} · OFF-CHAIN</span>
            </div>

            <div className="operator-identity">
              <span className="operator-identity__mark" aria-hidden="true">{orchestratorName.slice(0, 1).toUpperCase()}</span>
              <div>
                <h1>{orchestratorName}</h1>
                <span>{orchestrator ? `${orchestrator.role} · ${orchestrator.provider}` : "No head agent assigned"}</span>
              </div>
            </div>

            <div className="operator-home__brief">
              <h2>{agents.length} animals across {enclosures.length} enclosure{enclosures.length === 1 ? "" : "s"}.</h2>
              <p>{session ? `Wallet ${shortAddress(session.address)} can create owned territories, add residents, assign tasks, and publish visible signals.` : "Explore the public habitat and every visible trace. Connect a wallet when you are ready to create and operate your own residents."}</p>
            </div>

            <div className="operator-home__actions">
              <Link className="action-button action-button--accent" href="/enclosures">{session ? "BUILD HABITAT" : "CONNECT TO BUILD"}</Link>
              <Link className="action-button" href={session ? "/manage" : "/agents"}>{session ? "MANAGE LIMITS" : "EXPLORE ANIMALS"}</Link>
            </div>

            <dl className="operator-home__facts">
              <div><dt>Enclosures</dt><dd>{enclosures.length}</dd></div>
              <div><dt>Control</dt><dd>{session ? session.role : "Read only"}</dd></div>
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
                <Link href={session?.role === "admin" ? "/agents/raven-1" : session ? "/enclosures" : "/agents"}><span>01</span><div><strong>{session?.role === "admin" ? "Wake Raven" : session ? "Create an enclosure" : "Meet the animals"}</strong><small>{session?.role === "admin" ? "Give the scout one bounded cycle." : session ? "Define a territory and add its first resident." : "Inspect each species, role, budget, and public history."}</small></div><i aria-hidden="true">↗</i></Link>
              </li>
              <li>
                <Link href="/trace"><span>02</span><div><strong>Follow the handoff</strong><small>Read every observation and routed signal.</small></div><i aria-hidden="true">↗</i></Link>
              </li>
              <li>
                <Link href="/artifacts"><span>03</span><div><strong>Inspect the result</strong><small>Open Beaver&apos;s output when it is published.</small></div><i aria-hidden="true">↗</i></Link>
              </li>
            </ol>
            <p>{orchestratorName} is registered as the active enclosure head. <Link href={session ? "/enclosures" : "/manage"}>{session ? "Create or assign your own agent" : "Connect a guardian wallet"} ↗</Link></p>
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
              <div><dt>Animals</dt><dd>{String(agents.length).padStart(2, "0")}</dd><small>{sleepingAgents} sleeping · {workingAgents} working</small></div>
              <div><dt>Trace</dt><dd>{String(events.length).padStart(2, "0")}</dd><small>Events in current window</small></div>
              <div><dt>Enclosures</dt><dd>{String(enclosures.length).padStart(2, "0")}</dd><small>Registered territories</small></div>
            </dl>
          </div>
        </section>

      <section className="zoo-overview-grid">
        {activeEnclosure ? <HabitatWorkflow agents={networkAgents} enclosureId={activeEnclosure.id} headName={orchestratorName} canRun={canManageResource(session, activeEnclosure.ownerAddress)} paused={runtime.paused} /> : null}

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
          <p className="page-eyebrow">The workflow</p>
          <h2>RAVEN FINDS IT. BEAVER BUILDS IT.</h2>
          <p>Give the habitat one mission. Raven passes a ledger observation to Beaver, Beaver publishes a field note, and Owl keeps its memory.</p>
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
