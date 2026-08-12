"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";
import { usernameOk } from "@/lib/utils";
import type { ProfileRow } from "@/lib/database.types";

type ProfileInput = {
  name?: string;
  username?: string;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  avatar_url?: string | null;
};

export async function updateProfile(
  input: ProfileInput
): Promise<ActionResult<{ username: string }>> {
  const { supabase, userId } = await requireUser();

  const patch: Partial<ProfileRow> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Name can't be empty." };
    patch.name = name;
  }
  if (input.username !== undefined) {
    const username = input.username.trim().toLowerCase();
    if (!usernameOk(username))
      return {
        ok: false,
        error: "Usernames are 3–20 chars: letters, numbers, underscores.",
      };
    // uniqueness (excluding self)
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .maybeSingle();
    if (taken) return { ok: false, error: "That username is taken." };
    patch.username = username;
  }
  if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;
  if (input.location !== undefined) patch.location = input.location?.trim() || null;
  if (input.website !== undefined) patch.website = input.website?.trim() || null;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("username")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to save." };

  // Mirror username into auth metadata so middleware onboarding gate clears.
  if (patch.username || patch.name) {
    await supabase.auth.updateUser({
      data: {
        ...(patch.username ? { username: patch.username } : {}),
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.avatar_url !== undefined ? { avatar_url: patch.avatar_url } : {}),
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath(`/u/${data.username}`);
  return { ok: true, data: { username: data.username } };
}

/** First-run onboarding: upsert the profile and mark the user onboarded. */
export async function completeOnboarding(input: {
  name: string;
  username: string;
  avatar_url?: string | null;
}): Promise<ActionResult<{ username: string }>> {
  const { supabase, userId } = await requireUser();

  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  if (!name) return { ok: false, error: "Add your name." };
  if (!usernameOk(username))
    return {
      ok: false,
      error: "Usernames are 3–20 chars: letters, numbers, underscores.",
    };

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .maybeSingle();
  if (taken) return { ok: false, error: "That username is taken." };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      name,
      username,
      avatar_url: input.avatar_url || null,
    },
    { onConflict: "id" }
  );
  if (error) return { ok: false, error: error.message };

  const { error: metaErr } = await supabase.auth.updateUser({
    data: { name, username, avatar_url: input.avatar_url || null },
  });
  if (metaErr) return { ok: false, error: metaErr.message };

  return { ok: true, data: { username } };
}

export async function isUsernameAvailable(
  username: string
): Promise<{ available: boolean }> {
  const { supabase, userId } = await requireUser();
  const u = username.trim().toLowerCase();
  if (!usernameOk(u)) return { available: false };
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", u)
    .neq("id", userId)
    .maybeSingle();
  return { available: !data };
}
