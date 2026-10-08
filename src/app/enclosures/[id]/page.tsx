import Link from "next/link";
import { notFound } from "next/navigation";

import { AgentRow, EmptyState, PageHeading } from "@/components/product-ui";
import { AgentAssignmentPanel } from "@/components/agent-assignment-panel";
import { RefillButton } from "@/components/refill-button";
import { HabitatWorkflow } from "@/components/habitat-workflow";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate, formatEventType } from "@/lib/format";
import { shortAddress } from "@/lib/auth/config";
import { canManageResource } from "@/lib/auth/authorization";
import { getSession } from "@/lib/auth/session";
import { getControlAgents, getEnclosure, getEnclosureAgents, getEnclosureEvents, getRuntimeControl } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function EnclosurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enclosure = await getEnclosure(id);
  if (!enclosure) notFound();

  const [agents, controlAgents, events, session, runtime] = await Promise.all([getEnclosureAgents(id), getControlAgents(), getEnclosureEvents(id, 12), getSession(), getRuntimeControl()]);
  const canManage = canManageResource(session, enclosure.ownerAddress);
  const assignableControlAgents = session?.role === "admin"
    ? controlAgents
    : controlAgents.filter((agent) => agent.ownerAddress?.toLowerCase() === session?.address.toLowerCase());
  const headAgent = controlAgents.find((agent) => agent.id === enclosure.headAgentId) ?? null;

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
        <div><span>Head agent</span><strong>{headAgent?.name ?? "UNASSIGNED"}</strong><small>{headAgent ? `${headAgent.provider} · ${headAgent.model}` : canManage ? "Assign an agent below" : "No orchestrator registered"}</small></div>
      </section>

      {headAgent ? <section className="enclosure-orchestrator"><span aria-hidden="true">{headAgent.name.slice(0, 1).toUpperCase()}</span><div><small>HEAD AGENT · {headAgent.provider.toUpperCase()}</small><h2>{headAgent.name}</h2><p>{headAgent.description}</p></div><dl><div><dt>Role</dt><dd>{headAgent.role}</dd></div><div><dt>Model</dt><dd>{headAgent.model}</dd></div><div><dt>Guardian</dt><dd>{headAgent.ownerAddress ? shortAddress(headAgent.ownerAddress) : "Zoo system"}</dd></div></dl></section> : null}

      {agents.length ? <HabitatWorkflow agents={agents} enclosureId={id} headName={headAgent?.name ?? "Habitat"} canRun={canManage} paused={runtime.paused} /> : null}

      {canManage ? <AgentAssignmentPanel animals={agents} controlAgents={assignableControlAgents} enclosure={enclosure} /> : null}

      <section className="directory-panel">
        <div className="section-heading"><h2>Pets</h2><Link href="/enclosures">Create pet ↗</Link></div>
        {agents.length === 0 ? <EmptyState title="This enclosure is empty" action={<Link className="action-button action-button--accent" href="/enclosures">CREATE PET</Link>}>Open the habitat builder and assign its first resident.</EmptyState> : <div className="agent-directory">{agents.map((agent) => <AgentRow agent={agent} key={agent.id} />)}</div>}
      </section>

      <section className="agent-ledger">
        <div className="section-heading"><h2>Enclosure activity</h2><Link href="/trace">Full trace ↗</Link></div>
        {events.length === 0 ? <EmptyState title="No interactions yet">Wake a resident or publish a signal from the enclosure workbench.</EmptyState> : <ol className="ledger-list ledger-list--agent">{events.map((event) => <li key={event.id}><time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time><span className="event-badge">{formatEventType(event.type)}</span><p>{event.summary}</p></li>)}</ol>}
      </section>
    </ZooShell>
  );
}
