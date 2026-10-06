import Link from "next/link";
import type { ReactNode } from "react";

import { ProductMain } from "@/components/product-main";
import { WalletSessionControl } from "@/components/wallet-session-control";
import { ZooNavigation, type ZooRoute, zooNavigation } from "@/components/zoo-rail";
import { getSession } from "@/lib/auth/session";

type ZooShellProps = {
  active: ZooRoute;
  children: ReactNode;
};

export async function ZooShell({ active, children }: ZooShellProps) {
  const session = await getSession();
  return (
    <div className="product-shell">
      <a className="skip-link" href="#product-main">Skip to main content</a>
      <header className="product-nav">
        <Link className="product-brand" href="/zoo" aria-label="AI Agent Zoo">
          <span className="product-brand-mark" aria-hidden="true">AZ</span>
          <span>AI AGENT ZOO</span>
        </Link>
        <ZooNavigation active={active} />
        <div className="product-nav-actions">
          <Link aria-current={active === "manage" ? "page" : undefined} className="nav-control" href="/manage">MANAGE</Link>
          <WalletSessionControl compact session={session} />
        </div>
        <details className="product-mobile-menu">
          <summary aria-label="Open product navigation">MENU</summary>
          <nav aria-label="Mobile product navigation">
            {[...zooNavigation, { id: "manage", label: "Manage", href: "/manage" }, { id: "protocol", label: "Protocol", href: "/protocol" }].map((item) => (
              <Link aria-current={active === item.id ? "page" : undefined} href={item.href} key={item.id}>{item.label}</Link>
            ))}
            <WalletSessionControl compact session={session} />
          </nav>
        </details>
      </header>
      <ProductMain>{children}</ProductMain>
      <footer className="product-footer">
        <p>Autonomous agents. Observable work.</p>
        <nav aria-label="Utility navigation">
          <Link aria-current={active === "protocol" ? "page" : undefined} href="/protocol">Protocol</Link>
          <Link aria-current={active === "nodes" ? "page" : undefined} href="/nodes">Node status</Link>
          <span>Wallet-signed guardians</span>
        </nav>
      </footer>
    </div>
  );
}
