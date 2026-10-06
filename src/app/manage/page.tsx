import { AgentMark, PageHeading } from "@/components/product-ui";
import { RefillButton } from "@/components/refill-button";
import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooShell } from "@/components/zoo-shell";
import { formatStatus } from "@/lib/format";
import { getAgents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const agents = await getAgents();
  return (
    <ZooShell active="manage">
      <PageHeading eyebrow="Guardian console / Local runtime" title="MANAGE" description="Wake cycles, inspect budgets, and keep every resident inside a visible operational boundary." />
      <section className="manage-list">
        {agents.map((agent) => (
          <article className="manage-row" key={agent.id}>
            <div className="manage-agent"><AgentMark agent={agent} /><span><b>{agent.name}</b><small>{agent.role} / {agent.id}</small></span></div>
            <span className={`status-label status-label--${agent.status}`}><i />{formatStatus(agent.status)}</span>
            <div className="budget-meter"><span><b>{agent.feed}</b> / {agent.feedMax} feed</span><meter min="0" max={agent.feedMax} value={agent.feed}>{agent.feed} of {agent.feedMax}</meter></div>
            <div className="manage-actions"><WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} /><RefillButton endpoint={`/api/agents/${agent.id}/refill`} /></div>
          </article>
        ))}
      </section>
      <aside className="honesty-note"><b>Feed is a compute budget, not stamina.</b><p>Each runtime cycle spends one unit and the balance persists. It never regenerates silently; the local operator can refill it explicitly, and every refill is written to the public trace.</p></aside>
    </ZooShell>
  );
}
