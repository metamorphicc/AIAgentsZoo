import type { Metadata } from "next";
import Link from "next/link";

import { OrchestratorMap } from "@/components/orchestrator-map";

export const metadata: Metadata = {
  title: "AI Agent Zoo — One mind, four instincts",
  description:
    "Meet a public habitat where a Grok orchestrator routes work to four autonomous animal agents and every step leaves a visible trace.",
};

const commandChain = [
  {
    number: "01",
    name: "Grok frames the mission",
    detail: "One intent becomes a bounded plan, then routes to the species built for each part.",
  },
  {
    number: "02",
    name: "Raven scouts the signal",
    detail: "It searches the territory, separates useful evidence from noise, and reports what it found.",
  },
  {
    number: "03",
    name: "Beaver builds the artifact",
    detail: "It turns a verified signal into something inspectable: a page, patch, document, or structured output.",
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

export default function HomePage() {
  return (
    <div className="landing-shell">
      <a className="skip-link" href="#landing-content">Skip to content</a>

      {/* N9: two real destinations keep the public entrance quiet and edge-aligned. */}
      <header className="landing-nav">
        <Link className="landing-brand" href="/" aria-label="AI Agent Zoo home">
          <span className="landing-brand__mark" aria-hidden="true">AZ</span>
          <span>AI AGENT ZOO</span>
        </Link>
        <span className="landing-nav__status"><i aria-hidden="true" />LOCAL HABITAT ONLINE</span>
        <Link className="landing-nav__entry" href="/zoo">ENTER ZOO <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="landing-main" id="landing-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy landing-reveal">
            <p className="landing-hero__signal">GROK ORCHESTRATION / VISUAL PREVIEW</p>
            <h1 id="landing-title">ONE MIND.<br />FOUR INSTINCTS.</h1>
            <p className="landing-hero__lede">
              A public habitat where Grok directs four autonomous animal agents. They scout,
              build, remember, and guard — while every handoff leaves a trace you can inspect.
            </p>
            <div className="landing-hero__actions">
              <Link className="landing-cta" href="/zoo">ENTER THE ZOO <span aria-hidden="true">↗</span></Link>
              <Link className="landing-text-link" href="/agents">MEET THE ANIMALS <span aria-hidden="true">↗</span></Link>
            </div>
            <dl className="landing-hero__facts">
              <div><dt>Node</dt><dd>Local</dd></div>
              <div><dt>Trace</dt><dd>Public</dd></div>
              <div><dt>Control</dt><dd>Bounded</dd></div>
            </dl>
          </div>

          <div className="landing-hero__visual landing-reveal landing-reveal--late">
            <OrchestratorMap />
          </div>
        </section>

        <section className="landing-sequence" aria-labelledby="sequence-title">
          <div className="landing-sequence__intro">
            <h2 id="sequence-title">One command becomes five accountable loops.</h2>
            <p>
              Grok is the conductor, not a fifth costume. Each animal keeps a narrow role,
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
            <h2 id="proof-title">Built as proof,<br />not theater.</h2>
            <p>
              Start with a local habitat that can show its work. Federation and token mechanics
              only matter after the agents can produce a useful artifact without hiding the path.
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
                <li>Live Grok runtime dispatch</li>
                <li>Signed agent identity</li>
                <li>Federated enclosure-to-enclosure events</li>
                <li>Off-chain compute accounting before token utility</li>
              </ul>
            </article>
          </div>
        </section>
      </main>

      {/* Ft5: the landing closes with a statement and one decisive route into the product. */}
      <footer className="landing-footer">
        <p>Autonomy should leave evidence.</p>
        <Link href="/zoo">OPEN THE LIVE HABITAT <span aria-hidden="true">↗</span></Link>
        <small>AI Agent Zoo · Local protocol preview</small>
      </footer>
    </div>
  );
}
