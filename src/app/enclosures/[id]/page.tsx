import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentRow, EmptyState, PageHeading } from "@/components/product-ui";
import { RefillButton } from "@/components/refill-button";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate, formatEventType } from "@/lib/format";
import { shortAddress } from "@/lib/auth/config";
import { canManageResource } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { getEnclosure, getEnclosureAgents, getRecentEvents } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function EnclosurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enclosure = await getEnclosure(id);
  if (!enclosure) notFound();

  const [agents, recentEvents, session] = await Promise.all([getEnclosureAgents(id), getRecentEvents(100), getSession()]);
  const canManage = canManageResource(session, enclosure.ownerAddress);
  const residentIds = new Set(agents.map((agent) => agent.id));
  const events = recentEvents.filter((event) => residentIds.has(event.agentId) || Boolean(event.targetAgentId && residentIds.has(event.targetAgentId))).slice(0, 12);

  return (
    <ZooShell active="enclosures">
      <PageHeading
        eyebrow={`Enclosure / ${enclosure.id}`}
        title={enclosure.name.toUpperCase()}
        description={`${enclosure.description} Territory: ${enclosure.territory}.`}
        actions={<><Link className="action-button" href="/enclosures">ALL ENCLOSURES</Link>{canManage ? <RefillButton endpoint={`/api/enclosures/${enclosure.id}/refill`} label="Refill habitat" /> : null}</>}
      />

      <section className="enclosure-status" aria-label="Enclosure status">
        <div><span>Residents</span><strong>{enclosure.agentCount}</strong></div>
        <div><span>Compute feed</span><strong>{enclosure.feed}<i> / {enclosure.feedMax}</i></strong><meter max={Math.max(1, enclosure.feedMax)} value={enclosure.feed}>{enclosure.feed} of {enclosure.feedMax}</meter></div>
        <div><span>Guardian</span><strong>{enclosure.ownerAddress ? shortAddress(enclosure.ownerAddress) : "SYSTEM"}</strong><small>{canManage ? "Control available" : "Public read only"}</small></div>
      </section>

      <section className="directory-panel">
        <div className="section-heading"><h2>Residents</h2><Link href="/enclosures">Create animal ↗</Link></div>
        {agents.length === 0 ? <EmptyState title="This enclosure is empty" action={<Link className="action-button action-button--accent" href="/enclosures">CREATE ANIMAL</Link>}>Open the habitat builder and assign its first resident.</EmptyState> : <div className="agent-directory">{agents.map((agent) => <AgentRow agent={agent} key={agent.id} />)}</div>}
      </section>

      <section className="agent-ledger">
        <div className="section-heading"><h2>Enclosure activity</h2><Link href="/trace">Full trace ↗</Link></div>
        {events.length === 0 ? <EmptyState title="No interactions yet">Wake a resident or publish a signal from the enclosure workbench.</EmptyState> : <ol className="ledger-list ledger-list--agent">{events.map((event) => <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-badge">{formatEventType(event.type)}</span><p>{event.summary}</p></li>)}</ol>}
      </section>
    </ZooShell>
  );
}
