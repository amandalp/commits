import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/types";

export type SessionUser = Person & {
  bio: string | null;
  location: string | null;
  website: string | null;
};

/**
 * The signed-in user's profile, or null. Cached per-request so multiple
 * server components can call it without extra round-trips.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, bio, location, website")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return profile as SessionUser;
});

/** Just the id, when that's all that's needed. */
export const getViewerId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});
