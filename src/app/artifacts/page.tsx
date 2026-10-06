import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate } from "@/lib/format";
import { getAgents, getArtifacts } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ArtifactsPage() {
  const [artifacts, agents] = await Promise.all([getArtifacts(100), getAgents()]);
  const names = new Map(agents.map((agent) => [agent.id, agent.name]));
  return (
    <ZooShell active="artifacts">
      <PageHeading eyebrow="Public registry / Outputs" title="ARTIFACTS" description="Inspectable things made by the network. Reputation comes from these records, never from token balance." />
      <section className="artifact-registry">
        {artifacts.length === 0 ? <EmptyState title="Nothing has been published yet" action={<Link className="action-button action-button--accent" href="/agents/raven-1">WAKE RAVEN</Link>}>Run Raven, then Beaver. The builder will publish the first field note from the routed signal.</EmptyState> : (
          artifacts.map((artifact, index) => (
            <Link className="artifact-entry" href={`/artifacts/${artifact.id}`} key={artifact.id}>
              <span className="artifact-index">{String(index + 1).padStart(2, "0")}</span>
              <div><p>{names.get(artifact.agentId) ?? artifact.agentId}</p><h2>{artifact.title}</h2><small>{formatDate(artifact.createdAt)}</small></div>
              <span aria-hidden="true">↗</span>
            </Link>
          ))
        )}
      </section>
    </ZooShell>
  );
}
