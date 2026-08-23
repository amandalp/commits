"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { commitDays, progressOf, scheduleLabel, type Weekday } from "@/lib/schedule";
import { extendCommit } from "@/lib/actions/commits";
import { durationLabel } from "@/lib/utils";
import type { CheckIn, Duration } from "@/lib/types";

/**
 * How a tracked run closes out:
 *
 *   Seven days done. How'd it go?
 *   5 of 7 days
 *
 * The truth, without the punishment. Five days out of seven is a real result,
 * so the copy never treats anything short of perfect as a failure — and
 * "keep going" is offered right next to "I'm happy with that".
 */
export function RunSummary({
  commitId,
  createdAt,
  deadline,
  repeatDays,
  checkIns,
  duration,
}: {
  commitId: string;
  createdAt: string;
  deadline: string;
  repeatDays: number[];
  checkIns: CheckIn[];
  duration: Duration | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byDay: Record<string, "done" | "skipped"> = {};
  for (const c of checkIns) byDay[c.day] = c.status;

  const days = commitDays(createdAt, deadline, repeatDays as Weekday[], byDay);
  const { done, total, over } = progressOf(days);
  const perfect = over && done === total;

  async function keepGoing() {
    setBusy(true);
    setError(null);
    const res = await extendCommit(commitId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/commit/${commitId}`);
    router.refresh();
  }

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

      <button
        type="button"
        onClick={keepGoing}
        disabled={busy}
        className="mt-4 text-[14.5px] font-semibold text-accent disabled:opacity-60"
      >
        {busy ? "Extending…" : "Keep going →"}
      </button>
      {duration && (
        <span className="ml-2 text-[13px] text-muted">
          another {durationLabel(duration)}
        </span>
      )}

      {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}
    </div>
  );
}
