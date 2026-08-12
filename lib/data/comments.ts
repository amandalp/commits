import { createClient } from "@/lib/supabase/server";
import type { CommentView, Person } from "@/lib/types";

const PERSON = "id, name, username, avatar_url";

function personFrom(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    name: row.name as string,
    username: row.username as string,
    avatar_url: (row.avatar_url as string | null) ?? null,
  };
}

/** Threaded comments (one level of replies) with like counts + viewer state. */
export async function getComments(
  commitId: string,
  viewerId: string | null,
  sort: "newest" | "oldest" = "newest"
): Promise<CommentView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(`*, author:profiles!comments_user_id_fkey(${PERSON})`)
    .eq("commit_id", commitId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r: Record<string, unknown>) => r.id as string);
  const { data: likes } = await supabase
    .from("comment_likes")
    .select("user_id, comment_id")
    .in("comment_id", ids);

  const likeCount = new Map<string, number>();
  const viewerLiked = new Set<string>();
  for (const l of likes ?? []) {
    likeCount.set(l.comment_id, (likeCount.get(l.comment_id) ?? 0) + 1);
    if (viewerId && l.user_id === viewerId) viewerLiked.add(l.comment_id);
  }

  const build = (r: Record<string, unknown>): CommentView => ({
    id: r.id as string,
    text: r.text as string,
    created_at: r.created_at as string,
    parent_comment_id: (r.parent_comment_id as string | null) ?? null,
    author: personFrom(r.author as Record<string, unknown>),
    like_count: likeCount.get(r.id as string) ?? 0,
    viewer_liked: viewerLiked.has(r.id as string),
    replies: [],
  });

  const byId = new Map<string, CommentView>();
  const roots: CommentView[] = [];
  for (const r of rows) {
    const view = build(r as Record<string, unknown>);
    byId.set(view.id, view);
  }
  for (const r of rows) {
    const rec = r as Record<string, unknown>;
    const view = byId.get(rec.id as string)!;
    const parentId = rec.parent_comment_id as string | null;
    if (parentId && byId.has(parentId)) byId.get(parentId)!.replies.push(view);
    else roots.push(view);
  }

  if (sort === "newest") roots.reverse();
  return roots;
}

export async function getCommentCount(commitId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("commit_id", commitId);
  return count ?? 0;
}
