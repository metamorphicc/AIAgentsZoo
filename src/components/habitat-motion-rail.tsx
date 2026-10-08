"use client";

import { useState } from "react";

const handoffs = [
  ["GROK", "RAVEN", "FRAME"],
  ["RAVEN", "BEAVER", "SIGNAL"],
  ["BEAVER", "OWL", "ARTIFACT"],
  ["OWL", "MEERKAT", "MEMORY"],
  ["MEERKAT", "GROK", "HEALTH"],
] as const;

function RailItems({ hidden = false }: { hidden?: boolean }) {
  return (
    <span className="habitat-motion-rail__set" aria-hidden={hidden || undefined}>
      {handoffs.map(([source, target, event]) => (
        <span className="habitat-motion-rail__item" key={`${source}-${target}`}>
          <b>{source}</b>
          <span aria-hidden="true">→</span>
          <b>{target}</b>
          <em>{event}</em>
        </span>
      ))}
    </span>
  );
}

export function HabitatMotionRail() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      className="habitat-motion-rail"
      data-motion-item="2"
      data-paused={paused}
      aria-label="Species handoff sequence"
    >
      <div className="habitat-motion-rail__viewport">
        <div className="habitat-motion-rail__track">
          <RailItems />
          <RailItems hidden />
        </div>
      </div>
      <button
        className="habitat-motion-rail__control"
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? "RESUME FLOW" : "PAUSE FLOW"}
      </button>
    </section>
  );
}
