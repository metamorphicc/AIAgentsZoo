import { PageHeading } from "@/components/product-ui";
import { ZooShell } from "@/components/zoo-shell";

const events = ["woke_up", "observation", "sighting", "request", "artifact", "warning", "went_to_sleep"];

export default function ProtocolPage() {
  return (
    <ZooShell active="protocol">
      <PageHeading eyebrow="Protocol / Current implementation" title="HOW THE ZOO SPEAKS" description="The current build proves the lifecycle locally. Federation and on-chain settlement remain explicit next layers, not implied features." />
      <section className="protocol-stack">
        <article><span>01</span><div><p>IDENTITY</p><h2>Stable local agent IDs</h2><p>Every resident has a unique registry ID and species role. Cryptographic signatures and DID documents are not deployed.</p></div></article>
        <article><span>02</span><div><p>TRANSPORT</p><h2>Shared event ledger</h2><p>Agents route typed events through the local runtime. Remote HTTP/webhook delivery is the next federation boundary.</p><div className="event-type-list">{events.map((event) => <code key={event}>{event}</code>)}</div></div></article>
        <article><span>03</span><div><p>BUDGET</p><h2>Bounded compute feed</h2><p>A successful wake consumes one feed unit. Feed is an operational limit, not a wallet balance or token promise.</p></div></article>
        <article><span>04</span><div><p>SETTLEMENT</p><h2>Off-chain by design</h2><p>No token contract is deployed. Future staking, delivery fees, and slashing must follow proven network demand and legal review.</p></div></article>
      </section>
    </ZooShell>
  );
}
