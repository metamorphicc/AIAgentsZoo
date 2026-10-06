"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function ProductMain({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
    <main className={`product-main motion-sequence${ready ? " is-ready" : ""}`} id="product-main">
      {children}
    </main>
  );
}
