import type {
  CommitStatus,
  NotificationType,
  UpdateKind,
} from "@/lib/database.types";

export type { CommitStatus, NotificationType, UpdateKind };

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
