import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate, formatEventType } from "@/lib/format";
import { getAgents, getRecentEvents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function TracePage() {
  const [agents, events] = await Promise.all([getAgents(), getRecentEvents(100)]);
  const names = new Map(agents.map((agent) => [agent.id, agent.name]));
  return (
    <ZooShell active="trace">
      <PageHeading eyebrow="Public ledger / Local node" title="TRACE" description="An append-only view of wake cycles, observations, routed signals, artifacts, warnings, and sleep events." />
      <section className="ledger-panel">
        <div className="ledger-head"><span>Time</span><span>Agent</span><span>Event</span><span>Record</span></div>
        {events.length === 0 ? <EmptyState title="No public events">Wake an agent to write the first signed-in-spirit local trace.</EmptyState> : (
          <ol className="ledger-list">{events.map((event) => (
            <li key={event.id}>
              <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
              <Link href={`/agents/${event.agentId}`}>{names.get(event.agentId) ?? event.agentId}</Link>
              <span className="event-badge">{formatEventType(event.type)}</span>
              <p>{event.summary}{event.targetAgentId ? <small> Routed to <Link href={`/agents/${event.targetAgentId}`}>{names.get(event.targetAgentId) ?? event.targetAgentId}</Link></small> : null}</p>
            </li>
          ))}</ol>
        )}
      </section>
    </ZooShell>
  );
}
