"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { cn, compact } from "@/lib/utils";
import type { CommitView } from "@/lib/types";
import { toggleCheer } from "@/lib/actions/social";
import { CheerersSheet } from "./CheerersSheet";
import { HandHeart, HandComment } from "./HandIcons";
import { ShareButton } from "./ShareButton";
import { useThemeStyle } from "./ThemeStyle";
import { useAuthGate } from "./AuthGate";

const actionBase =
  "inline-flex h-10 items-center justify-center gap-1 rounded-full px-1.5 text-[13px] font-medium transition-all active:scale-90";

export function CommitActions({ commit }: { commit: CommitView }) {
  const { hand } = useThemeStyle();
  const gate = useAuthGate();
  const [cheered, setCheered] = useState(commit.viewer_cheered);
  const [cheers, setCheers] = useState(commit.cheer_count);
  const [cheerersOpen, setCheerersOpen] = useState(false);
  const [burst, setBurst] = useState(false);

  function onCheer() {
    if (!gate.require({ kind: "cheer", commitId: commit.id, who: commit.author.name }))
      return;
    const next = !cheered;
    setCheered(next);
    setCheers((c) => c + (next ? 1 : -1));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 340);
    }
    toggleCheer(commit.id).then((r) => {
      if (!r.ok) {
        setCheered(!next);
        setCheers((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {/* Heart toggles the cheer; the number opens the list of who cheered. */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onCheer}
          aria-pressed={cheered}
          aria-label={cheered ? "Remove cheer" : "Cheer"}
          title="Cheer"
          className={cn(
            actionBase,
            cheered ? "text-like" : "text-ink-soft hover:bg-cream-deep",
            burst && "animate-pop"
          )}
        >
          {hand ? (
            <HandHeart className="h-[21px] w-[21px]" filled={cheered} />
          ) : (
            <Heart className="h-[20px] w-[20px]" strokeWidth={2} fill={cheered ? "currentColor" : "none"} />
          )}
        </button>
        {cheers > 0 && (
          <button
            type="button"
            onClick={() => setCheerersOpen(true)}
            aria-label="See who cheered"
            className="-ml-2 rounded-full px-1 py-1 text-[13px] font-medium text-ink-soft hover:bg-cream-deep"
          >
            {compact(cheers)}
          </button>
        )}
      </div>

      {/* Comment */}
      <Link
        href={`/commit/${commit.id}`}
        aria-label="Comment"
        title="Comment"
        className={cn(actionBase, "text-ink-soft hover:bg-cream-deep")}
      >
        {hand ? (
          <HandComment className="h-[21px] w-[21px]" />
        ) : (
          <MessageCircle className="h-[20px] w-[20px]" strokeWidth={2} />
        )}
        {commit.comment_count > 0 && <span>{compact(commit.comment_count)}</span>}
      </Link>

      {/* Share: the paper-plane "send" affordance, à la Threads/Instagram. */}
      <ShareButton commit={commit} />

      <CheerersSheet
        commitId={commit.id}
        open={cheerersOpen}
        onClose={() => setCheerersOpen(false)}
      />
    </div>
  );
}
