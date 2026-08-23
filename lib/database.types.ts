// Hand-authored to mirror supabase/schema.sql. Kept intentionally compact.
export type CommitStatus = "active" | "shipped" | "overdue" | "closed";
export type UpdateKind = "update" | "ship" | "not_yet";
export type NotificationType =
  | "cheer"
  | "watch"
  | "join"
  | "comment"
  | "comment_reply"
  | "follow"
  | "deadline"
  | "shipped"
  | "update"
  | "not_yet"
  | "loop_in"
  | "mention";

type Timestamps = { created_at: string };

export type ProfileRow = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  x: string | null;
  created_at: string;
};

export type DurationUnit = "hours" | "days" | "weeks" | "months" | "years";
export type CheckInStatus = "done" | "skipped";

export type CommitRow = {
  id: string;
  user_id: string;
  text: string;
  context: string | null;
  media_url: string | null;
  media_urls: string[] | null;
  deadline: string;
  /** Set together when the commit was framed as "for 30 days" rather than a date. */
  duration_amount: number | null;
  duration_unit: DurationUnit | null;
  /** Weekdays this commit repeats on (ISO 1=Mon..7=Sun); null = not tracked. */
  repeat_days: number[] | null;
  status: CommitStatus;
  original_deadline: string;
  parent_commit_id: string | null;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  closed_at: string | null;
};

export type CheckInRow = {
  id: string;
  commit_id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  status: CheckInStatus;
  update_id: string | null;
  created_at: string;
};

export type CommentRow = {
  id: string;
  user_id: string;
  commit_id: string;
  parent_comment_id: string | null;
  text: string;
  created_at: string;
};

export type UpdateRow = {
  id: string;
  commit_id: string;
  user_id: string;
  text: string | null;
  media_url: string | null;
  link_url: string | null;
  kind: UpdateKind;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  commit_id: string | null;
  comment_id: string | null;
  type: NotificationType;
  read: boolean;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Partial<ProfileRow> & Pick<ProfileRow, "id" | "name" | "username">,
        Partial<ProfileRow>
      >;
      commits: Table<
        CommitRow,
        Pick<CommitRow, "user_id" | "text" | "deadline" | "original_deadline"> &
          Partial<CommitRow>
      >;
      follows: Table<{ follower_id: string; following_id: string } & Timestamps>;
      cheers: Table<
        { id: string; user_id: string; commit_id: string } & Timestamps
      >;
      watches: Table<
        { id: string; user_id: string; commit_id: string } & Timestamps
      >;
      loop_ins: Table<
        { id: string; commit_id: string; user_id: string } & Timestamps
      >;
      comments: Table<
        CommentRow,
        Pick<CommentRow, "user_id" | "commit_id" | "text"> & Partial<CommentRow>
      >;
      comment_likes: Table<
        { user_id: string; comment_id: string } & Timestamps
      >;
      updates: Table<
        UpdateRow,
        Pick<UpdateRow, "commit_id" | "user_id"> & Partial<UpdateRow>
      >;
      check_ins: Table<
        CheckInRow,
        Pick<CheckInRow, "commit_id" | "user_id" | "day"> & Partial<CheckInRow>
      >;
      notifications: Table<NotificationRow>;
    };
    Views: Record<string, never>;
    Functions: {
      generate_deadline_notifications: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      check_in_status: CheckInStatus;
      commit_status: CommitStatus;
      duration_unit: DurationUnit;
      update_kind: UpdateKind;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};
