import Link from "next/link";

import { AccessPanel } from "@/components/access-panel";
import { EmptyState, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { shortAddress } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";
import { getAgents, getControlAgents, getEnclosures } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function OperatorsPage() {
  const [controlAgents, animals, enclosures, session] = await Promise.all([getControlAgents(), getAgents(), getEnclosures(), getSession()]);

  return (
    <ZooShell active="operators">
      <PageHeading eyebrow="AI registry / Orchestration" title="AGENTS" description="Register the AI minds behind each habitat, appoint one enclosure head, and give individual pets their own specialist agents." actions={<Link className="action-button action-button--accent" href="/enclosures">ADD AGENT</Link>} />
      {!session ? <AccessPanel session={null} title="The registry is public. Creation is signed.">Connect a guardian wallet to add an AI agent and assign it to your own enclosures or pets.</AccessPanel> : null}
      <section className="control-agent-directory">
        <div className="section-heading"><h2>Registered AI agents</h2><span>{controlAgents.length} total</span></div>
        {controlAgents.length === 0 ? <EmptyState title="No AI agents registered">Connect a wallet and add the first orchestrator.</EmptyState> : (
          <div className="control-agent-grid">
            {controlAgents.map((agent) => {
              const headed = enclosures.filter((enclosure) => enclosure.headAgentId === agent.id);
              const pets = animals.filter((animal) => animal.controlAgentId === agent.id);
              return <article className="control-agent-card" key={agent.id}>
                <div className="control-agent-card__head"><span aria-hidden="true">{agent.name.slice(0, 1).toUpperCase()}</span><div><small>{agent.provider}</small><h2>{agent.name}</h2></div><i>{agent.ownerAddress ? shortAddress(agent.ownerAddress) : "SYSTEM"}</i></div>
                <p>{agent.description}</p>
                <dl><div><dt>Role</dt><dd>{agent.role}</dd></div><div><dt>Model</dt><dd>{agent.model}</dd></div><div><dt>Heads</dt><dd>{headed.length}</dd></div><div><dt>Pets</dt><dd>{pets.length}</dd></div></dl>
                <div className="control-agent-card__links">{headed.map((enclosure) => <Link href={`/enclosures/${enclosure.id}`} key={enclosure.id}>{enclosure.name} ↗</Link>)}{pets.map((pet) => <Link href={`/agents/${pet.id}`} key={pet.id}>{pet.name} ↗</Link>)}</div>
              </article>;
            })}
          </div>
        )}
      </section>
    </ZooShell>
  );
}
