import Link from "next/link";

import { DemoRunner } from "@/components/demo-runner";
import { PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  return (
    <ZooShell active="demo">
      <PageHeading
        eyebrow="Visitor sandbox / One temporary cycle"
        title="RUN THE HABITAT"
        description="Watch Grok route a fixed mission through Raven, Beaver, Owl, and Meerkat. This run is rate-limited, isolated, and never changes the public ledger."
        actions={<Link className="action-button" href="/trace">VIEW PUBLIC TRACE</Link>}
      />
      <DemoRunner />
    </ZooShell>
  );
}
