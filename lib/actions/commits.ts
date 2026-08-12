"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type ActionResult } from "./helpers";

type CreateInput = {
  text: string;
  context?: string | null;
  mediaUrl?: string | null;
  deadline: string; // ISO
  parentCommitId?: string | null;
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

  const { data, error } = await supabase
    .from("commits")
    .insert({
      user_id: userId,
      text,
      context: input.context?.trim() || null,
      media_url: input.mediaUrl || null,
      deadline: when.toISOString(),
      original_deadline: when.toISOString(),
      parent_commit_id: input.parentCommitId ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not commit." };

  revalidatePath("/");
  revalidatePath("/me");
  if (input.parentCommitId) revalidatePath(`/commit/${input.parentCommitId}`);
  return { ok: true, data: { id: data.id } };
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

  // Record the ship update first — its trigger notifies watchers + joiners.
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
