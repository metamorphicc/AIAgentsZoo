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
    setMessage("Животное выполняет цикл…");

    try {
      const response = await fetch(`/api/agents/${agentId}/wake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "Запуск не удался");

      setState("success");
      setMessage("Цикл завершён. Журнал обновлён.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Запуск не удался");
    }
  }

  return (
    <div className="wake-control">
      <button type="button" onClick={wakeAgent} disabled={disabled || state === "loading"}>
        {state === "loading" ? "Работает…" : "Разбудить"}
      </button>
      {message ? <p role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </div>
  );
}
