import Link from "next/link";

import { PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { getAgents, getRecentEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function NodesPage() {
  const agents = getAgents();
  const events = getRecentEvents(100);
  const healthy = !agents.some((agent) => agent.status === "error");
  return (
    <ZooShell active="nodes">
      <PageHeading eyebrow="Network / Federation" title="NODES" description="The local habitat is real and online. Federation is deliberately shown as unavailable until a second signed enclosure exists." />
      <section className="node-console">
        <article className="primary-node">
          <div className="node-title"><span className={healthy ? "node-orbit" : "node-orbit node-orbit--error"} aria-hidden="true" /><div><p>NODE 01</p><h2>LOCAL HABITAT</h2></div><span className={`status-label status-label--${healthy ? "sleeping" : "error"}`}><i />{healthy ? "Healthy" : "Attention"}</span></div>
          <dl><div><dt>Residents</dt><dd>{agents.length}</dd></div><div><dt>Ledger records</dt><dd>{events.length}</dd></div><div><dt>Transport</dt><dd>In-process SQLite</dd></div><div><dt>Provider</dt><dd>{process.env.AGENT_PROVIDER === "openai" ? "OpenAI" : "Deterministic demo"}</dd></div></dl>
          <Link className="text-link" href="/trace">Inspect ledger ↗</Link>
        </article>
        <article className="federation-slot"><span>+</span><h2>CONNECT AN ENCLOSURE</h2><p>HTTP event transport, signed identities, and remote subscriptions belong to the federation milestone. No remote node is currently claimed.</p><Link className="action-button" href="/protocol">READ PROTOCOL</Link></article>
      </section>
    </ZooShell>
  );
}
