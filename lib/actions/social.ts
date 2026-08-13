"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";
import type { Person, PersonWithFollow } from "@/lib/types";

/**
 * People connected to `userId` by follows, most recent first, annotated with
 * whether the viewer follows each one. `direction` picks which side of the
 * relationship to list: "followers" = people who follow `userId`, "following"
 * = people `userId` follows.
 */
export async function getFollowList(
  userId: string,
  direction: "followers" | "following"
): Promise<PersonWithFollow[]> {
  const { supabase, userId: viewerId } = await requireUser();

  const selectCol = direction === "followers" ? "follower_id" : "following_id";
  const matchCol = direction === "followers" ? "following_id" : "follower_id";

  const { data: rows } = await supabase
    .from("follows")
    .select(`${selectCol}, created_at`)
    .eq(matchCol, userId)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => (r as Record<string, string>)[selectCol]);
  if (!ids.length) return [];

  const [{ data: profs }, { data: viewerFollows }] = await Promise.all([
    supabase.from("profiles").select("id, name, username, avatar_url, bio").in("id", ids),
    supabase.from("follows").select("following_id").eq("follower_id", viewerId).in("following_id", ids),
  ]);

  const followedByViewer = new Set(
    (viewerFollows ?? []).map((r) => (r as { following_id: string }).following_id)
  );
  const byId = new Map(
    (profs ?? []).map((p) => [(p as { id: string }).id, p as Record<string, unknown>])
  );

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Record<string, unknown> => Boolean(p))
    .map((p) => {
      const id = p.id as string;
      return {
        id,
        name: (p.name as string) ?? "Someone",
        username: (p.username as string) ?? "user",
        avatar_url: (p.avatar_url as string | null) ?? null,
        bio: (p.bio as string | null) ?? null,
        is_following: followedByViewer.has(id),
        is_self: id === viewerId,
      };
    });
}

/** Everyone who cheered a commit, most recent first. */
export async function getCheerers(commitId: string): Promise<Person[]> {
  const { supabase } = await requireUser();
  const { data: rows } = await supabase
    .from("cheers")
    .select("user_id, created_at")
    .eq("commit_id", commitId)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => r.user_id as string);
  if (!ids.length) return [];

  const { data: profs } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url")
    .in("id", ids);

  const byId = new Map(
    (profs ?? []).map((p) => [(p as { id: string }).id, p as Record<string, unknown>])
  );
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is Record<string, unknown> => Boolean(p))
    .map((p) => ({
      id: p.id as string,
      name: (p.name as string) ?? "Someone",
      username: (p.username as string) ?? "user",
      avatar_url: (p.avatar_url as string | null) ?? null,
    }));
}

export async function toggleCheer(
  commitId: string
): Promise<ActionResult<{ cheered: boolean }>> {
  const { supabase, userId } = await requireUser();
  const { data: existing } = await supabase
    .from("cheers")
    .select("id")
    .eq("user_id", userId)
    .eq("commit_id", commitId)
    .maybeSingle();

  if (existing) {
    await supabase.from("cheers").delete().eq("id", existing.id);
    return { ok: true, data: { cheered: false } };
  }
  const { error } = await supabase
    .from("cheers")
    .insert({ user_id: userId, commit_id: commitId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { cheered: true } };
}

export async function toggleWatch(
  commitId: string
): Promise<ActionResult<{ watching: boolean }>> {
  const { supabase, userId } = await requireUser();
  const { data: existing } = await supabase
    .from("watches")
    .select("id")
    .eq("user_id", userId)
    .eq("commit_id", commitId)
    .maybeSingle();

  if (existing) {
    await supabase.from("watches").delete().eq("id", existing.id);
    return { ok: true, data: { watching: false } };
  }
  const { error } = await supabase
    .from("watches")
    .insert({ user_id: userId, commit_id: commitId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { watching: true } };
}

export async function toggleFollow(
  targetId: string
): Promise<ActionResult<{ following: boolean }>> {
  const { supabase, userId } = await requireUser();
  if (targetId === userId)
    return { ok: false, error: "You can't follow yourself." };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
    return { ok: true, data: { following: false } };
  }
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: userId, following_id: targetId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { following: true } };
}

export async function addComment(
  commitId: string,
  text: string,
  parentCommentId?: string | null
): Promise<ActionResult<{ id: string }>> {
  const { supabase, userId } = await requireUser();
  const clean = text.trim();
  if (!clean) return { ok: false, error: "Write something first." };
  if (clean.length > 1000) return { ok: false, error: "That comment is too long." };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      commit_id: commitId,
      user_id: userId,
      text: clean,
      parent_comment_id: parentCommentId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed." };

  revalidatePath(`/commit/${commitId}`);
  return { ok: true, data: { id: data.id } };
}

export async function toggleCommentLike(
  commentId: string,
  commitId: string
): Promise<ActionResult<{ liked: boolean }>> {
  const { supabase, userId } = await requireUser();
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", userId)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("user_id", userId)
      .eq("comment_id", commentId);
    return { ok: true, data: { liked: false } };
  }
  const { error } = await supabase
    .from("comment_likes")
    .insert({ user_id: userId, comment_id: commentId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/commit/${commitId}`);
  return { ok: true, data: { liked: true } };
}
