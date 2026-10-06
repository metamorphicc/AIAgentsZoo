import type { ReactNode } from "react";

import type { AuthSession } from "@/lib/zoo/types";

import { WalletSessionControl } from "./wallet-session-control";

export function AccessPanel({ session, title, children }: {
  session: AuthSession | null;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="access-panel">
      <div>
        <span>{session ? `${session.role.toUpperCase()} ACCESS` : "VISITOR ACCESS"}</span>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      {!session ? <WalletSessionControl compact session={null} /> : null}
    </aside>
  );
}
