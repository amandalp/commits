"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { MediaField } from "./MediaField";
import { Button } from "./ui";
import { Sheet } from "./Sheet";
import { checkIn, clearCheckIn } from "@/lib/actions/checkins";
import {
  commitDays,
  dayKey,
  progressOf,
  scheduleLabel,
  today,
  WEEKDAY_INITIALS,
  type ScheduledDay,
  type Weekday,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { CheckIn } from "@/lib/types";

/**
 * The tracker that lives inside one repeating Commit, and nowhere else. It
 * answers a single question: did this person keep this particular promise?
 *
 *   drink more water
 *   day 2 of 7
 *    M   T   W   T   F   S   S
 *    ✓   ✓   •   ○   ○   ○   ○
 *        [ I did it today ]
 *
 * Short runs get the strip above; anything longer gets a compact month grid.
 * Missed days stay softly blank: never red, never scolding.
 */
export function CheckInTracker({
  commitId,
  createdAt,
  deadline,
  repeatDays,
  checkIns,
  isOwner,
  resolved,
}: {
  commitId: string;
  createdAt: string;
  deadline: string;
  repeatDays: number[];
  checkIns: CheckIn[];
  isOwner: boolean;
  /** Shipped or closed: the tracker becomes a record, not a control. */
  resolved?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimistic so a tap fills instantly, since the strip is a one-tap surface and
  // any server round-trip in the middle of it would feel broken.
  const [logged, addLogged] = useOptimistic(
    checkIns,
    (prev: CheckIn[], next: CheckIn & { cleared?: boolean }) => {
      const rest = prev.filter((c) => c.day !== next.day);
      return next.cleared ? rest : [...rest, { day: next.day, status: next.status }];
    }
  );

  const byDay = useMemo(() => {
    const map: Record<string, "done" | "skipped"> = {};
    for (const c of logged) map[c.day] = c.status;
    return map;
  }, [logged]);

  const days = useMemo(
    () => commitDays(createdAt, deadline, repeatDays as Weekday[], byDay),
    [createdAt, deadline, repeatDays, byDay]
  );
  const progress = progressOf(days);
  const todayKey = today();
  const todayEntry = days.find((d) => d.key === todayKey && d.scheduled);
  const todayStatus = byDay[todayKey];

  function log(day: string, status: "done" | "skipped") {
    setError(null);
    startTransition(async () => {
      addLogged({ day, status });
      const res = await checkIn(commitId, day, status);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  function clear(day: string) {
    setError(null);
    startTransition(async () => {
      addLogged({ day, status: "done", cleared: true });
      const res = await clearCheckIn(commitId, day);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  /** Tapping a square: fill an empty day, clear a filled one. */
  function onDayTap(d: ScheduledDay) {
    if (!isOwner || resolved || !d.scheduled) return;
    if (d.key > todayKey) return; // never let someone check in ahead of time
    if (byDay[d.key]) clear(d.key);
    else log(d.key, "done");
  }

  const scheduled = days.filter((d) => d.scheduled);
  const asGrid = scheduled.length > 14;

  return (
    <div className="rounded-3xl border border-border bg-surface px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="ink-hand text-[19px] font-bold text-ink">
            {progress.over
              ? `${progress.done} of ${progress.total} days`
              : `day ${Math.max(1, progress.elapsed)} of ${progress.total}`}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {scheduleLabel(repeatDays as Weekday[])} · {progress.done}/
            {progress.elapsed} check-ins
          </p>
        </div>
      </div>

      <div className="mt-4">
        {asGrid ? (
          <MonthGrid days={days} onTap={onDayTap} interactive={isOwner && !resolved} />
        ) : (
          <Strip days={days} onTap={onDayTap} interactive={isOwner && !resolved} />
        )}
      </div>

      {isOwner && !resolved && todayEntry && (
        <div className="mt-4">
          {todayStatus === "done" ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-success-strong">
                <Check className="h-4 w-4" strokeWidth={3} /> checked in today
              </span>
              <button
                type="button"
                onClick={() => setNoteFor(todayKey)}
                className="inline-flex items-center gap-1 text-[14px] font-medium text-muted hover:text-ink"
              >
                <Plus className="h-4 w-4" /> add a note
              </button>
              <button
                type="button"
                onClick={() => clear(todayKey)}
                className="ml-auto text-[13px] text-faint hover:text-muted"
              >
                undo
              </button>
            </div>
          ) : todayStatus === "skipped" ? (
            <div className="flex items-center gap-3">
              <span className="text-[15px] text-muted">not today. noted.</span>
              <button
                type="button"
                onClick={() => log(todayKey, "done")}
                className="text-[14px] font-medium text-accent"
              >
                actually, I did it
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <Button className="px-7" onClick={() => log(todayKey, "done")} loading={pending}>
                I did it today
              </Button>
              <button
                type="button"
                onClick={() => log(todayKey, "skipped")}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border-strong bg-surface px-6 text-[15px] font-semibold text-ink transition-all hover:bg-cream-deep active:scale-[0.98]"
              >
                not today
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}

      <NoteSheet
        open={noteFor !== null}
        commitId={commitId}
        day={noteFor}
        onClose={() => setNoteFor(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The seven-day strip
// ---------------------------------------------------------------------------

function Strip({
  days,
  onTap,
  interactive,
}: {
  days: ScheduledDay[];
  onTap: (d: ScheduledDay) => void;
  interactive: boolean;
}) {
  // Seven to a row, in the order they'll be lived: a week of the commitment
  // reads as one line, and a fortnight as two tidy ones.
  return (
    <div className="grid grid-cols-7 gap-x-1 gap-y-3">
      {days.map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1.5">
          <span className="text-[12px] font-medium text-faint">
            {WEEKDAY_INITIALS[d.weekday - 1]}
          </span>
          <DayMark day={d} onTap={onTap} interactive={interactive} size="lg" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The compact month grid, for runs longer than a fortnight
// ---------------------------------------------------------------------------

function MonthGrid({
  days,
  onTap,
  interactive,
}: {
  days: ScheduledDay[];
  onTap: (d: ScheduledDay) => void;
  interactive: boolean;
}) {
  // Group by calendar month, then pad each month to start on its weekday.
  const months = useMemo(() => {
    const out: { label: string; cells: (ScheduledDay | null)[] }[] = [];
    let current: { label: string; cells: (ScheduledDay | null)[] } | null = null;
    let currentKey = "";

    for (const d of days) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      if (key !== currentKey) {
        currentKey = key;
        current = {
          label: d.date.toLocaleDateString("en-US", { month: "long" }),
          cells: Array(d.weekday - 1).fill(null),
        };
        out.push(current);
      }
      current!.cells.push(d);
    }
    return out;
  }, [days]);

  return (
    <div className="space-y-4">
      {months.map((m) => (
        <div key={m.label}>
          <p className="mb-2 text-[13px] font-semibold text-ink-soft">{m.label}</p>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-faint">
            {WEEKDAY_INITIALS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {m.cells.map((d, i) =>
              d ? (
                <div key={d.key} className="flex justify-center">
                  <DayMark day={d} onTap={onTap} interactive={interactive} size="sm" />
                </div>
              ) : (
                <span key={`pad${i}`} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One day: ✓ done · • today · ○ upcoming · – not scheduled · blank missed
// ---------------------------------------------------------------------------

function DayMark({
  day,
  onTap,
  interactive,
  size,
}: {
  day: ScheduledDay;
  onTap: (d: ScheduledDay) => void;
  interactive: boolean;
  size: "sm" | "lg";
}) {
  const box = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const tappable = interactive && day.scheduled && day.key <= dayKey(new Date());

  const label = `${day.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}: ${day.state}`;

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={() => onTap(day)}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-full border text-[13px] font-semibold transition",
        box,
        day.state === "done" && "border-success bg-success text-white",
        day.state === "skipped" && "border-border-strong bg-cream-deep text-muted",
        day.state === "today" && "border-accent border-2 text-accent",
        day.state === "upcoming" && "border-border text-faint",
        day.state === "missed" && "border-border border-dashed text-faint/70",
        day.state === "off" && "border-transparent text-faint/50",
        tappable && "hover:border-accent active:scale-95"
      )}
    >
      {day.state === "done" ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : day.state === "skipped" ? (
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      ) : day.state === "today" ? (
        "•"
      ) : day.state === "off" ? (
        "–"
      ) : size === "sm" ? (
        // The month grid keeps its dates so a long run stays navigable; the
        // strip is just rings, the way the sketch reads.
        day.date.getDate()
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// The optional note. Checking in stays one tap; this is the extra step for
// people who want to say something about the day.
// ---------------------------------------------------------------------------

function NoteSheet({
  open,
  commitId,
  day,
  onClose,
}: {
  open: boolean;
  commitId: string;
  day: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!day) return;
    if (!text.trim() && !media) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    const res = await checkIn(commitId, day, "done", { text, mediaUrl: media });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setText("");
    setMedia(null);
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Want to share anything?">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        placeholder="Day 2. This water bottle is actually working."
        rows={3}
        className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-accent"
      />
      <div className="mt-3">
        <MediaField
          folder="updates"
          mediaUrl={media}
          linkUrl={null}
          onMedia={setMedia}
          onLink={() => {}}
        />
      </div>
      {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}
      <Button full size="lg" className="mt-4" onClick={submit} loading={busy}>
        Post it
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full text-center text-[14px] font-medium text-muted"
      >
        skip
      </button>
    </Sheet>
  );
}
