import type {
  CheckInStatus,
  CommitStatus,
  DurationUnit,
  NotificationType,
  UpdateKind,
} from "@/lib/database.types";

export type { CheckInStatus, CommitStatus, DurationUnit, NotificationType, UpdateKind };

/** One day's check-in on a repeating commit, keyed by local "YYYY-MM-DD". */
export type CheckIn = {
  day: string;
  status: CheckInStatus;
};

/** A commitment framed as a stretch of time — "for 30 days" — instead of a date. */
export type Duration = { amount: number; unit: DurationUnit };

/** A user as shown throughout the UI (avatar, name, @username). */
export type Person = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

/** A person in a followers/following list, with the viewer's relationship to them. */
export type PersonWithFollow = Person & {
  bio: string | null;
  is_following: boolean;
  is_self: boolean;
};

export type ProfileFull = Person & {
  bio: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  x: string | null;
  created_at: string;
  followers: number;
  following: number;
  commits: number;
  shipped: number;
  cheers_received: number;
  is_following: boolean;
  is_self: boolean;
};

/** Enriched commit used by feed cards and detail pages. */
export type CommitView = {
  id: string;
  text: string;
  context: string | null;
  media_url: string | null;
  media_urls: string[];
  deadline: string;
  original_deadline: string;
  /** Set when the commit reads "for 30 days"; the deadline is its end. */
  duration: Duration | null;
  /** Weekdays a repeating commit is tracked on (ISO 1=Mon..7=Sun); null = untracked. */
  repeat_days: number[] | null;
  /** Check-ins logged so far — only loaded where the tracker is shown. */
  check_ins?: CheckIn[];
  /** Days checked off, for the compact progress line on lists. */
  check_in_count: number;
  status: CommitStatus;
  created_at: string;
  shipped_at: string | null;
  closed_at: string | null;
  parent_commit_id: string | null;
  author: Person;
  // parent (the commit this one joined), if any
  parent?: { id: string; text: string; author: Person } | null;
  // social
  cheer_count: number;
  comment_count: number;
  watch_count: number;
  join_count: number;
  viewer_cheered: boolean;
  viewer_watching: boolean;
  viewer_joined: boolean;
  is_owner: boolean;
  // small avatar stack for social proof
  cheerers: Person[];
  joiners: Person[];
  watchers: Person[];
  // people the author put "in the loop" on this commit
  looped_in: Person[];
  // the ship update (kind='ship') when status = shipped
  ship?: UpdateView | null;
};

export type UpdateView = {
  id: string;
  text: string | null;
  media_url: string | null;
  link_url: string | null;
  kind: UpdateKind;
  created_at: string;
  author: Person;
};

export type CommentView = {
  id: string;
  text: string;
  created_at: string;
  parent_comment_id: string | null;
  author: Person;
  like_count: number;
  viewer_liked: boolean;
  replies: CommentView[];
};

export type NotificationView = {
  id: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  actor: Person | null;
  actors: Person[]; // grouped actors for aggregated rows
  extra_count: number; // "and N others"
  commit_id: string | null;
  commit_text: string | null;
  comment_text: string | null;
};

/** Derived: an active commit whose deadline has passed and needs a decision. */
export function needsResolution(c: {
  status: CommitStatus;
  deadline: string;
}): boolean {
  return (
    (c.status === "active" || c.status === "overdue") &&
    new Date(c.deadline).getTime() < Date.now()
  );
}

// ---------------------------------------------------------------------------
// The two commitment types
// ---------------------------------------------------------------------------

/**
 * Commits come in two genuinely different shapes, and nobody should ever have
 * to answer "is this a goal, habit, project, milestone or task?". The type is
 * inferred from how the commitment was created:
 *
 *   one deadline      → big move   ("Apply to YC by October 14")
 *   repeating cadence → everyday   ("Wear sunscreen every morning this week")
 *
 * A big move has an outcome and a date, and carries updates and watchers. An
 * everyday commitment is a lightweight practice with a timeframe and tiny
 * check-ins — never a permanent habit tracker.
 */
export type CommitKind = "big-move" | "everyday";

export function commitKind(c: { repeat_days: number[] | null }): CommitKind {
  return c.repeat_days?.length ? "everyday" : "big-move";
}

/**
 * Open vs Done — the only two statuses the interface names. "Done" holds both
 * successful commitments and honest endings; the difference is a quiet
 * grouping inside it, not a separate tab.
 */
export function isDone(status: CommitStatus): boolean {
  return status === "shipped" || status === "closed";
}

/** Split an Open list into its two passive sections, order preserved. */
export function byKind<T extends { repeat_days: number[] | null }>(
  commits: T[]
): { bigMoves: T[]; everyday: T[] } {
  return {
    bigMoves: commits.filter((c) => commitKind(c) === "big-move"),
    everyday: commits.filter((c) => commitKind(c) === "everyday"),
  };
}

/** Split a Done list into shipped and closed, order preserved. */
export function byEnding<T extends { status: CommitStatus }>(
  commits: T[]
): { shipped: T[]; closed: T[] } {
  return {
    shipped: commits.filter((c) => c.status === "shipped"),
    closed: commits.filter((c) => c.status === "closed"),
  };
}
