import { AccessPanel } from "@/components/access-panel";
import { AgentMark, PageHeading } from "@/components/product-ui";
import { RefillButton } from "@/components/refill-button";
import { RuntimeControlPanel } from "@/components/runtime-control";
import { ModerationPanel } from "@/components/moderation-panel";
import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooShell } from "@/components/zoo-shell";
import { formatStatus } from "@/lib/format";
import { launchLimits } from "@/lib/launch-limits";
import { isReadyForCycle } from "@/lib/zoo/workflow";
import { shortAddress } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";
import { getAgents, getRuntimeControl, getEnclosures, getControlAgents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const [allAgents, session, runtime] = await Promise.all([getAgents(), getSession(), getRuntimeControl()]);
  const agents = session?.role === "admin"
    ? allAgents
    : allAgents.filter((agent) => agent.ownerAddress?.toLowerCase() === session?.address.toLowerCase());
  const moderationResources = session?.role === "admin" ? [
    ...(await getEnclosures(true)).filter((item) => item.ownerAddress).map((item) => ({ id: item.id, name: item.name, hidden: item.hidden, kind: "enclosure" as const })),
    ...(await getControlAgents(true)).filter((item) => item.ownerAddress).map((item) => ({ id: item.id, name: item.name, hidden: item.hidden, kind: "control-agent" as const })),
  ] : [];
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
            <div className="manage-actions"><WakeAgentButton agentId={agent.id} disabled={!isReadyForCycle(agent)} /><RefillButton endpoint={`/api/agents/${agent.id}/refill`} /></div>
          </article>
        ))}
        {agents.length === 0 ? <p className="quiet-copy">This wallet has no animals yet. Create an enclosure, then assign its first resident.</p> : null}
      </section> : null}
      <aside className="honesty-note"><b>Feed is a cycle budget.</b><p>Each runtime cycle spends one unit and the balance persists. Guardians can refill it explicitly; refills enter the trace. Daily runtime limits apply even after a refill.</p><p>Each wallet can create up to {launchLimits.enclosuresPerWallet} enclosures, {launchLimits.animalsPerWallet} animals, and {launchLimits.controlAgentsPerWallet} agent profiles. Each enclosure holds up to {launchLimits.animalsPerEnclosure} residents.</p></aside>
      {session?.role === "admin" ? <ModerationPanel resources={moderationResources} /> : null}
    </ZooShell>
  );
}
