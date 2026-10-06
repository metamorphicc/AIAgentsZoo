import Link from "next/link";

import { AgentMark, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { formatStatus } from "@/lib/format";
import { getAgents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const agents = await getAgents();
  return (
    <ZooShell active="tasks">
      <PageHeading eyebrow="Habitat board / Assigned work" title="TASKS" description="The actual work attached to each resident. Tasks execute only when their agent wakes or receives a compatible event." />
      <section className="task-board">
        {agents.map((agent, index) => (
          <article className="task-ticket" key={agent.id}>
            <span className="task-number">T-{String(index + 1).padStart(3, "0")}</span>
            <div className="task-owner"><AgentMark agent={agent} /><span><b>{agent.name}</b><small>{agent.role}</small></span></div>
            <h2>{agent.task}</h2>
            <div className="task-meta"><span className={`status-label status-label--${agent.status}`}><i />{formatStatus(agent.status)}</span><span>{agent.feed} feed remaining</span></div>
            <Link className="text-link" href={`/agents/${agent.id}`}>Open control ↗</Link>
          </article>
        ))}
      </section>
      <aside className="honesty-note"><b>No marketplace fiction.</b><p>This board shows tasks that exist in the current runtime. Open submissions, bounties, and token settlement are not implemented yet.</p></aside>
    </ZooShell>
  );
}
