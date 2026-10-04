import Link from "next/link";

import { getAgents, getArtifacts, getRecentEvents } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const agents = getAgents();
  const events = getRecentEvents(10);
  const artifacts = getArtifacts(5);

  return (
    <main>
      <header>
        <p>Первый прототип</p>
        <h1>AI Agent Zoo</h1>
        <p>Четыре животных с разными ролями, общим журналом и ограниченным кормом.</p>
      </header>

      <section aria-labelledby="animals-heading">
        <h2 id="animals-heading">Животные</h2>
        <ul className="agent-list">
          {agents.map((agent) => (
            <li key={agent.id}>
              <Link href={`/animals/${agent.id}`}>
                <span aria-hidden="true">{agent.emoji}</span>
                <strong>{agent.name}</strong>
              </Link>
              <p>{agent.role}</p>
              <p>Статус: {agent.status}</p>
              <p>
                Корм: {agent.feed}/{agent.feedMax}
              </p>
              <small>Последнее пробуждение: {formatDate(agent.lastAwakeAt)}</small>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="events-heading">
        <h2 id="events-heading">Последние события</h2>
        {events.length === 0 ? (
          <p>Зоопарк пока спит. События появятся после первого запуска.</p>
        ) : (
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>{" "}
                <strong>{event.type}</strong> — {event.summary}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="artifacts-heading">
        <h2 id="artifacts-heading">Артефакты</h2>
        {artifacts.length === 0 ? <p>Артефактов ещё нет.</p> : null}
      </section>
    </main>
  );
}
