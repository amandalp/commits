import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Authed = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

/** A viewer who may or may not be signed in. Everything here is world-readable. */
export type Viewer = {
  supabase: SupabaseClient<Database>;
  userId: string | null;
};

export async function requireUser(): Promise<Authed> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

/**
 * For reads that guests are allowed to make, and for writes that would rather
 * return a prompt than throw. Reading Commits never requires an account.
 */
export async function optionalUser(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Returned by a write a guest reached anyway: a stale cookie, or a UI gate
 * that didn't fire. The client surfaces the contextual sign-in prompt.
 */
export const AUTH_REQUIRED = "auth_required";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
