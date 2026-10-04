import Link from "next/link";

import { ZooShell } from "@/components/zoo-shell";

export default function NotFound() {
  return (
    <ZooShell active="zoo">
      <section className="not-found-panel">
        <p className="page-eyebrow">404 / Outside the enclosure</p>
        <h1>NOTHING LIVES HERE.</h1>
        <p>This address is not registered in the local habitat.</p>
        <Link className="action-button action-button--accent" href="/zoo">RETURN TO THE ZOO</Link>
      </section>
    </ZooShell>
  );
}
