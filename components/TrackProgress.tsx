"use client";

import { commitDays, progressOf, type Weekday } from "@/lib/schedule";
import { cn } from "@/lib/utils";

/**
 * The one-line summary of a repeating commit, for lists and profiles:
 *
 *   Day 2 of 7 · 2/2 check-ins
 *
 * Deliberately not a streak and not a score, just where this one promise
 * stands. It runs on the client so "today" means the reader's today.
 */
export function TrackProgress({
  createdAt,
  deadline,
  repeatDays,
  doneCount,
  className,
}: {
  createdAt: string;
  deadline: string;
  repeatDays: number[];
  /** Days already checked off, counted server-side. */
  doneCount: number;
  className?: string;
}) {
  const days = commitDays(createdAt, deadline, repeatDays as Weekday[], {});
  const { elapsed, total, over } = progressOf(days);

  return (
    <span className={cn("text-[13px] text-muted", className)}>
      {over ? `${total} days done` : `Day ${Math.max(1, elapsed)} of ${total}`} ·{" "}
      {doneCount}/{Math.max(elapsed, doneCount)} check-ins
    </span>
  );
}
