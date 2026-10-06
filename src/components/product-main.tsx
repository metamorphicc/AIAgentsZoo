import type { ReactNode } from "react";
import { MotionScope } from "@/components/motion-scope";

export function ProductMain({ children }: { children: ReactNode }) {
  return (
    <MotionScope className="product-main" id="product-main" mode="product">
      {children}
    </MotionScope>
  );
}
