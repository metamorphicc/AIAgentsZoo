"use client";

import { useEffect, useState } from "react";

import { InlineActivity } from "@/components/loading-states";

type DemoResult = {
  runId: string;
  isolated: boolean;
  createdAt: string;
  steps: Array<{ actor: string; type: string; summary: string }>;
  artifact: { title: string; body: string };
};

export function DemoRunner() {
  const [state, setState] = useState<"idle" | "loading" | "running" | "complete" | "error">("idle");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state !== "running" || !result) return;
    if (visibleSteps >= result.steps.length) {
      const completeTimer = window.setTimeout(() => {
        setState("complete");
        setMessage("The temporary event chain finished without changing the shared Zoo.");
      }, 350);
      return () => window.clearTimeout(completeTimer);
    }
    const timer = window.setTimeout(() => setVisibleSteps((count) => count + 1), 620);
    return () => window.clearTimeout(timer);
  }, [result, state, visibleSteps]);

  async function runDemo() {
    setState("loading");
    setMessage("Preparing an isolated browser run…");
    setResult(null);
    setVisibleSteps(0);
    try {
      const response = await fetch("/api/demo/run", { method: "POST" });
      const data = await response.json() as DemoResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "The demo run could not start.");
      setResult(data);
      setState("running");
      setMessage("The temporary event chain is running. Nothing is being written to the shared Zoo.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The demo run could not start.");
    }
  }

  return (
    <section className="demo-runner" data-state={state} aria-live="polite">
      <div className="demo-runner__command">
        <div>
          <span>ISOLATED RUN / NO WALLET REQUIRED</span>
          <h2>Watch one mission cross the habitat.</h2>
          <p>Grok dispatches a fixed proof through all four species. The result exists only in this page and does not spend feed or API credits.</p>
        </div>
        <button className="action-button action-button--accent" disabled={state === "loading" || state === "running"} onClick={runDemo} type="button">
          {state === "loading" ? <InlineActivity label="PREPARING RUN" /> : state === "running" ? "RUNNING" : "RUN DEMO"}
        </button>
      </div>

      <div className="demo-runner__trace" aria-label="Temporary demo trace">
        <div className="demo-runner__grok"><span aria-hidden="true">G</span><div><small>CONDUCTOR</small><strong>Grok</strong></div></div>
        {result ? (
          <ol>
            {result.steps.map((step, index) => (
              <li className={index < visibleSteps ? "is-visible" : ""} key={`${step.actor}-${step.type}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><small>{step.type}</small><strong>{step.actor}</strong><p>{step.summary}</p></div>
              </li>
            ))}
          </ol>
        ) : <p className="demo-runner__empty">The temporary ledger opens after you run the demo.</p>}
      </div>

      {result && state === "complete" ? (
        <article className="demo-artifact">
          <span>TEMPORARY ARTIFACT / {result.runId}</span>
          <h3>{result.artifact.title}</h3>
          <p>{result.artifact.body}</p>
        </article>
      ) : null}
      {message ? <p className={`demo-runner__message${state === "error" ? " demo-runner__message--error" : ""}`} role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </section>
  );
}
