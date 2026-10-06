"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type MotionScopeProps = {
  children: ReactNode;
  className: string;
  id?: string;
  mode: "landing" | "product";
};

export function MotionScope({ children, className, id, mode }: MotionScopeProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setReady(true));
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <main
      className={`${className} motion-scope motion-scope--${mode}`}
      data-motion-ready={ready}
      id={id}
    >
      {children}
    </main>
  );
}
