"use client";

import { useState } from "react";
import { cn, compact } from "@/lib/utils";
import { toggleCheer } from "@/lib/actions/social";
import { useAuthGate } from "./AuthGate";

/** Standalone cheer button with optimistic count, used on shipped posts. */
export function CheerInline({
  commitId,
  initialCheered,
  initialCount,
  authorName,
}: {
  commitId: string;
  initialCheered: boolean;
  initialCount: number;
  /** Only used to word the sign-in prompt a guest sees. */
  authorName?: string;
}) {
  const gate = useAuthGate();
  const [cheered, setCheered] = useState(initialCheered);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);

  function onClick() {
    if (!gate.require({ kind: "cheer", commitId, who: authorName })) return;
    const next = !cheered;
    setCheered(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 340);
    }
    toggleCheer(commitId).then((r) => {
      if (!r.ok) {
        setCheered(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={cheered}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-all active:scale-[0.96]",
        cheered
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-border bg-surface text-ink-soft hover:border-border-strong"
      )}
    >
      <span className={cn("text-base leading-none", burst && "animate-pop")}>🙌</span>
      {count > 0 ? compact(count) : "Cheer"}
    </button>
  );
}
