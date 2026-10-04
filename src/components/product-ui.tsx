import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Agent } from "@/lib/zoo/types";
import { formatStatus } from "@/lib/format";

const speciesPortraits: Record<Agent["species"], string> = {
  raven: "/animals/crow.svg",
  beaver: "/animals/beaver.svg",
  owl: "/animals/owl.svg",
  meerkat: "/animals/meerkat.svg",
};

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function AgentMark({ agent }: { agent: Agent }) {
  return (
    <span className={`agent-mark agent-mark--${agent.species}`} aria-hidden="true">
      <Image
        alt=""
        className="agent-mark-image"
        height={512}
        priority={false}
        src={speciesPortraits[agent.species]}
        width={512}
      />
    </span>
  );
}

export function AgentRow({ agent }: { agent: Agent }) {
  return (
    <Link className="agent-row" href={`/agents/${agent.id}`}>
      <AgentMark agent={agent} />
      <span className="agent-row-copy">
        <strong>{agent.name}</strong>
        <small>{agent.role} · {agent.task}</small>
      </span>
      <span className={`status-label status-label--${agent.status}`}>
        <i aria-hidden="true" />{formatStatus(agent.status)}
      </span>
      <span className="feed-readout"><b>{agent.feed}</b> / {agent.feedMax} feed</span>
      <span className="row-arrow" aria-hidden="true">↗</span>
    </Link>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="app-empty-state">
      <span className="empty-glyph" aria-hidden="true">∅</span>
      <div><strong>{title}</strong><p>{children}</p></div>
      {action}
    </div>
  );
}
