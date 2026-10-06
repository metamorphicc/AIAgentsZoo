import Link from "next/link";

export const zooNavigation = [
  { id: "zoo", label: "Zoo", href: "/zoo" },
  { id: "agents", label: "Animals", href: "/agents" },
  { id: "enclosures", label: "Enclosures", href: "/enclosures" },
  { id: "trace", label: "Trace", href: "/trace" },
  { id: "artifacts", label: "Artifacts", href: "/artifacts" },
  { id: "tasks", label: "Tasks", href: "/tasks" },
  { id: "nodes", label: "Nodes", href: "/nodes" },
] as const;

export type ZooRoute = (typeof zooNavigation)[number]["id"] | "manage" | "protocol";

export function ZooNavigation({ active }: { active: ZooRoute }) {
  return (
    <nav className="product-nav-links" aria-label="Product navigation">
      {zooNavigation.map((item) => (
        <Link aria-current={active === item.id ? "page" : undefined} href={item.href} key={item.id}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
