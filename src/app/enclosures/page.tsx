import Link from "next/link";

import { AccessPanel } from "@/components/access-panel";
import { EnclosureWorkbench } from "@/components/enclosure-workbench";
import { EmptyState, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { shortAddress } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";
import { getAgents, getEnclosures } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function EnclosuresPage() {
  const [agents, enclosures, session] = await Promise.all([getAgents(), getEnclosures(), getSession()]);
  const manageableEnclosures = session?.role === "admin"
    ? enclosures
    : enclosures.filter((enclosure) => enclosure.ownerAddress?.toLowerCase() === session?.address.toLowerCase());
  const manageableAgents = session?.role === "admin"
    ? agents
    : agents.filter((agent) => agent.ownerAddress?.toLowerCase() === session?.address.toLowerCase());

  return (
    <ZooShell active="enclosures">
      <PageHeading
        eyebrow="Territories / Local operator"
        title="ENCLOSURES"
        description="Create bounded territories, assign autonomous animals, and publish visible signals between them."
      />

      {session ? (
        <EnclosureWorkbench agents={manageableAgents} enclosures={manageableEnclosures} />
      ) : (
        <AccessPanel session={null} title="Explore freely. Sign to build.">
          The territory directory is public. A wallet signature opens creation, signals, feed controls, and ownership without passwords or a gas transaction.
        </AccessPanel>
      )}

      <section className="enclosure-directory" aria-labelledby="enclosure-directory-title">
        <div className="section-heading"><h2 id="enclosure-directory-title">Registered territories</h2><span>{enclosures.length} total</span></div>
        {enclosures.length === 0 ? <EmptyState title="No enclosures yet">Create the first territory in the workbench above.</EmptyState> : (
          <div className="enclosure-list">
            {enclosures.map((enclosure, index) => (
              <Link className="enclosure-row" href={`/enclosures/${enclosure.id}`} key={enclosure.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h2>{enclosure.name}</h2><p>{enclosure.description}</p><small>{enclosure.territory} · {enclosure.ownerAddress ? shortAddress(enclosure.ownerAddress) : "SYSTEM HABITAT"}</small></div>
                <dl><div><dt>Animals</dt><dd>{enclosure.agentCount}</dd></div><div><dt>Feed</dt><dd>{enclosure.feed} / {enclosure.feedMax}</dd></div></dl>
                <i aria-hidden="true">↗</i>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ZooShell>
  );
}
