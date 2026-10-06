import { AccessPanel } from "@/components/access-panel";
import { AgentMark, PageHeading } from "@/components/product-ui";
import { RefillButton } from "@/components/refill-button";
import { RuntimeControlPanel } from "@/components/runtime-control";
import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooShell } from "@/components/zoo-shell";
import { formatStatus } from "@/lib/format";
import { shortAddress } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";
import { getAgents, getRuntimeControl } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const [allAgents, session, runtime] = await Promise.all([getAgents(), getSession(), getRuntimeControl()]);
  const agents = session?.role === "admin"
    ? allAgents
    : allAgents.filter((agent) => agent.ownerAddress?.toLowerCase() === session?.address.toLowerCase());
  return (
    <ZooShell active="manage">
      <PageHeading eyebrow="Guardian console / Signed runtime" title="MANAGE" description="Wake owned animals, inspect budgets, and keep every resident inside a visible operational boundary." />
      {!session ? <AccessPanel session={null} title="Connect the guardian wallet.">Public records stay readable without a wallet. Management requires an EIP‑4361 signature and never asks for a transaction.</AccessPanel> : (
        <section className="guardian-summary"><span>{session.role.toUpperCase()}</span><h2>{shortAddress(session.address)}</h2><p>{session.role === "admin" ? "This wallet can operate system residents and the global runtime switch." : "This wallet can operate only the enclosures and animals it created."}</p></section>
      )}
      {session?.role === "admin" ? <RuntimeControlPanel runtime={runtime} /> : null}
      {session ? <section className="manage-list">
        {agents.map((agent) => (
          <article className="manage-row" key={agent.id}>
            <div className="manage-agent"><AgentMark agent={agent} /><span><b>{agent.name}</b><small>{agent.role} / {agent.id}</small></span></div>
            <span className={`status-label status-label--${agent.status}`}><i />{formatStatus(agent.status)}</span>
            <div className="budget-meter"><span><b>{agent.feed}</b> / {agent.feedMax} feed</span><meter min="0" max={agent.feedMax} value={agent.feed}>{agent.feed} of {agent.feedMax}</meter></div>
            <div className="manage-actions"><WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} /><RefillButton endpoint={`/api/agents/${agent.id}/refill`} /></div>
          </article>
        ))}
        {agents.length === 0 ? <p className="quiet-copy">This wallet has no animals yet. Create an enclosure, then assign its first resident.</p> : null}
      </section> : null}
      <aside className="honesty-note"><b>Feed is a compute budget, not stamina.</b><p>Each runtime cycle spends one unit and the balance persists. It never regenerates silently; the local operator can refill it explicitly, and every refill is written to the public trace.</p></aside>
    </ZooShell>
  );
}
