"use client";

import { useEffect, useState } from "react";

export function InlineActivity({ label }: { label: string }) {
  return (
    <span className="inline-activity">
      <span className="button-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function RouteLoadingState() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="route-loading" data-visible={visible} role="status" aria-busy="true" aria-live="polite">
      <header className="route-loading__header">
        <span className="route-loading__brand"><i aria-hidden="true">AZ</i>AI AGENT ZOO</span>
        <span className="route-loading__state"><i aria-hidden="true" />DATA REQUEST OPEN</span>
      </header>

      <main className="route-loading__body">
        <div className="route-loading__copy">
          <span>LOCAL NODE / PUBLIC TRACE</span>
          <h1>Preparing habitat</h1>
          <p>Reading animals, enclosures, and the latest events from the node.</p>
        </div>

        <div className="route-loading__network" aria-hidden="true">
          <div className="route-loading__route"><i /></div>
          <div className="route-loading__nodes">
            <span>GROK</span>
            <span>RAVEN</span>
            <span>BEAVER</span>
            <span>OWL</span>
            <span>MEERKAT</span>
          </div>
        </div>
      </main>
    </div>
  );
}
