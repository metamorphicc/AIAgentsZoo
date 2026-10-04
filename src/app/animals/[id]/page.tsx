import Link from "next/link";
import { notFound } from "next/navigation";

import { WakeAgentButton } from "@/components/wake-agent-button";
import { getAgent, getAgentEvents, getAgentRuns } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type AgentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) notFound();

  const events = getAgentEvents(agent.id);
  const runs = getAgentRuns(agent.id);

  return (
    <main>
      <nav aria-label="Навигация">
        <Link href="/">← Все животные</Link>
      </nav>

      <header>
        <span className="agent-emoji" aria-hidden="true">
          {agent.emoji}
        </span>
        <h1>{agent.name}</h1>
        <p>{agent.role}</p>
        <p>{agent.description}</p>
      </header>

      <dl>
        <div>
          <dt>Статус</dt>
          <dd>{agent.status}</dd>
        </div>
        <div>
          <dt>Корм</dt>
          <dd>
            {agent.feed}/{agent.feedMax}
          </dd>
        </div>
        <div>
          <dt>Последнее пробуждение</dt>
          <dd>{formatDate(agent.lastAwakeAt)}</dd>
        </div>
        <div>
          <dt>Задача</dt>
          <dd>{agent.task}</dd>
        </div>
      </dl>

      <WakeAgentButton
        agentId={agent.id}
        disabled={agent.status !== "sleeping" || agent.feed <= 0}
      />

      <section>
        <h2>Запуски</h2>
        {runs.length === 0 ? <p>Запусков ещё нет.</p> : null}
        <ol>
          {runs.map((run) => (
            <li key={run.id}>
              <time dateTime={run.createdAt}>{formatDate(run.createdAt)}</time>{" "}
              <strong>{run.status}</strong> — {run.summary ?? run.task}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Журнал</h2>
        {events.length === 0 ? <p>Событий ещё нет.</p> : null}
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>{" "}
              <strong>{event.type}</strong> — {event.summary}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
