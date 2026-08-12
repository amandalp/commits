"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";
import type { Person } from "@/lib/types";

const PERSON = "id, name, username, avatar_url";

function personFrom(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "Someone",
    username: (row.username as string) ?? "user",
    avatar_url: (row.avatar_url as string | null) ?? null,
  };
}

/** Escape LIKE wildcards so a literal "%" or "_" in a query stays literal. */
function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Search people by name or @username for the "put someone in the loop" picker.
 * Excludes the viewer themselves. Profiles are world-readable.
 */
export async function searchPeople(query: string): Promise<Person[]> {
  const { supabase, userId } = await requireUser();
  const q = query.trim();
  if (!q) return [];

  const like = `%${escapeLike(q)}%`;
  const { data } = await supabase
    .from("profiles")
    .select(PERSON)
    .or(`name.ilike.${like},username.ilike.${like}`)
    .neq("id", userId)
    .limit(20);

  return (data ?? []).map((p) => personFrom(p as Record<string, unknown>));
}

/**
 * The "Recent" list shown before the user types: people they follow, newest
 * first. Falls back to nothing rather than surfacing strangers.
 */
export async function getSuggestedPeople(): Promise<Person[]> {
  const { supabase, userId } = await requireUser();
  const { data: rows } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  const ids = (rows ?? []).map((r) => r.following_id as string);
  if (!ids.length) return [];

  const { data: profs } = await supabase
    .from("profiles")
    .select(PERSON)
    .in("id", ids);

  const byId = new Map(
    (profs ?? []).map((p) => [(p as { id: string }).id, personFrom(p as Record<string, unknown>)])
  );
  return ids.map((id) => byId.get(id)).filter((p): p is Person => Boolean(p));
}

/**
 * Loop one or more people in on a commit the viewer owns. Ignores duplicates
 * (a person already in the loop is a no-op). The DB trigger notifies each
 * newly-added person.
 */
export async function loopInPeople(
  commitId: string,
  userIds: string[]
): Promise<ActionResult<{ added: number }>> {
  const { supabase, userId } = await requireUser();

  // Only the commit's author may loop people in.
  const { data: commit } = await supabase
    .from("commits")
    .select("user_id")
    .eq("id", commitId)
    .maybeSingle();
  if (!commit) return { ok: false, error: "Commit not found." };
  if (commit.user_id !== userId)
    return { ok: false, error: "Only the author can put people in the loop." };

  const ids = [...new Set(userIds.filter((id) => id && id !== userId))];
  if (!ids.length) return { ok: true, data: { added: 0 } };

  const { error } = await supabase
    .from("loop_ins")
    .upsert(
      ids.map((id) => ({ commit_id: commitId, user_id: id })),
      { onConflict: "commit_id,user_id", ignoreDuplicates: true }
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/commit/${commitId}`);
  return { ok: true, data: { added: ids.length } };
}

/** Remove someone from the loop on a commit the viewer owns. */
export async function removeLoopIn(
  commitId: string,
  targetId: string
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("loop_ins")
    .delete()
    .eq("commit_id", commitId)
    .eq("user_id", targetId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/commit/${commitId}`);
  return { ok: true };
}
