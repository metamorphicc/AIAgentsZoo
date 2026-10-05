import type { Metadata } from "next";
import Link from "next/link";

import { Owl3DLab } from "@/components/owl-3d-lab";
import { PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";

export const metadata: Metadata = {
  title: "Owl 01 · 3D Habitat | AI Agent Zoo",
  description: "Inspect the first animated 3D agent specimen in AI Agent Zoo.",
};

export default function OwlLabPage() {
  return (
    <ZooShell active="agents">
      <PageHeading
        actions={<Link className="action-button" href="/agents/owl-1">BACK TO PASSPORT</Link>}
        description="The first rigged zoo specimen. Orbit the model and trigger behavior clips exported directly from its Blender armature."
        eyebrow="Experimental habitat / 3D specimen 001"
        title="OWL 01 IN MOTION"
      />
      <Owl3DLab />
    </ZooShell>
  );
}
