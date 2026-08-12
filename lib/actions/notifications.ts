"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/activity");
  return { ok: true };
}
