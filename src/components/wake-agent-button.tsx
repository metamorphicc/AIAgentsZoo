"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WakeAgentButtonProps = {
  agentId: string;
  disabled?: boolean;
};

export function WakeAgentButton({ agentId, disabled = false }: WakeAgentButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function wakeAgent() {
    setState("loading");
    setMessage("Agent cycle in progress…");

    try {
      const response = await fetch(`/api/agents/${agentId}/wake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "The agent cycle could not start");

      setState("success");
      setMessage("Cycle complete. The public trace is up to date.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The agent cycle could not start");
    }
  }

  return (
    <div className="wake-control" data-state={state}>
      <button className="pill-button pill-button--solid" type="button" onClick={wakeAgent} disabled={disabled || state === "loading"} aria-busy={state === "loading"}>
        {state === "loading" ? <><span className="button-spinner" aria-hidden="true" /> Running cycle</> : state === "success" ? "Cycle complete" : state === "error" ? "Try again" : "Wake agent"}
      </button>
      {message ? <p role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </div>
  );
}
