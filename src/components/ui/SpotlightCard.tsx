"use client";

import {
  useCallback,
  useRef,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  "aria-hidden"?: boolean;
};

/**
 * Card surface whose warm radial highlight follows the pointer.
 *
 * The position is written to two CSS variables on the node itself; the glow is
 * a pseudo-element. No React state, no re-render, no per-card listener stack.
 */
export function SpotlightCard({
  children,
  className,
  as: Tag = "div",
  "aria-hidden": ariaHidden,
}: SpotlightCardProps) {
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    },
    [],
  );

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      aria-hidden={ariaHidden}
      className={cn("spotlight-card", className)}
    >
      {children}
    </Tag>
  );
}
