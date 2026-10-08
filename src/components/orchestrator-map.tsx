import Image from "next/image";

const animals = [
  { code: "RA", name: "Raven", role: "Scout", src: "/animals/crow.svg" },
  { code: "BE", name: "Beaver", role: "Builder", src: "/animals/beaver.svg" },
  { code: "OW", name: "Owl", role: "Archivist", src: "/animals/owl.svg" },
  { code: "ME", name: "Meerkat", role: "Sentinel", src: "/animals/meerkat.svg" },
];

export function OrchestratorMap() {
  return (
    <figure className="orchestrator-map" aria-labelledby="orchestrator-map-title">
      <figcaption className="sr-only" id="orchestrator-map-title">
        The founding habitat places the Grok head profile above Raven, Beaver, Owl, and Meerkat.
      </figcaption>

      <svg className="orchestrator-map__routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="orchestrator-map__route orchestrator-map__route--active" d="M50 18 L50 43" />
        <path className="orchestrator-map__route" d="M50 57 C50 68 12 65 12 78" />
        <path className="orchestrator-map__route" d="M50 57 C50 68 38 65 38 78" />
        <path className="orchestrator-map__route" d="M50 57 C50 68 62 65 62 78" />
        <path className="orchestrator-map__route" d="M50 57 C50 68 88 65 88 78" />
      </svg>

      <div className="orchestrator-map__grok">
        <span className="orchestrator-map__grok-mark" aria-hidden="true">G</span>
        <span><small>PRIMARY ORCHESTRATOR</small><strong>GROK</strong></span>
        <i>Head profile</i>
      </div>

      <div className="orchestrator-map__ledger">
        <span aria-hidden="true" />
        <strong>SHARED EVENT LEDGER</strong>
        <small>Every handoff becomes a public trace</small>
      </div>

      <ol className="orchestrator-map__animals">
        {animals.map((animal) => (
          <li key={animal.code}>
            <span className="orchestrator-map__portrait" aria-hidden="true">
              <Image alt="" height={180} src={animal.src} width={180} />
            </span>
            <span><strong>{animal.name}</strong><small>{animal.role}</small></span>
            <b>{animal.code}</b>
          </li>
        ))}
      </ol>

      <p className="orchestrator-map__honesty">SCOUT → BUILD → REMEMBER → WATCH</p>
    </figure>
  );
}
