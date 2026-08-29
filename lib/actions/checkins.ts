"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";
import type { CheckInStatus } from "@/lib/types";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Log (or correct) one day on a repeating commit. The day key comes from the
 * browser so it means the day the person actually lived, not a UTC instant.
 * the checks below keep it inside the commit's own run.
 */
export async function checkIn(
  commitId: string,
  day: string,
  status: CheckInStatus = "done",
  note?: { text?: string | null; mediaUrl?: string | null } | null
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!DAY.test(day)) return { ok: false, error: "That's not a day we can log." };

  const { data: commit } = await supabase
    .from("commits")
    .select("id, user_id, created_at, deadline, repeat_days")
    .eq("id", commitId)
    .maybeSingle();

  if (!commit || commit.user_id !== userId)
    return { ok: false, error: "That's not your commitment." };
  if (!commit.repeat_days?.length)
    return { ok: false, error: "This commitment isn't being tracked." };

  // A day either side of the run absorbs the timezone gap between the
  // browser's local day and the stored timestamps.
  const start = new Date(commit.created_at).getTime() - 864e5;
  const end = new Date(commit.deadline).getTime() + 864e5;
  const when = new Date(`${day}T12:00:00`).getTime();
  if (when < start || when > end)
    return { ok: false, error: "That day is outside this commitment." };
  if (when > Date.now() + 864e5)
    return { ok: false, error: "You can't check in ahead of time." };

  // An optional note rides along as a normal update, so it shows up in the
  // conversation and the feed like any other progress post.
  let updateId: string | null = null;
  if (note && (note.text?.trim() || note.mediaUrl)) {
    const { data: update } = await supabase
      .from("updates")
      .insert({
        commit_id: commitId,
        user_id: userId,
        text: note.text?.trim() || null,
        media_url: note.mediaUrl ?? null,
        kind: "update",
      })
      .select("id")
      .single();
    updateId = update?.id ?? null;
  }

  const { error } = await supabase.from("check_ins").upsert(
    {
      commit_id: commitId,
      user_id: userId,
      day,
      status,
      ...(updateId ? { update_id: updateId } : {}),
    },
    { onConflict: "commit_id,day" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/commit/${commitId}`);
  revalidatePath("/me");
  revalidatePath("/profile");
  return { ok: true };
}

/** Undo a day, for when someone taps the wrong square. */
export async function clearCheckIn(
  commitId: string,
  day: string
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!DAY.test(day)) return { ok: false, error: "That's not a day we can log." };

  const { error } = await supabase
    .from("check_ins")
    .delete()
    .eq("commit_id", commitId)
    .eq("day", day)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/commit/${commitId}`);
  revalidatePath("/me");
  return { ok: true };
}
