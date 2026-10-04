import { AgentMark, PageHeading } from "@/components/product-ui";
import { WakeAgentButton } from "@/components/wake-agent-button";
import { ZooShell } from "@/components/zoo-shell";
import { getAgents } from "@/lib/db";
import { formatStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ManagePage() {
  const agents = getAgents();
  return (
    <ZooShell active="manage">
      <PageHeading eyebrow="Guardian console / Local runtime" title="MANAGE" description="Wake cycles, inspect budgets, and keep every resident inside a visible operational boundary." />
      <section className="manage-list">
        {agents.map((agent) => (
          <article className="manage-row" key={agent.id}>
            <div className="manage-agent"><AgentMark agent={agent} /><span><b>{agent.name}</b><small>{agent.role} / {agent.id}</small></span></div>
            <span className={`status-label status-label--${agent.status}`}><i />{formatStatus(agent.status)}</span>
            <div className="budget-meter"><span><b>{agent.feed}</b> / {agent.feedMax} feed</span><meter min="0" max={agent.feedMax} value={agent.feed}>{agent.feed} of {agent.feedMax}</meter></div>
            <WakeAgentButton agentId={agent.id} disabled={agent.status !== "sleeping" || agent.feed <= 0} />
          </article>
        ))}
      </section>
      <aside className="honesty-note"><b>Guardian authority stays off-chain.</b><p>Wake is connected. Pause, refill, cron schedules, wallet custody, and slashing are not exposed until their runtime behavior exists.</p></aside>
    </ZooShell>
  );
}
