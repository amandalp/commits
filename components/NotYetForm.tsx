"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Archive } from "lucide-react";
import { DeadlinePicker, toLocalInput } from "./DeadlinePicker";
import { CommitStructure } from "./CommitStructure";
import { Button } from "./ui";
import { notYet } from "@/lib/actions/commits";
import { deadlineLabel } from "@/lib/utils";

export function NotYetForm({
  commitId,
  text,
  originalDeadline,
}: {
  commitId: string;
  text: string;
  originalDeadline: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"choose" | "reschedule" | "close">("choose");
  const [when, setWhen] = useState(() =>
    toLocalInput(new Date(Date.now() + 3 * 864e5))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(payload: { newDeadline?: string; close?: boolean }) {
    setPending(true);
    setError(null);
    const res = await notYet(commitId, { text: note, ...payload });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    router.push(`/commit/${commitId}`);
    router.refresh();
  }

  return (
    <div className="px-5 pb-10 pt-2">
      <h1 className="ink-hand font-display text-[28px] font-bold text-ink">What happened?</h1>
      <p className="mt-1.5 text-[15px] text-muted">
        No shame in more time. Put an honest note on the record.
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <CommitStructure text={text} deadline={originalDeadline} size="sm" tone="closed" />
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        placeholder="Life got busy — but I'm not giving up."
        rows={3}
        className="mt-4 w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-accent"
      />

      {mode === "choose" && (
        <div className="mt-5 space-y-3">
          <button
            onClick={() => setMode("reschedule")}
            className="flex w-full items-center gap-4 rounded-3xl border border-border bg-surface p-4 text-left transition hover:border-border-strong"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <CalendarClock className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">I need more time</span>
              <span className="block text-[13px] text-muted">
                Keep going — your history stays visible.
              </span>
            </span>
          </button>
          <button
            onClick={() => setMode("close")}
            className="flex w-full items-center gap-4 rounded-3xl border border-border bg-surface p-4 text-left transition hover:border-border-strong"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-deep text-ink-soft">
              <Archive className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-bold text-ink">I’m letting this one go</span>
              <span className="block text-[13px] text-muted">
                Put it to rest for now.
              </span>
            </span>
          </button>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="mt-5 animate-rise">
          <div className="mb-3 rounded-xl bg-cream-deep px-3.5 py-2.5 text-[13px] text-ink-soft">
            Original deadline{" "}
            <span className="font-semibold">{deadlineLabel(originalDeadline)}</span>{" "}
            stays on the record.
          </div>
          <label className="mb-2 block text-[14px] font-medium text-muted">
            New deadline
          </label>
          <DeadlinePicker value={when} onChange={setWhen} />
          {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setMode("choose")}>
              Back
            </Button>
            <Button
              full
              onClick={() => run({ newDeadline: new Date(when).toISOString() })}
              loading={pending}
            >
              keep going
            </Button>
          </div>
        </div>
      )}

      {mode === "close" && (
        <div className="mt-5 animate-rise">
          <p className="text-[15px] text-ink-soft">
            This closes the commit. It stays on your profile with its full history —
            nothing is erased.
          </p>
          {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setMode("choose")}>
              Back
            </Button>
            <Button full variant="secondary" onClick={() => run({ close: true })} loading={pending}>
              let it go
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
