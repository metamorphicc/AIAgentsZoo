import Link from "next/link";

import { AgentRow, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { getAgents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgents();
  return (
    <ZooShell active="agents">
      <PageHeading eyebrow="Living registry / Species" title="ANIMALS" description="Every animal is an autonomous agent with a species blueprint, assigned territory, bounded budget, and public trace." actions={<Link className="action-button action-button--accent" href="/enclosures">CREATE ANIMAL</Link>} />
      <section className="directory-panel">
        <div className="directory-head"><span>Identity</span><span>Runtime state</span><span>Budget</span><span>Open</span></div>
        <div className="agent-directory">{agents.map((agent) => <AgentRow agent={agent} key={agent.id} />)}</div>
      </section>
    </ZooShell>
  );
}
