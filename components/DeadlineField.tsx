"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./ui";
import { cn } from "@/lib/utils";
import { useThemeStyle } from "./ThemeStyle";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function atTime(base: Date, hour: number, min = 0): Date {
  const d = new Date(base);
  d.setHours(hour, min, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 864e5);
}

/** Local "YYYY-MM-DDTHH:mm" — the value shape date/time inputs and the parent use. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

/**
 * The intelligent default: tomorrow at 6:00 PM. Deadlines should feel
 * intentional — "tomorrow evening" reads as a choice, where the current
 * clock time (8:34 AM) reads as an accident.
 */
export function defaultDeadline(): string {
  return toLocalInput(atTime(addDays(new Date(), 1), 18));
}

/** Friendly day name for the sentence: Tonight / Tomorrow / Friday / Aug 27. */
function dayLabel(d: Date): string {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((b.getTime() - a.getTime()) / 864e5);
  if (diff <= 0) return d.getHours() >= 17 ? "Tonight" : "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "6:00 PM". */
function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * The "When?" presets. Each carries a canonical time so a single tap lands on
 * an intentional deadline: Tonight → 9 PM, This weekend → Sunday 6 PM, Next
 * week → next Friday 6 PM, everything else → 6 PM.
 */
function presets(): { label: string; date: Date }[] {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday

  const toSunday = (7 - day) % 7 || 7; // the coming Sunday, never today
  const toNextFriday = ((5 - day + 7) % 7) + 7; // Friday of next week

  return [
    { label: "Tonight", date: atTime(now, 21) },
    { label: "Tomorrow", date: atTime(addDays(now, 1), 18) },
    { label: "This weekend", date: atTime(addDays(now, toSunday), 18) },
    { label: "Next week", date: atTime(addDays(now, toNextFriday), 18) },
  ];
}

// ---------------------------------------------------------------------------
// Natural-language parsing — a convenience, never the only way in.
// "launch the landing page by Friday at noon" → deadline of next Friday 12 PM.
// ---------------------------------------------------------------------------

function parseTime(s: string): { hour: number; min: number } | null {
  const t = s.trim();
  if (t === "noon" || t === "midday") return { hour: 12, min: 0 };
  if (t === "midnight") return { hour: 0, min: 0 };
  if (t === "morning") return { hour: 9, min: 0 };
  if (t === "afternoon") return { hour: 15, min: 0 };
  if (t === "evening" || t === "night") return { hour: 19, min: 0 };
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (hour > 23 || min > 59) return null;
  if (m[3] === "pm" && hour < 12) hour += 12;
  if (m[3] === "am" && hour === 12) hour = 0;
  return { hour, min };
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Parse the phrase after "by …". Returns null unless it parses cleanly. */
export function parseNaturalDeadline(phrase: string): Date | null {
  const now = new Date();
  let m = phrase.trim().toLowerCase();
  if (!m) return null;

  // Peel off an optional "at <time>" (or a trailing bare time).
  let time: { hour: number; min: number } | null = null;
  const at = m.match(/\bat\s+(.+)$/);
  if (at) {
    time = parseTime(at[1]);
    if (!time) return null; // an explicit time we couldn't read → don't guess
    m = m.slice(0, at.index).trim();
  }

  let base: Date | null = null;
  let defaultHour = 18;
  if (m === "today") base = new Date(now);
  else if (m === "tonight") {
    base = new Date(now);
    defaultHour = 21;
  } else if (m === "tomorrow") base = addDays(now, 1);
  else if (m === "this weekend" || m === "the weekend" || m === "weekend") {
    base = addDays(now, (7 - now.getDay()) % 7 || 7);
  } else if (m === "next week") {
    base = addDays(now, ((5 - now.getDay() + 7) % 7) + 7);
  } else {
    const isNext = /^next\s+/.test(m);
    const idx = WEEKDAYS.indexOf(m.replace(/^next\s+/, ""));
    if (idx >= 0) {
      let delta = (idx - now.getDay() + 7) % 7 || 7; // upcoming, never today
      if (isNext && delta < 7) delta += 7;
      base = addDays(now, delta);
    }
  }
  if (!base) return null;

  const result = atTime(base, time?.hour ?? defaultHour, time?.min ?? 0);
  // A same-day match that's already passed isn't a usable deadline.
  if ((m === "today" || m === "tonight") && result.getTime() <= now.getTime())
    return null;
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type OpenSheet = null | "when" | "date" | "time";

export function DeadlineField({
  value,
  onChange,
  hidden,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Keep the whole line out of the flow until there's a commitment to date. */
  hidden?: boolean;
}) {
  const { hand } = useThemeStyle();
  const [sheet, setSheet] = useState<OpenSheet>(null);

  if (hidden) return null;

  const d = new Date(value);
  const datePart = value.split("T")[0];
  const timePart = value.split("T")[1] ?? "18:00";

  const presetList = presets();
  const activeLabel = presetList.find(
    (p) => toLocalInput(p.date).split("T")[0] === datePart
  )?.label;

  const link =
    "text-accent underline decoration-2 underline-offset-[5px] transition active:opacity-70";

  return (
    <div className="mt-4 animate-rise">
      <p
        className={cn(
          "font-display text-[22px] font-bold leading-tight text-ink",
          hand && "ink-hand text-[26px]"
        )}
      >
        <span className="font-normal text-muted">by </span>
        <button type="button" onClick={() => setSheet("when")} className={link}>
          {dayLabel(d)}
        </button>
        <span className="font-normal text-muted">, </span>
        <button type="button" onClick={() => setSheet("time")} className={link}>
          {timeLabel(d)}
        </button>
      </p>

      {/* Day: quick presets + a route into the calendar. */}
      <Sheet open={sheet === "when"} onClose={() => setSheet(null)} title="When?">
        <div className="space-y-0.5">
          {presetList.map((p) => {
            const active = activeLabel === p.label;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(toLocalInput(p.date));
                  setSheet(null);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-cream-deep"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-accent" : "border-border-strong"
                  )}
                >
                  {active && (
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[16px]",
                    active ? "font-semibold text-ink" : "text-ink-soft"
                  )}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setSheet("date")}
          className="mt-1.5 flex w-full items-center gap-3 rounded-2xl border-t border-border px-3 pb-1 pt-3 text-left text-[16px] font-medium text-accent"
        >
          Choose another date…
        </button>
      </Sheet>

      {/* Custom calendar — replaces the native date input entirely. */}
      <Sheet
        open={sheet === "date"}
        onClose={() => setSheet(null)}
        title="Pick a date"
      >
        <CalendarPicker
          selected={datePart}
          onSelect={(dateStr) => {
            onChange(`${dateStr}T${timePart}`);
            setSheet(null);
          }}
        />
      </Sheet>

      {/* Custom time picker — replaces the ugly native time spinner. */}
      <Sheet
        open={sheet === "time"}
        onClose={() => setSheet(null)}
        title="What time?"
      >
        <TimePicker
          time={timePart}
          onChange={(t) => onChange(`${datePart}T${t}`)}
          onDone={() => setSheet(null)}
        />
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ymd(y: number, m: number, day: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m + 1)}-${p(day)}`;
}

function CalendarPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (dateStr: string) => void;
}) {
  const now = new Date();
  const todayStr = ymd(now.getFullYear(), now.getMonth(), now.getDate());
  const [y0, m0] = selected.split("-").map(Number);
  const [view, setView] = useState({
    year: y0 || now.getFullYear(),
    month: (m0 ? m0 - 1 : now.getMonth()),
  });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoBack =
    view.year > now.getFullYear() ||
    (view.year === now.getFullYear() && view.month > now.getMonth());

  const step = (delta: number) => {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <div className="pb-1">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => canGoBack && step(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-deep disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-[15px] font-semibold text-ink">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-deep"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-faint">
        {WEEKDAY_INITIALS.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const dateStr = ymd(view.year, view.month, day);
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[15px] transition",
                isSelected
                  ? "bg-accent font-semibold text-white"
                  : isPast
                    ? "text-faint/50"
                    : "text-ink hover:bg-cream-deep",
                isToday && !isSelected && "font-bold text-accent"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time picker — quick chips + a tidy custom stepper. No native controls.
// ---------------------------------------------------------------------------

const TIME_CHIPS: { label: string; hour: number; min: number }[] = [
  { label: "Morning", hour: 9, min: 0 },
  { label: "Noon", hour: 12, min: 0 },
  { label: "Afternoon", hour: 15, min: 0 },
  { label: "Evening", hour: 18, min: 0 },
  { label: "Night", hour: 21, min: 0 },
];

function TimePicker({
  time,
  onChange,
  onDone,
}: {
  time: string; // "HH:MM" (24h)
  onChange: (t: string) => void; // emits "HH:MM" (24h)
  onDone: () => void;
}) {
  const [h24, m] = time.split(":").map(Number);
  const hour = isNaN(h24) ? 18 : h24;
  const minute = isNaN(m) ? 0 : m;

  const emit = (nextHour: number, nextMin: number) => {
    const p = (n: number) => String(n).padStart(2, "0");
    onChange(`${p((nextHour + 24) % 24)}:${p((nextMin + 60) % 60)}`);
  };

  const hour12 = ((hour + 11) % 12) + 1;
  const isPM = hour >= 12;
  const setHour12 = (h12: number) => emit(isPM ? (h12 % 12) + 12 : h12 % 12, minute);
  const setMeridiem = (pm: boolean) =>
    emit(pm ? (hour % 12) + 12 : hour % 12, minute);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TIME_CHIPS.map((c) => {
          const active = hour === c.hour && minute === c.min;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => emit(c.hour, c.min)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[14px] font-medium transition",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong"
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <Stepper
          display={String(hour12)}
          onUp={() => setHour12((hour12 % 12) + 1)}
          onDown={() => setHour12(((hour12 + 10) % 12) + 1)}
          label="Hour"
        />
        <span className="pb-1 text-3xl font-bold text-ink">:</span>
        <Stepper
          display={String(minute).padStart(2, "0")}
          onUp={() => emit(hour, minute + 5)}
          onDown={() => emit(hour, minute - 5)}
          label="Minute"
        />
        <div className="ml-3 flex flex-col gap-1.5">
          {[
            { pm: false, label: "AM" },
            { pm: true, label: "PM" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setMeridiem(o.pm)}
              className={cn(
                "rounded-xl px-4 py-2 text-[15px] font-semibold transition",
                isPM === o.pm
                  ? "bg-accent text-white"
                  : "bg-cream-deep text-ink-soft hover:bg-border"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <Button full size="lg" className="mt-7" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

function Stepper({
  display,
  onUp,
  onDown,
  label,
}: {
  display: string;
  onUp: () => void;
  onDown: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onUp}
        aria-label={`${label} up`}
        className="flex h-8 w-12 items-center justify-center rounded-lg text-ink-soft transition hover:bg-cream-deep"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span className="w-16 py-1 text-center font-display text-[32px] font-bold tabular-nums text-ink">
        {display}
      </span>
      <button
        type="button"
        onClick={onDown}
        aria-label={`${label} down`}
        className="flex h-8 w-12 items-center justify-center rounded-lg text-ink-soft transition hover:bg-cream-deep"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
