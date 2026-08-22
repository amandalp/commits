/**
 * A commitment drafted before the visitor authenticates. Persisted in
 * localStorage so it survives the OAuth / magic-link redirect (same origin on
 * return) and is published once the visitor lands back in the authed app.
 */
import type { Duration, DurationUnit } from "@/lib/types";

export type PendingDraft = {
  text: string;
  deadline: string; // ISO
  /** Set when the draft was framed as "for 30 days" rather than a date. */
  duration?: Duration | null;
};

const KEY = "commits:pending_draft";

export function savePendingDraft(draft: PendingDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage full or blocked — nothing we can do, drop it */
  }
}

export function readPendingDraft(): PendingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingDraft>;
    if (!parsed || typeof parsed.text !== "string" || typeof parsed.deadline !== "string") {
      return null;
    }
    const d = parsed.duration;
    const duration =
      d &&
      typeof d.amount === "number" &&
      ["days", "weeks", "months", "years"].includes(d.unit as string)
        ? { amount: d.amount, unit: d.unit as DurationUnit }
        : null;
    return { text: parsed.text, deadline: parsed.deadline, duration };
  } catch {
    return null;
  }
}

export function clearPendingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
