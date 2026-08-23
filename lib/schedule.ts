import type { Duration } from "@/lib/types";

/**
 * Repeating commits — "drink more water every day for the next 7 days".
 *
 * A schedule is just the weekdays a commit repeats on (ISO 1=Mon..7=Sun).
 * Everything here works in local time and speaks in "YYYY-MM-DD" day keys, so
 * a check-in means the day the person actually lived, not a UTC instant.
 */

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const EVERY_DAY: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
export const WEEKDAYS_ONLY: Weekday[] = [1, 2, 3, 4, 5];

/** Mon-first initials, matching the strip and the month grid. */
export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Local "YYYY-MM-DD" for a date — the key a check-in is stored under. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Parse a "YYYY-MM-DD" key back into a local midnight Date. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** ISO weekday (1=Mon..7=Sun) — JS's 0=Sun needs the shift. */
export function isoWeekday(d: Date): Weekday {
  return (((d.getDay() + 6) % 7) + 1) as Weekday;
}

export function today(): string {
  return dayKey(new Date());
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** "Every day" / "Weekdays" / "Mon, Wed, Fri" — how a schedule reads. */
export function scheduleLabel(days: Weekday[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return "Every day";
  if (sorted.length === 5 && sorted.every((d) => d <= 5)) return "Weekdays";
  if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7) return "Weekends";
  return sorted.map((d) => WEEKDAY_NAMES[d - 1].slice(0, 3)).join(", ");
}

// ---------------------------------------------------------------------------
// Detection — infer a repeat from the sentence, never make people categorise.
// ---------------------------------------------------------------------------

const DAY_WORDS: Record<string, Weekday> = {
  monday: 1,
  mondays: 1,
  tuesday: 2,
  tuesdays: 2,
  wednesday: 3,
  wednesdays: 3,
  thursday: 4,
  thursdays: 4,
  friday: 5,
  fridays: 5,
  saturday: 6,
  saturdays: 6,
  sunday: 7,
  sundays: 7,
};

/**
 * Read a repeat out of what someone typed. Returns the weekdays it lands on,
 * or null when the sentence reads like a one-time outcome. Deliberately
 * conservative — a wrong guess costs more than a missed one, because the
 * offer to track is always available by hand.
 */
export function detectRepeat(text: string): Weekday[] | null {
  const t = ` ${text.toLowerCase().replace(/[.,!]/g, " ")} `;

  // Named days: "every monday and wednesday", "on tuesdays"
  const named = Object.entries(DAY_WORDS)
    .filter(([word]) => new RegExp(`\\b(every|each|on)\\s+(\\w+\\s+and\\s+)?${word}\\b|\\b${word}s\\b`).test(t))
    .map(([, day]) => day);
  if (named.length) return [...new Set(named)].sort((a, b) => a - b) as Weekday[];

  if (/\b(every|each)\s+(week\s?day|business\s+day)s?\b/.test(t)) return [...WEEKDAYS_ONLY];
  if (/\b(week\s?days)\b/.test(t)) return [...WEEKDAYS_ONLY];
  if (/\b(every|each)\s+(single\s+)?day\b/.test(t)) return [...EVERY_DAY];
  if (/\bdaily\b/.test(t)) return [...EVERY_DAY];
  if (/\b(every|each)\s+(morning|evening|night|afternoon)\b/.test(t)) return [...EVERY_DAY];
  if (/\b(every|each)\s+(am|pm)\b/.test(t)) return [...EVERY_DAY];

  return null;
}

/** Whether a duration is long enough to be worth tracking day by day. */
export function trackable(duration: Duration | null | undefined): boolean {
  if (!duration) return false;
  if (duration.unit === "hours") return false;
  return true;
}

// ---------------------------------------------------------------------------
// The days a commit covers
// ---------------------------------------------------------------------------

export type DayState = "done" | "skipped" | "today" | "upcoming" | "missed" | "off";

export type ScheduledDay = {
  key: string; // YYYY-MM-DD
  date: Date;
  weekday: Weekday;
  scheduled: boolean;
  state: DayState;
};

/**
 * Every calendar day from the commit's start through its deadline, tagged with
 * where it stands. Missed days come back as "missed" so the UI can leave them
 * softly blank rather than shouting about them.
 */
export function commitDays(
  startIso: string,
  deadlineIso: string,
  repeatDays: Weekday[],
  checkIns: Record<string, "done" | "skipped">,
  now = new Date()
): ScheduledDay[] {
  const start = new Date(startIso);
  const end = new Date(deadlineIso);
  const todayKey = dayKey(now);

  const days: ScheduledDay[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  // The deadline lands a full span after the start — "for 7 days" made today
  // is due a week from today — so the deadline's own date is the day *after*
  // the run. Counting it would turn every 7-day commitment into 8 days.
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
  if (last < cursor) last.setTime(cursor.getTime());

  // A guard rail rather than a real limit — a year of days is already more
  // than any grid should render.
  for (let i = 0; cursor <= last && i < 400; i++) {
    const key = dayKey(cursor);
    const weekday = isoWeekday(cursor);
    const scheduled = repeatDays.includes(weekday);
    const logged = checkIns[key];

    let state: DayState;
    if (!scheduled) state = "off";
    else if (logged) state = logged;
    else if (key === todayKey) state = "today";
    else if (key < todayKey) state = "missed";
    else state = "upcoming";

    days.push({ key, date: new Date(cursor), weekday, scheduled, state });
    cursor = addDays(cursor, 1);
  }
  return days;
}

export type Progress = {
  /** Scheduled days that have come around so far, today included. */
  elapsed: number;
  /** Scheduled days in the whole run. */
  total: number;
  done: number;
  skipped: number;
  missed: number;
  /** True once the last scheduled day has passed. */
  over: boolean;
};

export function progressOf(days: ScheduledDay[]): Progress {
  const scheduled = days.filter((d) => d.scheduled);
  const done = scheduled.filter((d) => d.state === "done").length;
  const skipped = scheduled.filter((d) => d.state === "skipped").length;
  const missed = scheduled.filter((d) => d.state === "missed").length;
  const elapsed = scheduled.filter((d) => d.state !== "upcoming").length;
  return {
    elapsed,
    total: scheduled.length,
    done,
    skipped,
    missed,
    over: scheduled.length > 0 && elapsed === scheduled.length,
  };
}
