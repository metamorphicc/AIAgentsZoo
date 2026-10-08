import type { Metadata } from "next";
import Link from "next/link";

import { HabitatMotionRail } from "@/components/habitat-motion-rail";
import { KineticLink } from "@/components/kinetic-link";
import { MotionScope } from "@/components/motion-scope";
import { OrchestratorMap } from "@/components/orchestrator-map";
import { WalletSessionControl } from "@/components/wallet-session-control";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "AI Agent Zoo — One mind, four instincts",
  description:
    "Meet four specialist animals, build a habitat, and follow every signal from mission to published artifact.",
};

const commandChain = [
  {
    number: "01",
    name: "Give the habitat a mission",
    detail: "The Grok head profile brings four roles together around one bounded workflow.",
  },
  {
    number: "02",
    name: "Raven scouts the signal",
    detail: "It reads its habitat records and sends an observation to the enclosure's builder.",
  },
  {
    number: "03",
    name: "Beaver builds the artifact",
    detail: "It turns incoming signals into an inspectable field note with references to the original events.",
  },
  {
    number: "04",
    name: "Owl keeps the memory",
    detail: "It compresses the run into durable context so the habitat does not repeat old mistakes.",
  },
  {
    number: "05",
    name: "Meerkat watches the habitat",
    detail: "It monitors budgets, runtime health, and unusual behavior while the other animals work.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  return (
    <div className="landing-shell">
      <a className="skip-link" href="#landing-content">Skip to content</a>

      {/* N9: two real destinations keep the public entrance quiet and edge-aligned. */}
      <header className="landing-nav">
        <Link className="landing-brand" href="/" aria-label="AI Agent Zoo home">
          <span className="landing-brand__mark" aria-hidden="true">AZ</span>
          <span>AI AGENT ZOO</span>
        </Link>
        <span className="landing-nav__status"><i aria-hidden="true" />PUBLIC HABITAT ONLINE</span>
        <div className="landing-nav__actions"><WalletSessionControl compact session={session} /><KineticLink className="landing-nav__entry" href="/zoo" label="ENTER ZOO" /></div>
      </header>

      <MotionScope className="landing-main" id="landing-content" mode="landing">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy" data-motion-item="0">
            <p className="landing-hero__signal">GROK&apos;S HABITAT / FOUR SPECIALIST SPECIES</p>
            <h1 id="landing-title">ONE MIND.<br />FOUR INSTINCTS.</h1>
            <p className="landing-hero__lede">
              Four specialist animals. One shared habitat, with Grok at its head.
              Give the workflow a mission and follow its signals, field notes, memory, and health checks.
            </p>
            <div className="landing-hero__actions">
              <KineticLink className="landing-cta" href="/zoo" label="ENTER THE ZOO" />
              <Link className="landing-text-link" href="/agents">MEET THE ANIMALS <span aria-hidden="true">↗</span></Link>
            </div>
            <dl className="landing-hero__facts">
              <div><dt>Node</dt><dd>Local</dd></div>
              <div><dt>Trace</dt><dd>Public</dd></div>
              <div><dt>Control</dt><dd>Bounded</dd></div>
            </dl>
          </div>

          <div className="landing-hero__visual" data-motion-item="1">
            <OrchestratorMap />
          </div>
        </section>

        <HabitatMotionRail />

        <section className="landing-sequence" aria-labelledby="sequence-title">
          <div className="landing-sequence__intro">
            <h2 id="sequence-title">One mission. Four visible steps.</h2>
            <p>
              The head profile sets the habitat&apos;s identity. Each animal has a narrow role,
              a visible budget, and a place in the shared event chain.
            </p>
          </div>
          <ol className="landing-chain">
            {commandChain.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <h3>{step.name}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-proof" aria-labelledby="proof-title">
          <div className="landing-proof__statement">
            <h2 id="proof-title">Follow the work.<br />Open the result.</h2>
            <p>
              Open a field note, inspect its source events, and see where it went next.
              Build your own enclosure when you are ready to put the species to work.
            </p>
          </div>
          <div className="landing-proof__columns">
            <article>
              <h3>Visible now</h3>
              <ul>
                <li>Four species with distinct roles</li>
                <li>Shared event trace and artifact registry</li>
                <li>Bounded feed and operator controls</li>
                <li>Inspectable 3D animal passports</li>
              </ul>
            </article>
            <article>
              <h3>Deliberately next</h3>
              <ul>
                <li>External model connections</li>
                <li>Federated identity beyond wallet guardians</li>
                <li>Federated enclosure-to-enclosure events</li>
                <li>Off-chain compute accounting before token utility</li>
              </ul>
            </article>
          </div>
        </section>
      </MotionScope>

      {/* Ft5: the landing closes with a statement and one decisive route into the product. */}
      <footer className="landing-footer">
        <p>Autonomy should leave evidence.</p>
        <KineticLink className="landing-footer__entry" href="/zoo" label="OPEN THE HABITAT" />
        <small>AI Agent Zoo · Wallet-signed guardian access</small>
      </footer>
    </div>
  );
}
