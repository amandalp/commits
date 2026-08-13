"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCommit } from "@/lib/actions/commits";
import { readPendingDraft, clearPendingDraft } from "@/lib/draft";

/**
 * Publishes a commitment drafted before sign-in. Mounted inside the
 * authenticated app shell, so it runs once the visitor is back and onboarded —
 * covering both new users (after onboarding → "/") and existing ones
 * (callback → "/"). Renders nothing.
 */
export function PendingCommitPublisher() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const draft = readPendingDraft();
    if (!draft) return;
    // Clear before awaiting so a re-render or second mount can't double-publish.
    clearPendingDraft();

    createCommit({ text: draft.text, deadline: draft.deadline }).then((res) => {
      if (res.ok && res.data) {
        router.replace(`/commit/${res.data.id}`);
        router.refresh();
      }
    });
  }, [router]);

  return null;
}
