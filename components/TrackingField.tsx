"use client";

import { useState } from "react";
import { CalendarCheck, X } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./ui";
import { useThemeStyle } from "./ThemeStyle";
import { cn } from "@/lib/utils";
import {
  EVERY_DAY,
  WEEKDAYS_ONLY,
  WEEKDAY_INITIALS,
  scheduleLabel,
  type Weekday,
} from "@/lib/schedule";

/**
 * The optional check-in row, revealed once a duration is set:
 *
 *   Looks like this repeats daily. Track your check-ins?
 *   [ Yes, track it ]  [ No thanks ]
 *
 * Once it's on, it collapses to a single quiet line — "Every day · 7 days ·
 * change" — so the creation screen stays a sentence, not a settings panel.
 * Nobody has to pick a category: the offer only appears when the sentence
 * already sounds like it repeats, and it can always be switched on by hand.
 */
export function TrackingField({
  detected,
  value,
  onChange,
  durationLabel,
}: {
  /** What the sentence sounded like, if anything — drives the gentle offer. */
  detected: Weekday[] | null;
  value: Weekday[] | null;
  onChange: (days: Weekday[] | null) => void;
  /** "7 days" — shown next to the schedule so the run reads at a glance. */
  durationLabel: string;
}) {
  const { hand } = useThemeStyle();
  const [sheet, setSheet] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Tracking on: one quiet line with a way back into the picker.
  if (value) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2 animate-rise">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-1 pl-2.5 pr-3 text-[13.5px] font-semibold text-accent">
          <CalendarCheck className="h-3.5 w-3.5" />
          {scheduleLabel(value)} · {durationLabel}
        </span>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="text-[13.5px] font-medium text-muted hover:text-ink"
        >
          change
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Turn off check-ins"
          className="text-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        <DaysSheet
          open={sheet}
          value={value}
          onClose={() => setSheet(false)}
          onChange={onChange}
        />
      </div>
    );
  }

  // The sentence sounds like it repeats — ask once, quietly.
  if (detected && !dismissed) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 animate-rise">
        <p className={cn("text-[14.5px] text-ink-soft", hand && "ink-hand text-[17px]")}>
          Looks like this repeats {scheduleLabel(detected).toLowerCase()}. Track your
          check-ins?
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(detected)}
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13.5px] font-semibold text-cream transition active:scale-[0.98]"
          >
            Yes, track it
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13.5px] font-semibold text-ink-soft transition hover:bg-cream-deep"
          >
            No thanks
          </button>
        </div>
      </div>
    );
  }

  // Otherwise it stays a small, borderless sibling of "add a note".
  return (
    <button
      type="button"
      onClick={() => onChange([...EVERY_DAY])}
      className="mt-4 flex items-center gap-1.5 text-[14px] font-medium text-ink-soft"
    >
      <CalendarCheck className="h-4 w-4" /> track check-ins
    </button>
  );
}

// ---------------------------------------------------------------------------
// Every day · Weekdays · the days you pick
// ---------------------------------------------------------------------------

function DaysSheet({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: Weekday[];
  onClose: () => void;
  onChange: (days: Weekday[]) => void;
}) {
  const isEvery = value.length === 7;
  const isWeekdays = value.length === 5 && value.every((d) => d <= 5);

  function toggle(day: Weekday) {
    const next = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day].sort((a, b) => a - b);
    if (next.length) onChange(next as Weekday[]);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Which days?">
      <div className="flex gap-2">
        <Preset label="Every day" active={isEvery} onClick={() => onChange([...EVERY_DAY])} />
        <Preset
          label="Weekdays"
          active={isWeekdays}
          onClick={() => onChange([...WEEKDAYS_ONLY])}
        />
      </div>

      <div className="mt-5 flex justify-between gap-1.5">
        {WEEKDAY_INITIALS.map((initial, i) => {
          const day = (i + 1) as Weekday;
          const on = value.includes(day);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(day)}
              aria-pressed={on}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-semibold transition",
                on
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong"
              )}
            >
              {initial}
            </button>
          );
        })}
      </div>

      <Button full size="lg" className="mt-7" onClick={onClose}>
        Done
      </Button>
    </Sheet>
  );
}

function Preset({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[14px] font-medium transition",
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-ink-soft hover:border-border-strong"
      )}
    >
      {label}
    </button>
  );
}
