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
  | "not_yet";

type Timestamps = { created_at: string };

export type ProfileRow = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
};

export type CommitRow = {
  id: string;
  user_id: string;
  text: string;
  context: string | null;
  media_url: string | null;
  deadline: string;
  status: CommitStatus;
  original_deadline: string;
  parent_commit_id: string | null;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  closed_at: string | null;
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
      commit_status: CommitStatus;
      update_kind: UpdateKind;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};
