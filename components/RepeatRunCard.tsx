"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { extendCommit } from "@/lib/actions/commits";

/**
 * "Run it again": the middle answer at the end of an everyday commitment.
 *
 * An everyday practice ends on purpose: at the end of the week you're asked
 * whether to close it, repeat it, or turn it into something longer. This is
 * the repeat. It pushes the deadline out by the same span and keeps the
 * check-ins already logged, so it stays the same commitment rather than
 * becoming a permanent habit tracker nobody ever chose.
 */
export function RepeatRunCard({
  commitId,
  spanLabel,
}: {
  commitId: string;
  /** "7 days": the span it would run for again. */
  spanLabel: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function again() {
    setBusy(true);
    setError(null);
    const res = await extendCommit(commitId);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/commit/${commitId}`);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={again}
        disabled={busy}
        className="flex w-full items-center gap-4 rounded-3xl border border-border bg-surface p-5 text-left transition hover:border-border-strong active:scale-[0.99] disabled:opacity-60"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Repeat className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-lg font-bold text-ink">
            {busy ? "Setting it up…" : "Run it again"}
          </span>
          <span className="block text-[14px] text-muted">
            {spanLabel ? `Another ${spanLabel}, same days` : "Same days, same span"}
          </span>
        </span>
      </button>
      {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
    </div>
  );
}
