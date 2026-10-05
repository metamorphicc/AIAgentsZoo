import { AgentRow, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { getAgents } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  const agents = getAgents();
  return (
    <ZooShell active="agents">
      <PageHeading eyebrow="Living registry / Species" title="ANIMALS" description="Every animal is an autonomous agent with a fixed role, territory, budget, and public trace." />
      <section className="directory-panel">
        <div className="directory-head"><span>Identity</span><span>Runtime state</span><span>Budget</span><span>Open</span></div>
        <div className="agent-directory">{agents.map((agent) => <AgentRow agent={agent} key={agent.id} />)}</div>
      </section>
    </ZooShell>
  );
}
