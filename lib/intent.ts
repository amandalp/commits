/**
 * A social action a guest reached for before they had an account. Persisted in
 * localStorage so it survives the OAuth / magic-link round-trip (same origin on
 * return) and is replayed the moment they land back in the app.
 *
 * The rule this encodes: never make someone repeat themselves, and never drop a
 * newly authenticated visitor on an unrelated blank feed. `returnTo` carries
 * them back to the commitment they were looking at.
 *
 * Sibling of `lib/draft.ts`, which does the same for an unpublished commitment.
 */

/** What the guest was trying to do. `who` is only used to word the prompt. */
export type GateIntent =
  | { kind: "cheer"; commitId: string; who?: string }
  | { kind: "watch"; commitId: string; who?: string }
  | { kind: "join"; commitId: string; who?: string }
  | {
      kind: "comment";
      commitId: string;
      text?: string;
      parentCommentId?: string | null;
      who?: string;
    }
  | { kind: "like"; commentId: string; commitId: string }
  | { kind: "follow"; userId: string; who?: string };

export type PendingIntent = GateIntent & { returnTo: string };

const KEY = "commits:pending_intent";

export function savePendingIntent(intent: PendingIntent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* storage full or blocked, nothing we can do, drop it */
  }
}

const KINDS = ["cheer", "watch", "join", "comment", "like", "follow"] as const;

export function readPendingIntent(): PendingIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const kind = p?.kind as PendingIntent["kind"];
    if (!KINDS.includes(kind)) return null;

    const returnTo =
      typeof p.returnTo === "string" && p.returnTo.startsWith("/") ? p.returnTo : "/";

    if (kind === "follow") {
      return typeof p.userId === "string"
        ? { kind, userId: p.userId, returnTo }
        : null;
    }
    if (typeof p.commitId !== "string") return null;
    if (kind === "like") {
      return typeof p.commentId === "string"
        ? { kind, commentId: p.commentId, commitId: p.commitId, returnTo }
        : null;
    }
    if (kind === "comment") {
      return {
        kind,
        commitId: p.commitId,
        text: typeof p.text === "string" ? p.text : undefined,
        parentCommentId:
          typeof p.parentCommentId === "string" ? p.parentCommentId : null,
        returnTo,
      };
    }
    return { kind, commitId: p.commitId, returnTo };
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
