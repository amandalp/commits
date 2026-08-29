import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CommitRow } from "@/lib/database.types";
import type { CommitView, Person, UpdateView } from "@/lib/types";

type SB = SupabaseClient<Database>;

/** The two lifecycle buckets the UI shows: Open and Done. */
export type CommitBucket = "open" | "done";

const PERSON = "id, name, username, avatar_url";
const AVATAR_STACK = 5;

function personFrom(row: Record<string, unknown> | undefined | null): Person {
  return {
    id: (row?.id as string) ?? "",
    name: (row?.name as string) ?? "Someone",
    username: (row?.username as string) ?? "user",
    avatar_url: (row?.avatar_url as string | null) ?? null,
  };
}

/**
 * Turn raw commit rows into fully enriched CommitViews: authors, parent
 * references, social counts, viewer flags, avatar stacks and ship updates.
 * A handful of batched queries keyed by the commit id set, so no N+1.
 */
export async function enrichCommits(
  supabase: SB,
  rows: CommitRow[],
  viewerId: string | null
): Promise<CommitView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const parentIds = [
    ...new Set(rows.map((r) => r.parent_commit_id).filter(Boolean)),
  ] as string[];

  const [
    parentsRes,
    cheersRes,
    watchesRes,
    commentsRes,
    joinsRes,
    shipsRes,
    loopInsRes,
    checkInsRes,
  ] = await Promise.all([
    parentIds.length
      ? supabase.from("commits").select("id, user_id, text").in("id", parentIds)
      : Promise.resolve({ data: [] as { id: string; user_id: string; text: string }[] }),
    supabase.from("cheers").select("user_id, commit_id").in("commit_id", ids),
    supabase.from("watches").select("user_id, commit_id").in("commit_id", ids),
    supabase.from("comments").select("commit_id").in("commit_id", ids),
    supabase
      .from("commits")
      .select("id, user_id, parent_commit_id")
      .in("parent_commit_id", ids),
    supabase
      .from("updates")
      .select("id, commit_id, user_id, text, media_url, link_url, kind, created_at")
      .in("commit_id", ids)
      .eq("kind", "ship"),
    supabase.from("loop_ins").select("user_id, commit_id, created_at").in("commit_id", ids),
    // Only repeating commits carry check-ins; skip the query when none do.
    rows.some((r) => r.repeat_days?.length)
      ? supabase
          .from("check_ins")
          .select("commit_id")
          .in("commit_id", ids)
          .eq("status", "done")
      : Promise.resolve({ data: [] as { commit_id: string }[] }),
  ]);

  const cheers = cheersRes.data ?? [];
  const watches = watchesRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const joins = joinsRes.data ?? [];
  const ships = shipsRes.data ?? [];
  const loopIns = loopInsRes.data ?? [];
  const checkInRows = checkInsRes.data ?? [];
  const parents = (parentsRes.data ?? []) as {
    id: string;
    user_id: string;
    text: string;
  }[];

  // Aggregate per-commit.
  const count = (arr: { commit_id: string }[]) => {
    const m = new Map<string, number>();
    for (const r of arr) m.set(r.commit_id, (m.get(r.commit_id) ?? 0) + 1);
    return m;
  };
  const cheerCount = count(cheers);
  const watchCount = count(watches);
  const commentCount = count(comments);
  const checkInCount = count(checkInRows);

  const joinCount = new Map<string, number>();
  const joinersByCommit = new Map<string, string[]>();
  for (const j of joins) {
    const pid = j.parent_commit_id!;
    joinCount.set(pid, (joinCount.get(pid) ?? 0) + 1);
    const list = joinersByCommit.get(pid) ?? [];
    if (list.length < AVATAR_STACK) list.push(j.user_id);
    joinersByCommit.set(pid, list);
  }

  const cheerersByCommit = new Map<string, string[]>();
  for (const c of cheers) {
    const list = cheerersByCommit.get(c.commit_id) ?? [];
    if (list.length < AVATAR_STACK) list.push(c.user_id);
    cheerersByCommit.set(c.commit_id, list);
  }

  const watchersByCommit = new Map<string, string[]>();
  for (const w of watches) {
    const list = watchersByCommit.get(w.commit_id) ?? [];
    if (list.length < AVATAR_STACK) list.push(w.user_id);
    watchersByCommit.set(w.commit_id, list);
  }

  // People in the loop, oldest first (the order the author added them).
  const loopedInByCommit = new Map<string, string[]>();
  for (const l of [...loopIns].sort((a, b) =>
    String(a.created_at).localeCompare(String(b.created_at))
  )) {
    const list = loopedInByCommit.get(l.commit_id) ?? [];
    list.push(l.user_id);
    loopedInByCommit.set(l.commit_id, list);
  }

  const viewerCheered = new Set(
    viewerId ? cheers.filter((c) => c.user_id === viewerId).map((c) => c.commit_id) : []
  );
  const viewerWatching = new Set(
    viewerId ? watches.filter((w) => w.user_id === viewerId).map((w) => w.commit_id) : []
  );
  const viewerJoined = new Set(
    viewerId
      ? joins.filter((j) => j.user_id === viewerId).map((j) => j.parent_commit_id!)
      : []
  );

  const shipByCommit = new Map<string, (typeof ships)[number]>();
  for (const s of ships) if (!shipByCommit.has(s.commit_id)) shipByCommit.set(s.commit_id, s);

  // One profile fetch for every id we might render.
  const profileIds = new Set<string>();
  for (const r of rows) profileIds.add(r.user_id);
  for (const p of parents) profileIds.add(p.user_id);
  for (const list of cheerersByCommit.values()) list.forEach((id) => profileIds.add(id));
  for (const list of joinersByCommit.values()) list.forEach((id) => profileIds.add(id));
  for (const list of watchersByCommit.values()) list.forEach((id) => profileIds.add(id));
  for (const list of loopedInByCommit.values()) list.forEach((id) => profileIds.add(id));

  const { data: profs } = profileIds.size
    ? await supabase.from("profiles").select(PERSON).in("id", [...profileIds])
    : { data: [] };
  const profById = new Map<string, Person>();
  for (const p of profs ?? []) profById.set((p as { id: string }).id, personFrom(p));
  const person = (id: string): Person =>
    profById.get(id) ?? {
      id,
      name: "Someone",
      username: "user",
      avatar_url: null,
    };

  const parentById = new Map(parents.map((p) => [p.id, p]));

  return rows.map((r): CommitView => {
    const ship = shipByCommit.get(r.id);
    const shipView: UpdateView | null = ship
      ? {
          id: ship.id,
          text: ship.text,
          media_url: ship.media_url,
          link_url: ship.link_url,
          kind: "ship",
          created_at: ship.created_at,
          author: person(r.user_id),
        }
      : null;

    const parentRow = r.parent_commit_id ? parentById.get(r.parent_commit_id) : null;

    return {
      id: r.id,
      text: r.text,
      context: r.context,
      media_url: r.media_url ?? null,
      // Prefer the array; fall back to the legacy single url for old rows.
      media_urls: r.media_urls?.length
        ? r.media_urls
        : r.media_url
          ? [r.media_url]
          : [],
      deadline: r.deadline,
      original_deadline: r.original_deadline,
      duration:
        r.duration_amount && r.duration_unit
          ? { amount: r.duration_amount, unit: r.duration_unit }
          : null,
      repeat_days: r.repeat_days ?? null,
      check_in_count: checkInCount.get(r.id) ?? 0,
      status: r.status,
      created_at: r.created_at,
      shipped_at: r.shipped_at,
      closed_at: r.closed_at,
      parent_commit_id: r.parent_commit_id,
      author: person(r.user_id),
      parent: parentRow
        ? { id: parentRow.id, text: parentRow.text, author: person(parentRow.user_id) }
        : null,
      cheer_count: cheerCount.get(r.id) ?? 0,
      comment_count: commentCount.get(r.id) ?? 0,
      watch_count: watchCount.get(r.id) ?? 0,
      join_count: joinCount.get(r.id) ?? 0,
      viewer_cheered: viewerCheered.has(r.id),
      viewer_watching: viewerWatching.has(r.id),
      viewer_joined: viewerJoined.has(r.id),
      is_owner: r.user_id === viewerId,
      cheerers: (cheerersByCommit.get(r.id) ?? []).map(person),
      joiners: (joinersByCommit.get(r.id) ?? []).map(person),
      watchers: (watchersByCommit.get(r.id) ?? []).map(person),
      looped_in: (loopedInByCommit.get(r.id) ?? []).map(person),
      ship: shipView,
    };
  });
}

/** Home feed. tab = 'for-you' (everyone) | 'following'. */
export async function getFeed(
  tab: "for-you" | "following",
  viewerId: string | null
): Promise<CommitView[]> {
  const supabase = await createClient();

  let followingIds: string[] = [];
  if (tab === "following" && viewerId) {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId);
    followingIds = (data ?? []).map((f) => f.following_id);
    if (followingIds.length === 0) return [];
  }

  let query = supabase
    .from("commits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (tab === "following") query = query.in("user_id", followingIds);

  const { data } = await query;
  return enrichCommits(supabase, (data ?? []) as CommitRow[], viewerId);
}

/** A single enriched commit. */
export async function getCommit(
  id: string,
  viewerId: string | null
): Promise<CommitView | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("commits").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const [view] = await enrichCommits(supabase, [data as CommitRow], viewerId);
  return view ?? null;
}

/** The non-ship progress updates timeline for a commit. */
export async function getUpdates(commitId: string): Promise<UpdateView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("updates")
    .select(`*, author:profiles!updates_user_id_fkey(${PERSON})`)
    .eq("commit_id", commitId)
    .neq("kind", "ship")
    .order("created_at", { ascending: false });

  return (data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    text: (u.text as string | null) ?? null,
    media_url: (u.media_url as string | null) ?? null,
    link_url: (u.link_url as string | null) ?? null,
    kind: u.kind as UpdateView["kind"],
    created_at: u.created_at as string,
    author: personFrom(u.author as Record<string, unknown>),
  }));
}

/** People who joined a commit (their linked commits). */
export async function getJoiners(commitId: string): Promise<Person[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commits")
    .select(`author:profiles!commits_user_id_fkey(${PERSON})`)
    .eq("parent_commit_id", commitId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r: Record<string, unknown>) =>
    personFrom(r.author as Record<string, unknown>)
  );
}

/**
 * A user's commits in one of the two buckets the interface names.
 *
 *   open: still on the record (active or past its deadline)
 *   done: finished, either way: shipped, or closed after a change of
 *          direction. Both endings belong in the same place; the split
 *          between them is a grouping inside the list, not another tab.
 */
export async function getUserCommits(
  userId: string,
  bucket: CommitBucket,
  viewerId: string | null
): Promise<CommitView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commits")
    .select("*")
    .eq("user_id", userId)
    .in(
      "status",
      bucket === "done" ? ["shipped", "closed"] : ["active", "overdue"]
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as CommitRow[];

  // Done holds two kinds of ending, each stamped in its own column, so the
  // list can only read newest-first once they're sorted on whichever one
  // actually finished the commit.
  if (bucket === "done") rows.sort((a, b) => endedAt(b).localeCompare(endedAt(a)));

  return enrichCommits(supabase, rows, viewerId);
}

/** When a finished commit finished: shipped or closed, whichever happened. */
function endedAt(r: CommitRow): string {
  return r.shipped_at ?? r.closed_at ?? r.created_at;
}

/** Commits by the viewer that are past deadline and still unresolved. */
export async function getUnresolvedCommits(
  viewerId: string
): Promise<CommitView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commits")
    .select("*")
    .eq("user_id", viewerId)
    .in("status", ["active", "overdue"])
    .lt("deadline", new Date().toISOString())
    .order("deadline", { ascending: true });
  return enrichCommits(supabase, (data ?? []) as CommitRow[], viewerId);
}
