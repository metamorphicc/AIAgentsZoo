import Link from "next/link";

type ZooRailProps = {
  active: "habitat" | "agents" | "trace" | "artifacts";
  statusLabel?: string;
};

const navigation = [
  { id: "habitat", label: "Habitat", href: "/#habitat-map" },
  { id: "agents", label: "Agents", href: "/#agents" },
  { id: "trace", label: "Trace", href: "/#trace" },
  { id: "artifacts", label: "Artifacts", href: "/#artifacts" },
] as const;

export function ZooRail({ active, statusLabel = "Local node" }: ZooRailProps) {
  return (
    <aside className="zoo-rail" aria-label="Zoo navigation">
      <Link className="zoo-brand" href="/" aria-label="AI Agent Zoo home">
        <span className="zoo-brand-mark" aria-hidden="true">AZ</span>
        <span className="zoo-brand-name">AI Agent Zoo</span>
      </Link>

      <nav className="zoo-nav" aria-label="Product navigation">
        {navigation.map((item) => (
          <Link
            aria-current={active === item.id ? "page" : undefined}
            className="zoo-nav-link"
            data-active={active === item.id}
            href={item.href}
            key={item.id}
          >
            <span aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="zoo-node-state">
        <span className="live-indicator" aria-hidden="true" />
        <span><b>{statusLabel}</b><small>Off-chain runtime</small></span>
      </div>
    </aside>
  );
}
