"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { InlineActivity } from "@/components/loading-states";
import type { Agent, ControlAgent, Enclosure } from "@/lib/zoo/types";

export function AgentAssignmentPanel({ enclosure, animals, controlAgents }: {
  enclosure: Enclosure;
  animals: Agent[];
  controlAgents: ControlAgent[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function assign(event: FormEvent<HTMLFormElement>, id: string, kind: "enclosure" | "animal") {
    event.preventDefault();
    const form = event.currentTarget;
    const field = kind === "enclosure" ? "headAgentId" : "controlAgentId";
    const value = String(new FormData(form).get(field) ?? "") || null;
    setBusy(`${kind}:${id}`);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(kind === "enclosure" ? `/api/enclosures/${id}` : `/api/agents/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The assignment could not be saved");
      setMessage(kind === "enclosure" ? "Head agent updated." : "Pet agent updated.");
      router.refresh();
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "The assignment could not be saved");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="assignment-panel" aria-labelledby="assignment-title">
      <div className="section-heading"><div><h2 id="assignment-title">Agent assignments</h2><p>One head agent coordinates the enclosure. Each pet may use its own specialist agent.</p></div><span>{controlAgents.length} available</span></div>
      {controlAgents.length === 0 ? <p className="quiet-copy">Register an AI agent from the enclosure builder before assigning one.</p> : (
        <div className="assignment-list">
          <form onSubmit={(event) => assign(event, enclosure.id, "enclosure")}>
            <div><b>Enclosure head</b><small>{enclosure.name}</small></div>
            <select defaultValue={enclosure.headAgentId ?? ""} name="headAgentId" aria-label={`Head agent for ${enclosure.name}`}><option value="">No head agent</option>{controlAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.role}</option>)}</select>
            <button className="action-button" disabled={busy !== null} type="submit">{busy === `enclosure:${enclosure.id}` ? <InlineActivity label="SAVING" /> : "SAVE"}</button>
          </form>
          {animals.map((animal) => (
            <form key={animal.id} onSubmit={(event) => assign(event, animal.id, "animal")}>
              <div><b>{animal.name}</b><small>{animal.species} · pet agent</small></div>
              <select defaultValue={animal.controlAgentId ?? ""} name="controlAgentId" aria-label={`AI agent for ${animal.name}`}><option value="">Blueprint only</option>{controlAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.model}</option>)}</select>
              <button className="action-button" disabled={busy !== null} type="submit">{busy === `animal:${animal.id}` ? <InlineActivity label="SAVING" /> : "SAVE"}</button>
            </form>
          ))}
        </div>
      )}
      {message ? <p className={`operator-form__message${error ? " operator-form__message--error" : ""}`} role={error ? "alert" : "status"}>{message}</p> : null}
    </section>
  );
}
