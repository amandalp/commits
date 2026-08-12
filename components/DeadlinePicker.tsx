"use client";

import { useMemo } from "react";

/** Local datetime -> value for <input type="datetime-local">. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function atHour(base: Date, hour: number): Date {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Deadline selection: quick chips + a date and a time control.
 * `value` is a local "YYYY-MM-DDTHH:mm" string; parent converts to ISO.
 */
export function DeadlinePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const chips = useMemo(() => {
    const now = new Date();
    const tonight = atHour(now, 18);
    const tomorrow = atHour(new Date(now.getTime() + 864e5), 18);
    const weekend = (() => {
      const d = new Date(now);
      const day = d.getDay();
      const toSat = (6 - day + 7) % 7 || 7;
      return atHour(new Date(now.getTime() + toSat * 864e5), 12);
    })();
    const nextWeek = atHour(new Date(now.getTime() + 7 * 864e5), 18);
    return [
      { label: "Tonight", d: tonight },
      { label: "Tomorrow", d: tomorrow },
      { label: "This weekend", d: weekend },
      { label: "Next week", d: nextWeek },
    ];
  }, []);

  const date = value.split("T")[0] ?? "";
  const time = value.split("T")[1] ?? "18:00";

  const selectedIso = value ? new Date(value).toISOString() : "";

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {chips.map((c) => {
          const iso = c.d.toISOString();
          const active = selectedIso === iso;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onChange(toLocalInput(c.d))}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-border bg-surface text-ink-soft hover:border-border-strong"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2.5">
        <label className="flex-1">
          <span className="sr-only">Date</span>
          <input
            type="date"
            value={date}
            min={toLocalInput(new Date()).split("T")[0]}
            onChange={(e) => onChange(`${e.target.value}T${time}`)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] font-medium text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="w-[128px]">
          <span className="sr-only">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => onChange(`${date}T${e.target.value}`)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] font-medium text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
    </div>
  );
}

export { toLocalInput };
