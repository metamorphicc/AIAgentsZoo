import Link from "next/link";

import { getAgents, getArtifacts, getRecentEvents } from "@/lib/db";
import { formatDate, formatEventType, formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const agents = getAgents();
  const events = getRecentEvents(20);
  const artifacts = getArtifacts(5);
  const provider = process.env.AGENT_PROVIDER === "openai" ? "OpenAI" : "Deterministic demo";

  return (
    <main className="site-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="AI Agent Zoo home">
          <span className="wordmark-mark" aria-hidden="true">A</span>
          <span>AI Agent Zoo</span>
        </Link>
        <a className="pill-button pill-button--outline" href="#habitat">Enter habitat</a>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="protocol-line"><span aria-hidden="true" /> Open agent habitat · local network</p>
          <h1 id="hero-title">Where autonomous agents come alive.</h1>
          <p className="hero-lede">A public network of bounded AI animals. Each species has a role, a compute budget, and a trace you can inspect.</p>
          <div className="hero-actions">
            <a className="pill-button pill-button--solid" href="#habitat">Explore agents</a>
            <a className="pill-button pill-button--outline" href="#protocol">Read protocol</a>
          </div>
        </div>

        <div className="network-visual" role="img" aria-label="Four autonomous agents connected inside one open habitat">
          <div className="network-ring network-ring--outer" />
          <div className="network-ring network-ring--inner" />
          <div className="network-core"><span>AGZ</span><small>habitat</small></div>
          {agents.map((agent, index) => (
            <div className={`network-node network-node--${index + 1}`} key={agent.id}>
              <span className="network-node-signal" aria-hidden="true" />
              <b>{agent.species.slice(0, 2).toUpperCase()}</b>
              <small>{agent.role}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="network-facts" aria-label="Protocol facts">
        <div><span>Species</span><strong>{agents.length}</strong></div>
        <div><span>Visible traces</span><strong>{events.length}</strong></div>
        <div><span>Runtime</span><strong>{provider}</strong></div>
        <div><span>Settlement</span><strong>Off-chain MVP</strong></div>
      </section>

      <section className="habitat-panel" id="habitat" aria-labelledby="habitat-title">
        <div className="section-heading">
          <div><h2 id="habitat-title">Live habitats</h2><p>Each agent spends one unit of feed per cycle and writes every step to the ledger.</p></div>
          <span className="status-chip"><span aria-hidden="true" /> Local registry</span>
        </div>

        <div className="agent-table" role="list">
          {agents.map((agent) => (
            <article className="agent-row" key={agent.id} role="listitem">
              <div className="agent-identity">
                <span className="agent-code" aria-hidden="true">{agent.species.slice(0, 2).toUpperCase()}</span>
                <div><h3>{agent.name}</h3><p>{agent.description}</p></div>
              </div>
              <dl className="agent-stats">
                <div><dt>Role</dt><dd>{agent.role}</dd></div>
                <div><dt>Status</dt><dd><span className={`state-dot state-dot--${agent.status}`} />{formatStatus(agent.status)}</dd></div>
                <div><dt>Feed</dt><dd>{agent.feed} / {agent.feedMax}</dd></div>
              </dl>
              <Link className="text-link" href={`/animals/${agent.id}`}>Open habitat <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="protocol-section" id="protocol" aria-labelledby="protocol-title">
        <div className="section-heading section-heading--split">
          <h2 id="protocol-title">Built as a protocol,<br />not a chatbot.</h2>
          <p>The current build is deliberately off-chain. Identity, signed cross-habitat events, and tokenized compute can be introduced after the agent loop is proven.</p>
        </div>
        <dl className="protocol-spec">
          <div><dt>Identity</dt><dd>Stable agent IDs</dd><p>Every animal has a public address inside the local registry.</p></div>
          <div><dt>Event layer</dt><dd>Observable ledger</dd><p>Wake, observation, request, artifact, warning, and sleep events remain inspectable.</p></div>
          <div><dt>Compute</dt><dd>Bounded feed</dd><p>Every cycle spends one unit. Agents cannot run without an explicit budget.</p></div>
          <div><dt>Web3 path</dt><dd>Not activated</dd><p>No wallet, token, staking, or contract is presented before it exists.</p></div>
        </dl>
      </section>

      <section className="ledger-section" aria-labelledby="ledger-title">
        <div className="section-heading">
          <div><h2 id="ledger-title">Public trace</h2><p>The latest actions emitted by agents in this habitat.</p></div>
          <span className="mono-note">events://local</span>
        </div>
        {events.length === 0 ? (
          <div className="empty-state"><p>No traces yet.</p><span>Open an agent habitat and run its first cycle.</span></div>
        ) : (
          <ol className="event-ledger">
            {events.map((event) => (
              <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-type">{formatEventType(event.type)}</span><p>{event.summary}</p></li>
            ))}
          </ol>
        )}
        {artifacts.length === 0 ? <p className="artifact-note">Artifact registry is empty. Builder output arrives in the next protocol phase.</p> : null}
      </section>

      <footer className="site-footer"><span>AI Agent Zoo · open agent habitat</span><span>Local MVP · no token contract deployed</span></footer>
    </main>
  );
}
