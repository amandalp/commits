"use client";

import { useState } from "react";
import { cn, compact } from "@/lib/utils";
import { toggleCheer } from "@/lib/actions/social";

/** Tappable 🎉 + count on the commit detail page. Toggles the viewer's cheer. */
export function CheerCount({
  commitId,
  initialCheered,
  initialCount,
}: {
  commitId: string;
  initialCheered: boolean;
  initialCount: number;
}) {
  const [cheered, setCheered] = useState(initialCheered);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);

  function onClick() {
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
      className="flex items-center gap-1.5 transition active:scale-[0.96]"
    >
      <span className={cn("text-base leading-none", burst && "animate-pop")}>🎉</span>
      <span className={cn("font-semibold", cheered ? "text-accent-strong" : "text-ink")}>
        {compact(count)}
      </span>
    </button>
  );
}
