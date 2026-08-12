import { createClient } from "@/lib/supabase/server";
import type { NotificationRow, NotificationType } from "@/lib/database.types";
import type { NotificationView, Person } from "@/lib/types";

const PERSON = "id, name, username, avatar_url";
const GROUPABLE: NotificationType[] = ["cheer", "watch", "join", "follow"];

function personFrom(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    name: row.name as string,
    username: row.username as string,
    avatar_url: (row.avatar_url as string | null) ?? null,
  };
}

export async function getUnreadCount(viewerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", viewerId)
    .eq("read", false);
  return count ?? 0;
}

/**
 * Grouped activity feed. Repetitive rows on the same commit collapse into
 * "Maya and 7 others cheered your commit."
 */
export async function getNotifications(
  viewerId: string
): Promise<NotificationView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(80);

  const rows = (data ?? []) as NotificationRow[];
  if (rows.length === 0) return [];

  // Batch-resolve actors, commit texts, comment texts.
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const commitIds = [...new Set(rows.map((r) => r.commit_id).filter(Boolean))] as string[];
  const commentIds = [...new Set(rows.map((r) => r.comment_id).filter(Boolean))] as string[];

  const [actorsRes, commitsRes, commentsRes] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select(PERSON).in("id", actorIds)
      : Promise.resolve({ data: [] }),
    commitIds.length
      ? supabase.from("commits").select("id, text").in("id", commitIds)
      : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabase.from("comments").select("id, text").in("id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const actorById = new Map<string, Person>();
  for (const a of actorsRes.data ?? [])
    actorById.set((a as { id: string }).id, personFrom(a as Record<string, unknown>));
  const commitTextById = new Map<string, string>();
  for (const c of commitsRes.data ?? [])
    commitTextById.set((c as { id: string }).id, (c as { text: string }).text);
  const commentTextById = new Map<string, string>();
  for (const c of commentsRes.data ?? [])
    commentTextById.set((c as { id: string }).id, (c as { text: string }).text);

  // Group in timeline order.
  const out: NotificationView[] = [];
  const groupIndex = new Map<string, number>();

  for (const r of rows) {
    const actor = r.actor_id ? actorById.get(r.actor_id) ?? null : null;
    const groupKey =
      GROUPABLE.includes(r.type) &&
      `${r.type}:${r.commit_id ?? "none"}`;

    if (groupKey && groupIndex.has(groupKey)) {
      const idx = groupIndex.get(groupKey)!;
      const g = out[idx];
      if (actor && !g.actors.some((a) => a.id === actor.id)) {
        if (g.actors.length < 3) g.actors.push(actor);
        else g.extra_count += 1;
      }
      if (!r.read) g.read = false;
      continue;
    }

    const view: NotificationView = {
      id: r.id,
      type: r.type,
      read: r.read,
      created_at: r.created_at,
      actor,
      actors: actor ? [actor] : [],
      extra_count: 0,
      commit_id: r.commit_id,
      commit_text: r.commit_id ? commitTextById.get(r.commit_id) ?? null : null,
      comment_text: r.comment_id ? commentTextById.get(r.comment_id) ?? null : null,
    };
    out.push(view);
    if (groupKey) groupIndex.set(groupKey, out.length - 1);
  }

  return out;
}
