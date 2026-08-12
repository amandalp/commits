import { createClient } from "@/lib/supabase/server";
import type { ProfileFull } from "@/lib/types";

const PERSON = "id, name, username, avatar_url";

async function countRows(
  promise: PromiseLike<{ count: number | null }>
): Promise<number> {
  const { count } = await promise;
  return count ?? 0;
}

export async function getProfileByUsername(
  username: string,
  viewerId: string | null
): Promise<ProfileFull | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;
  return hydrateProfile(profile, viewerId);
}

export async function getProfileById(
  id: string,
  viewerId: string | null
): Promise<ProfileFull | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;
  return hydrateProfile(profile, viewerId);
}

async function hydrateProfile(
  profile: Record<string, unknown>,
  viewerId: string | null
): Promise<ProfileFull> {
  const supabase = await createClient();
  const id = profile.id as string;

  // Their commit ids, to tally cheers received.
  const { data: commitRows } = await supabase
    .from("commits")
    .select("id, status")
    .eq("user_id", id);
  const commitIds = (commitRows ?? []).map((c) => c.id);
  const shippedCount = (commitRows ?? []).filter((c) => c.status === "shipped").length;

  const [followers, following, cheersReceived, followRow] = await Promise.all([
    countRows(
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", id)
    ),
    countRows(
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", id)
    ),
    commitIds.length
      ? countRows(
          supabase
            .from("cheers")
            .select("*", { count: "exact", head: true })
            .in("commit_id", commitIds)
        )
      : Promise.resolve(0),
    viewerId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id,
    name: profile.name as string,
    username: profile.username as string,
    avatar_url: (profile.avatar_url as string | null) ?? null,
    bio: (profile.bio as string | null) ?? null,
    location: (profile.location as string | null) ?? null,
    website: (profile.website as string | null) ?? null,
    instagram: (profile.instagram as string | null) ?? null,
    tiktok: (profile.tiktok as string | null) ?? null,
    x: (profile.x as string | null) ?? null,
    created_at: profile.created_at as string,
    followers,
    following,
    commits: commitIds.length,
    shipped: shippedCount,
    cheers_received: cheersReceived,
    is_following: !!followRow.data,
    is_self: viewerId === id,
  };
}

export { PERSON };
