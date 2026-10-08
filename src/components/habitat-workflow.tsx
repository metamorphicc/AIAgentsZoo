"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Agent, Artifact } from "@/lib/zoo/types";
import { isReadyForCycle, workflowResidents, type WorkflowUpdate } from "@/lib/zoo/workflow";

const roles = {
  raven: { label: "Scout", image: "crow", verb: "Observe", copy: "Read the enclosure ledger and send a habitat snapshot to its builder." },
  beaver: { label: "Builder", image: "beaver", verb: "Build", copy: "Turn incoming signals into a field note with references to its source events." },
  owl: { label: "Archivist", image: "owl", verb: "Remember", copy: "Record the published output so the next cycle can refer back to it." },
  meerkat: { label: "Sentinel", image: "meerkat", verb: "Watch", copy: "Check the residents' status and remaining feed, then report anything that needs attention." },
};

type Props = { agents: Agent[]; enclosureId: string; headName: string; canRun: boolean; paused: boolean };

export function HabitatWorkflow({ agents, enclosureId, headName, canRun, paused }: Props) {
  const router = useRouter();
  const residents = workflowResidents(agents);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<"guide" | "running" | "finished" | "error">("guide");
  const [mission, setMission] = useState("Inspect this habitat and publish a field note.");
  const [updates, setUpdates] = useState<Extract<WorkflowUpdate, { type: "completed" }>[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!playing || mode !== "guide" || !residents.length) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !media.matches && rootRef.current && rootRef.current.getBoundingClientRect().bottom > 0 && rootRef.current.getBoundingClientRect().top < window.innerHeight) {
        setStep((current) => (current + 1) % (residents.length + 1));
      }
    }, 3200);
    return () => window.clearInterval(timer);
  }, [playing, mode, residents.length]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function runHabitat() {
    if (mode === "running") return;
    setMode("running");
    setStep(0);
    setUpdates([]);
    setArtifacts([]);
    setError("");
    const abort = new AbortController();
    abortRef.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 125_000);
    try {
      const response = await fetch(`/api/enclosures/${enclosureId}/run`, {
        method: "POST", credentials: "same-origin", signal: abort.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: mission, requestId: crypto.randomUUID() }),
      });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error ?? "The habitat could not start.");
      }
      if (!response.body) throw new Error("The run connection was interrupted.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let finished = false;
      while (true) {
        const { value, done } = await reader.read();
        pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const update = JSON.parse(line) as WorkflowUpdate;
          if (update.type === "running") {
            setStep(residents.findIndex((animal) => animal.id === update.agentId) + 1);
          } else if (update.type === "completed") {
            setUpdates((current) => [...current, update]);
            // Present each recorded handoff long enough to follow it visually.
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise((resolve) => window.setTimeout(resolve, 1000));
          } else if (update.type === "finished") {
            finished = true;
            setArtifacts(update.artifacts);
            setMode("finished");
          } else if (update.type === "error") {
            throw new Error(update.error);
          }
        }
        if (done) break;
      }
      if (!finished) throw new Error("The connection ended early. Check the trace before starting another run.");
      router.refresh();
    } catch (caught) {
      if (!abort.signal.aborted || abortRef.current === abort) {
        setMode("error");
        setError(caught instanceof Error && caught.name !== "AbortError" ? caught.message : "The run connection ended. Check the trace for recorded steps.");
        router.refresh();
      }
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === abort) abortRef.current = null;
    }
  }

  const active = residents[step - 1];
  const currentUpdate = active ? updates.find((update) => update.agentId === active.id) : null;
  const blocked = paused || !residents.length || residents.some((animal) => !isReadyForCycle(animal));

  return (
    <section className="habitat-workflow" ref={rootRef} data-mode={mode} aria-label="Habitat workflow">
      <div className="workflow-heading">
        <div><span className="page-eyebrow">ONE MISSION · SHARED TRACE</span><h2>Follow the habitat.</h2></div>
        <span className="workflow-state"><i aria-hidden="true" />{mode === "running" ? "RUN IN PROGRESS" : mode === "finished" ? "RUN RECORDED" : mode === "error" ? "RUN STOPPED" : "SPECIES WORKFLOW"}</span>
      </div>
      <div className="workflow-nodes">
        <button className="workflow-node workflow-node--head" type="button" data-active={step === 0} disabled={mode === "running"} onClick={() => { setStep(0); setPlaying(false); }}>
          <span className="workflow-portrait workflow-portrait--head">{headName.slice(0, 1).toUpperCase()}</span>
          <strong>{headName}</strong><small>Head profile</small><em>Mission</em>
        </button>
        {residents.map((animal, index) => (
          <button className="workflow-node" key={animal.id} type="button" data-active={step === index + 1} data-complete={updates.some((update) => update.agentId === animal.id)} disabled={mode === "running"} onClick={() => { setStep(index + 1); setPlaying(false); }}>
            <span className="workflow-portrait"><Image src={`/animals/${roles[animal.species].image}.svg`} width={100} height={100} alt="" /></span>
            <strong>{animal.name}</strong><small>{roles[animal.species].label}</small><em>{updates.some((update) => update.agentId === animal.id) ? "Recorded ✓" : roles[animal.species].verb}</em>
          </button>
        ))}
      </div>
      <div className="workflow-detail" key={`${mode}-${step}`}>
        <span>{String(step + 1).padStart(2, "0")} / {String(residents.length + 1).padStart(2, "0")}</span>
        <div><h3>{active ? `${active.name} · ${roles[active.species].verb}` : "Give the habitat a direction"}</h3><p>{currentUpdate?.summary ?? (active ? roles[active.species].copy : "One mission passes through the species in order. Each resident spends one feed unit and records its own step.")}</p></div>
        {mode === "guide" ? <button type="button" className="workflow-motion-control" aria-pressed={!playing} onClick={() => setPlaying((current) => !current)}>{playing ? "Pause flow" : "Play flow"}</button> : null}
      </div>
      {canRun ? (
        <form className="workflow-mission" onSubmit={(event) => { event.preventDefault(); void runHabitat(); }}>
          <label><span>Mission</span><input value={mission} onChange={(event) => setMission(event.target.value)} minLength={3} maxLength={1000} required disabled={mode === "running"} /></label>
          <button className="action-button action-button--accent" type="submit" disabled={blocked || mode === "running"} aria-busy={mode === "running"}>{mode === "running" ? "RUNNING HABITAT…" : "RUN HABITAT →"}</button>
          <small>{paused ? "Runtime paused by the keeper." : blocked ? "Refill or resume the participating residents to run." : `${residents.length} cycles · ${residents.length} feed units · visible results`}</small>
        </form>
      ) : <div className="workflow-invitation"><p>Follow each role above, then build a habitat and run your own mission.</p><Link className="action-button action-button--accent" href="/enclosures">BUILD YOUR HABITAT ↗</Link></div>}
      {mode === "finished" ? <div className="workflow-result" role="status"><strong>{updates.length} steps recorded · {artifacts.length} output{artifacts.length === 1 ? "" : "s"} published</strong><div>{artifacts.map((artifact) => <Link key={artifact.id} href={`/artifacts/${artifact.id}`}>{artifact.title} ↗</Link>)}<Link href="/trace">Follow the trace ↗</Link></div></div> : null}
      {error ? <p className="workflow-error" role="alert">{error}</p> : null}
    </section>
  );
}
