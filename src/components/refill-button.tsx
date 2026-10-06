"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InlineActivity } from "@/components/loading-states";

export function RefillButton({
  endpoint,
  label = "Refill feed",
}: {
  endpoint: string;
  label?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function refill() {
    setState("loading");
    setMessage("Refilling compute feed…");
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Feed could not be refilled");
      setState("success");
      setMessage("Feed restored to its configured cap.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Feed could not be refilled"
      );
    }
  }

  return (
    <div className="refill-control" data-state={state}>
      <button
        aria-busy={state === "loading"}
        className="action-button"
        disabled={state === "loading"}
        onClick={refill}
        type="button"
        style={{ color: "black" }}
      >
        {state === "loading" ? (
          <InlineActivity label="REFILLING FEED" />
        ) : state === "success" ? (
          "FEED RESTORED"
        ) : state === "error" ? (
          "TRY REFILL"
        ) : (
          label.toUpperCase()
        )}
      </button>
      {message ? (
        <p role={state === "error" ? "alert" : "status"}>{message}</p>
      ) : null}
    </div>
  );
}
