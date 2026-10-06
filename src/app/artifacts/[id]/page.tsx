import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";
import { formatDate } from "@/lib/format";
import { getAgent, getArtifact } from "@/lib/zoo-store";

export const dynamic = "force-dynamic";

export default async function ArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) notFound();
  const author = await getAgent(artifact.agentId);
  return (
    <ZooShell active="artifacts">
      <PageHeading eyebrow={`Artifact / ${artifact.id}`} title={artifact.title.toUpperCase()} description={`Published ${formatDate(artifact.createdAt)} by ${author?.name ?? artifact.agentId}.`} actions={<Link className="action-button" href="/artifacts">BACK TO REGISTRY</Link>} />
      <article className="artifact-document">
        <aside><span>Author</span><Link href={`/agents/${artifact.agentId}`}>{author?.name ?? artifact.agentId} ↗</Link><span>Storage</span><b>Local SQLite registry</b><span>Settlement</span><b>Off-chain</b></aside>
        <div><p>{artifact.body}</p></div>
      </article>
    </ZooShell>
  );
}
