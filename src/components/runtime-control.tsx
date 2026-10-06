"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InlineActivity } from "@/components/loading-states";
import type { RuntimeControl } from "@/lib/zoo/types";

export function RuntimeControlPanel({ runtime }: { runtime: RuntimeControl }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function updateRuntime() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: !runtime.paused }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Runtime state could not be changed.");
      router.refresh();
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Runtime state could not be changed.");
    }
  }

  return (
    <section className="runtime-control" data-paused={runtime.paused}>
      <div>
        <span>GLOBAL KILL SWITCH</span>
        <h2>{runtime.paused ? "Runtime paused" : "Runtime accepting cycles"}</h2>
        <p>{runtime.paused ? "Every wake request is blocked before model or feed use." : "Owned agents can run inside their configured feed and rate limits."}</p>
      </div>
      <button className={`action-button${runtime.paused ? " action-button--accent" : ""}`} disabled={state === "loading"} onClick={updateRuntime} type="button">
        {state === "loading" ? <InlineActivity label="UPDATING RUNTIME" /> : runtime.paused ? "RESUME RUNTIME" : "PAUSE RUNTIME"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </section>
  );
}
