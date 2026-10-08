"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Resource = { id: string; name: string; hidden: boolean; kind: "enclosure" | "control-agent" };

export function ModerationPanel({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function toggle(resource: Resource) {
    setPending(resource.id);
    setError("");
    try {
      const response = await fetch("/api/admin/visibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: resource.id, kind: resource.kind, hidden: !resource.hidden }) });
      if (!response.ok) throw new Error("Visibility could not be updated.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Visibility could not be updated."); }
    finally { setPending(null); }
  }
  return <section className="moderation-list"><div className="section-heading"><h2>Public directory</h2><span>Keeper controls</span></div><p className="quiet-copy">Hide spam or test entries without deleting their data. A hidden enclosure also hides its residents, trace, and artifacts.</p>{resources.map((resource) => <div className="moderation-row" key={resource.id}><div><strong>{resource.name}</strong><small>{resource.kind} · {resource.hidden ? "Hidden" : "Public"}</small></div><button className="action-button" type="button" disabled={pending !== null} onClick={() => void toggle(resource)}>{pending === resource.id ? "UPDATING…" : resource.hidden ? "RESTORE" : "HIDE"}</button></div>)}{!resources.length ? <p className="quiet-copy">No custom entries to moderate.</p> : null}{error ? <p role="alert">{error}</p> : null}</section>;
}
