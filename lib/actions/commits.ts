"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";
import type { Duration, DurationUnit } from "@/lib/types";

const DURATION_UNITS: DurationUnit[] = [
  "hours",
  "days",
  "weeks",
  "months",
  "years",
];

type CreateInput = {
  text: string;
  context?: string | null;
  mediaUrl?: string | null;
  mediaUrls?: string[] | null;
  deadline: string; // ISO
  /** Set when the commit is framed as "for 30 days"; the deadline is its end. */
  duration?: Duration | null;
  /** Weekdays to track check-ins on (ISO 1=Mon..7=Sun). Null = don't track. */
  repeatDays?: number[] | null;
  parentCommitId?: string | null;
  /** People to put "in the loop": notified they were CC'd on this commit. */
  loopInIds?: string[] | null;
};

export async function createCommit(
  input: CreateInput
): Promise<ActionResult<{ id: string }>> {
  const { supabase, userId } = await requireUser();

  const text = input.text.trim();
  if (!text) return { ok: false, error: "Say what you're going to do." };
  if (text.length > 280) return { ok: false, error: "Keep it under 280 characters." };
  const when = new Date(input.deadline);
  if (isNaN(when.getTime())) return { ok: false, error: "Pick a deadline." };

  const mediaUrls = (input.mediaUrls ?? []).filter(Boolean);

  // A duration is a framing, not a second source of truth, so reject anything
  // out of range rather than storing a label the deadline doesn't match.
  const duration = input.duration ?? null;
  if (
    duration &&
    (!DURATION_UNITS.includes(duration.unit) ||
      !Number.isInteger(duration.amount) ||
      duration.amount < 1 ||
      duration.amount > 365)
  )
    return { ok: false, error: "Pick how long you're committing for." };

  // Tracking only makes sense across a run of days, and only on days that exist.
  const repeatDays = duration
    ? [...new Set(input.repeatDays ?? [])].filter((d) => d >= 1 && d <= 7).sort()
    : [];
  if (input.repeatDays?.length && !repeatDays.length)
    return { ok: false, error: "Pick which days to check in on." };

  const { data, error } = await supabase
    .from("commits")
    .insert({
      user_id: userId,
      text,
      context: input.context?.trim() || null,
      // Keep the legacy single column populated (first item) for back-compat.
      media_url: mediaUrls[0] ?? input.mediaUrl ?? null,
      media_urls: mediaUrls,
      deadline: when.toISOString(),
      original_deadline: when.toISOString(),
      duration_amount: duration?.amount ?? null,
      duration_unit: duration?.unit ?? null,
      repeat_days: repeatDays.length ? repeatDays : null,
      parent_commit_id: input.parentCommitId ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not commit." };

  // Put the tagged people in the loop. Each insert fires a 'loop_in' notice
  // via trigger. Best-effort: a failure here shouldn't fail the whole commit.
  const loopIds = [...new Set((input.loopInIds ?? []).filter((id) => id && id !== userId))];
  if (loopIds.length) {
    await supabase
      .from("loop_ins")
      .insert(loopIds.map((id) => ({ commit_id: data.id, user_id: id })));
  }

  revalidatePath("/");
  revalidatePath("/me");
  if (input.parentCommitId) revalidatePath(`/commit/${input.parentCommitId}`);
  return { ok: true, data: { id: data.id } };
}

/**
 * "Keep going" at the end of a run: push the deadline out by the same span
 * again, keeping the schedule and the check-ins already logged. The commitment
 * stays the same commitment. This is a continuation, not a new promise.
 */
export async function extendCommit(commitId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();

  const { data: commit } = await supabase
    .from("commits")
    .select("id, user_id, deadline, duration_amount, duration_unit")
    .eq("id", commitId)
    .maybeSingle();
  if (!commit || commit.user_id !== userId)
    return { ok: false, error: "That's not your commitment." };

  // Extend from today when the run has already lapsed, so the new stretch is
  // the full span rather than time that's already gone.
  const from = new Date(
    Math.max(new Date(commit.deadline).getTime(), Date.now())
  );
  const amount = commit.duration_amount ?? 7;
  const unit = commit.duration_unit ?? "days";
  const next = new Date(from);
  if (unit === "hours") next.setHours(next.getHours() + amount);
  else if (unit === "days") next.setDate(next.getDate() + amount);
  else if (unit === "weeks") next.setDate(next.getDate() + amount * 7);
  else if (unit === "months") next.setMonth(next.getMonth() + amount);
  else next.setFullYear(next.getFullYear() + amount);

  const { error } = await supabase
    .from("commits")
    .update({ deadline: next.toISOString(), status: "active" })
    .eq("id", commitId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/commit/${commitId}`);
  revalidatePath("/me");
  return { ok: true };
}

/** Join = create a linked commit referencing the original. */
export async function joinCommit(
  parentCommitId: string,
  input: { text: string; deadline: string }
): Promise<ActionResult<{ id: string }>> {
  return createCommit({
    text: input.text,
    deadline: input.deadline,
    parentCommitId,
  });
}

export async function postUpdate(
  commitId: string,
  input: { text?: string; mediaUrl?: string | null; linkUrl?: string | null }
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const text = input.text?.trim() || null;
  if (!text && !input.mediaUrl && !input.linkUrl)
    return { ok: false, error: "Add something to your update." };

  const { error } = await supabase.from("updates").insert({
    commit_id: commitId,
    user_id: userId,
    text,
    media_url: input.mediaUrl ?? null,
    link_url: input.linkUrl ?? null,
    kind: "update",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/commit/${commitId}`);
  return { ok: true };
}

export async function shipCommit(
  commitId: string,
  input: { text?: string; mediaUrl?: string | null; linkUrl?: string | null }
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();

  // Record the ship update first: its trigger notifies watchers + joiners.
  const { error: upErr } = await supabase.from("updates").insert({
    commit_id: commitId,
    user_id: userId,
    text: input.text?.trim() || null,
    media_url: input.mediaUrl ?? null,
    link_url: input.linkUrl ?? null,
    kind: "ship",
  });
  if (upErr) return { ok: false, error: upErr.message };

  const { error } = await supabase
    .from("commits")
    .update({ status: "shipped", shipped_at: new Date().toISOString() })
    .eq("id", commitId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath(`/commit/${commitId}`);
  revalidatePath("/me");
  return { ok: true };
}

export async function notYet(
  commitId: string,
  input: { text?: string; newDeadline?: string | null; close?: boolean }
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();

  const note = input.text?.trim() || null;
  if (note) {
    const { error } = await supabase.from("updates").insert({
      commit_id: commitId,
      user_id: userId,
      text: note,
      kind: "not_yet",
    });
    if (error) return { ok: false, error: error.message };
  }

  if (input.close) {
    const { error } = await supabase
      .from("commits")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", commitId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
  } else if (input.newDeadline) {
    const when = new Date(input.newDeadline);
    if (isNaN(when.getTime())) return { ok: false, error: "Pick a new deadline." };
    // Keep original_deadline; just move the working deadline. Reset to active.
    const { error } = await supabase
      .from("commits")
      .update({ deadline: when.toISOString(), status: "active" })
      .eq("id", commitId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/commit/${commitId}`);
  revalidatePath("/me");
  return { ok: true };
}

export async function deleteCommit(commitId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("commits")
    .delete()
    .eq("id", commitId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/me");
  return { ok: true };
}
