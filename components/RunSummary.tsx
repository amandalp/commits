"use client";

import { commitDays, progressOf, scheduleLabel, type Weekday } from "@/lib/schedule";
import { durationLabel } from "@/lib/utils";
import type { CheckIn, Duration } from "@/lib/types";

/**
 * How a tracked run closes out:
 *
 *   Seven days done. How'd it go?
 *   5 of 7 days
 *
 * The truth, without the punishment. Five days out of seven is a real result,
 * so the copy never treats anything short of perfect as a failure. It only
 * reports — the three ways to answer it sit underneath.
 */
export function RunSummary({
  createdAt,
  deadline,
  repeatDays,
  checkIns,
  duration,
}: {
  createdAt: string;
  deadline: string;
  repeatDays: number[];
  checkIns: CheckIn[];
  duration: Duration | null;
}) {
  const byDay: Record<string, "done" | "skipped"> = {};
  for (const c of checkIns) byDay[c.day] = c.status;

  const days = commitDays(createdAt, deadline, repeatDays as Weekday[], byDay);
  const { done, total, over } = progressOf(days);
  const perfect = over && done === total;

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <p className="ink-hand text-[26px] font-bold leading-tight text-ink">
        {perfect
          ? `${total} days. ${done} check-ins. You did it.`
          : over
            ? `${total} days done. How'd it go?`
            : `${done} of ${total} days so far.`}
      </p>
      <p className="mt-2 font-display text-[32px] font-bold text-accent">
        {done} of {total} days
      </p>
      <p className="mt-1 text-[13px] text-muted">
        {scheduleLabel(repeatDays as Weekday[])}
        {duration ? ` · ${durationLabel(duration)}` : ""}
      </p>
    </div>
  );
}
