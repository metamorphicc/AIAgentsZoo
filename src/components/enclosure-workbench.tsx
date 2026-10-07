"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { InlineActivity } from "@/components/loading-states";
import type { Agent, ControlAgent, Enclosure } from "@/lib/zoo/types";

type WorkbenchProps = {
  agents: Agent[];
  controlAgents: ControlAgent[];
  enclosures: Enclosure[];
  initialEnclosureId?: string;
};

type Operation = "idle" | "control-agent" | "enclosure" | "animal" | "signal";

const operationLabels: Record<Exclude<Operation, "idle">, string> = {
  "control-agent": "AI agent registered.",
  enclosure: "Enclosure created.",
  animal: "Animal created and assigned.",
  signal: "Signal published to the trace.",
};

export function EnclosureWorkbench({ agents, controlAgents, enclosures, initialEnclosureId }: WorkbenchProps) {
  const router = useRouter();
  const [operation, setOperation] = useState<Operation>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, kind: Exclude<Operation, "idle">, endpoint: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setOperation(kind);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The operation could not be completed");
      form.reset();
      setMessage(operationLabels[kind]);
      router.refresh();
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "The operation could not be completed");
    } finally {
      setOperation("idle");
    }
  }

  const defaultEnclosureId = initialEnclosureId ?? enclosures[0]?.id ?? "";

  return (
    <section className="enclosure-workbench" aria-label="Habitat builder and operator controls">
      <form className="operator-form operator-form--control-agent" onSubmit={(event) => submit(event, "control-agent", "/api/control-agents")}>
        <div className="operator-form__head"><span>01</span><div><h2>Add AI agent</h2><p>Register an orchestrator or specialist that can be assigned to enclosures and pets.</p></div></div>
        <div className="operator-form__split">
          <label><span>Name</span><input autoComplete="off" maxLength={80} minLength={2} name="name" placeholder="Research Grok" required /></label>
          <label><span>Provider</span><select defaultValue="grok" name="provider"><option value="grok">Grok</option><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="custom">Custom</option></select></label>
        </div>
        <div className="operator-form__split">
          <label><span>Model</span><input autoComplete="off" maxLength={120} minLength={1} name="model" placeholder="grok-4" required /></label>
          <label><span>Role</span><input autoComplete="off" maxLength={100} minLength={2} name="role" placeholder="Head orchestrator" required /></label>
        </div>
        <label><span>Description</span><textarea maxLength={360} minLength={4} name="description" placeholder="What this agent coordinates or does for its pets." required rows={3} /></label>
        <label><span>Public endpoint <small>optional · never paste an API key</small></span><input autoComplete="off" inputMode="url" maxLength={2048} name="endpointUrl" placeholder="https://agent.example.com/webhook" type="url" /></label>
        <button aria-busy={operation === "control-agent"} className="action-button action-button--accent" disabled={operation !== "idle"} type="submit">{operation === "control-agent" ? <InlineActivity label="REGISTERING AGENT" /> : "ADD AI AGENT"}</button>
      </form>

      <form className="operator-form operator-form--enclosure" onSubmit={(event) => submit(event, "enclosure", "/api/enclosures")}>
        <div className="operator-form__head"><span>02</span><div><h2>Create enclosure</h2><p>Define a territory and optionally place one AI agent at its head.</p></div></div>
        <label><span>Name</span><input autoComplete="off" maxLength={80} minLength={2} name="name" placeholder="Research Canopy" required /></label>
        <label><span>Territory</span><input autoComplete="off" maxLength={160} minLength={2} name="territory" placeholder="Public data and release notes" required /></label>
        <label><span>Head agent <small>optional</small></span><select defaultValue="" name="headAgentId"><option value="">No head agent yet</option>{controlAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.role}</option>)}</select></label>
        <label><span>Description</span><textarea maxLength={280} minLength={4} name="description" placeholder="What this enclosure is responsible for." required rows={3} /></label>
        <button aria-busy={operation === "enclosure"} className="action-button action-button--accent" disabled={operation !== "idle"} type="submit">{operation === "enclosure" ? <InlineActivity label="CREATING ENCLOSURE" /> : "CREATE ENCLOSURE"}</button>
      </form>

      <form className="operator-form operator-form--animal" onSubmit={(event) => submit(event, "animal", "/api/agents")}>
        <div className="operator-form__head"><span>03</span><div><h2>Create pet</h2><p>Choose a species, habitat, and the AI agent that operates this animal.</p></div></div>
        <div className="operator-form__split">
          <label><span>Name</span><input autoComplete="off" maxLength={80} minLength={2} name="name" placeholder="Raven North" required /></label>
          <label><span>Species</span><select defaultValue="raven" name="species"><option value="raven">Raven</option><option value="beaver">Beaver</option><option value="owl">Owl</option><option value="meerkat">Meerkat</option></select></label>
        </div>
        <div className="operator-form__split">
          <label><span>Enclosure</span><select defaultValue={defaultEnclosureId} name="enclosureId" required>{enclosures.map((enclosure) => <option key={enclosure.id} value={enclosure.id}>{enclosure.name}</option>)}</select></label>
          <label><span>Pet agent <small>optional</small></span><select defaultValue="" name="controlAgentId"><option value="">Autonomous blueprint only</option>{controlAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.model}</option>)}</select></label>
        </div>
        <div className="operator-form__split">
          <label><span>Feed cap</span><input defaultValue="10" max="100" min="1" name="feedMax" required type="number" /></label>
          <label><span>Role override <small>optional</small></span><input autoComplete="off" maxLength={80} name="role" placeholder="Species default" /></label>
        </div>
        <label><span>First task <small>optional</small></span><textarea maxLength={1000} name="task" placeholder="Uses the species default when empty" rows={3} /></label>
        <button aria-busy={operation === "animal"} className="action-button action-button--accent" disabled={operation !== "idle" || enclosures.length === 0} type="submit">{operation === "animal" ? <InlineActivity label="CREATING PET" /> : "CREATE PET"}</button>
      </form>

      <form className="operator-form operator-form--signal" onSubmit={(event) => submit(event, "signal", "/api/signals")}>
        <div className="operator-form__head"><span>04</span><div><h2>Publish a signal</h2><p>Route one visible request between two animals.</p></div></div>
        <div className="operator-form__signal-row">
          <label><span>From</span><select name="agentId" required>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
          <label><span>To</span><select defaultValue={agents[1]?.id} name="targetAgentId" required>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
          <label><span>Request</span><input autoComplete="off" maxLength={500} minLength={3} name="summary" placeholder="Inspect this observation and build a field note." required /></label>
          <button aria-busy={operation === "signal"} className="action-button" disabled={operation !== "idle" || agents.length < 2} type="submit">{operation === "signal" ? <InlineActivity label="PUBLISHING SIGNAL" /> : "PUBLISH SIGNAL"}</button>
        </div>
      </form>

      {message ? <p className={`operator-form__message${error ? " operator-form__message--error" : ""}`} role={error ? "alert" : "status"}>{message}</p> : null}
    </section>
  );
}
