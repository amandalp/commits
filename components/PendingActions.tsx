"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCommit } from "@/lib/actions/commits";
import {
  toggleCheer,
  toggleFollow,
  toggleWatch,
  toggleCommentLike,
  addComment,
} from "@/lib/actions/social";
import { readPendingDraft, clearPendingDraft } from "@/lib/draft";
import { readPendingIntent, clearPendingIntent, type PendingIntent } from "@/lib/intent";

/**
 * Finishes whatever the visitor started before they had an account: the
 * commitment they drafted at /start, and the cheer / watch / follow / comment
 * they reached for while browsing signed out.
 *
 * Mounted inside the authenticated shell, so it runs once they're back and
 * onboarded, covering both new users (callback → onboarding → "/") and
 * existing ones (callback → wherever they were). Renders nothing.
 */
export function PendingActions() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const draft = readPendingDraft();
    const intent = readPendingIntent();
    if (!draft && !intent) return;
    // Clear before awaiting so a re-render or second mount can't double-post.
    clearPendingDraft();
    clearPendingIntent();

    (async () => {
      if (intent) await replay(intent);

      if (draft) {
        const res = await createCommit({
          text: draft.text,
          deadline: draft.deadline,
          duration: draft.duration ?? null,
          repeatDays: draft.repeatDays ?? null,
        });
        if (res.ok && res.data) {
          router.replace(`/commit/${res.data.id}`);
          router.refresh();
          return;
        }
      }

      // Back to the commitment they were looking at, never a blank feed.
      if (intent) router.replace(intent.returnTo);
      router.refresh();
    })();
  }, [router]);

  return null;
}

/**
 * The guest tapped a toggle, so the state they wanted is always "on". An
 * existing member who'd already cheered would otherwise have it switched off
 * by the replay, hence the second call.
 */
async function ensureOn(
  toggle: () => Promise<{ ok: boolean; data?: Record<string, boolean> }>,
  flag: string
) {
  const res = await toggle();
  if (res.ok && res.data && res.data[flag] === false) await toggle();
}

async function replay(intent: PendingIntent) {
  switch (intent.kind) {
    case "cheer":
      return ensureOn(() => toggleCheer(intent.commitId), "cheered");
    case "watch":
      return ensureOn(() => toggleWatch(intent.commitId), "watching");
    case "follow":
      return ensureOn(() => toggleFollow(intent.userId), "following");
    case "like":
      return ensureOn(
        () => toggleCommentLike(intent.commentId, intent.commitId),
        "liked"
      );
    case "comment":
      if (intent.text?.trim())
        await addComment(intent.commitId, intent.text, intent.parentCommentId ?? null);
      return;
    case "join":
      // Joining needs its own wording and deadline, so we can only carry them
      // back to the commitment and let them finish there.
      return;
  }
}
