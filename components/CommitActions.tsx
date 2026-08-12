"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommitView } from "@/lib/types";
import { toggleCheer, toggleWatch } from "@/lib/actions/social";
import { JoinSheet } from "./JoinSheet";

function Pill({
  active,
  onClick,
  children,
  emphasis,
  activeCls,
  ariaLabel,
  animate,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  emphasis?: boolean; // filled black (Join)
  activeCls?: string;
  ariaLabel?: string;
  animate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-all active:scale-[0.96]",
        emphasis
          ? "border-ink bg-ink text-white hover:bg-ink-soft"
          : active
          ? activeCls
          : "border-border bg-surface text-ink-soft hover:border-border-strong",
        animate && "animate-pop"
      )}
    >
      {children}
    </button>
  );
}

export function CommitActions({
  commit,
  size = "card",
}: {
  commit: CommitView;
  size?: "card" | "detail";
}) {
  const router = useRouter();
  const [cheered, setCheered] = useState(commit.viewer_cheered);
  const [cheers, setCheers] = useState(commit.cheer_count);
  const [watching, setWatching] = useState(commit.viewer_watching);
  const [joined, setJoined] = useState(commit.viewer_joined);
  const [joinOpen, setJoinOpen] = useState(false);
  const [burst, setBurst] = useState(false);

  const resolved = commit.status === "shipped" || commit.status === "closed";

  function onCheer() {
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

  function onWatch() {
    const next = !watching;
    setWatching(next);
    toggleWatch(commit.id).then((r) => {
      if (!r.ok) setWatching(!next);
    });
  }

  if (commit.is_owner) {
    return (
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <span className="inline-flex h-9 items-center rounded-full bg-cream-deep px-3.5 text-ink-soft">
          Your commit
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill
        active={cheered}
        onClick={onCheer}
        animate={burst}
        ariaLabel={cheered ? "Remove cheer" : "Cheer"}
        activeCls="border-accent bg-accent-soft text-accent-strong"
      >
        <span className="text-base leading-none">🙌</span>
        {cheered ? "Cheering" : "Cheer"}
      </Pill>

      <Pill
        active={watching}
        onClick={onWatch}
        ariaLabel={watching ? "Stop watching" : "Watch"}
        activeCls="border-accent bg-accent-soft text-accent-strong"
      >
        <span className="text-base leading-none">👀</span>
        {watching ? "Watching" : "Watch"}
      </Pill>

      {!resolved &&
        (joined ? (
          <Pill active activeCls="border-success-border bg-success-soft text-success-strong">
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Joined
          </Pill>
        ) : (
          <Pill emphasis onClick={() => setJoinOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Join
          </Pill>
        ))}

      {cheers > 0 && size === "detail" && (
        <span className="ml-1 text-[13px] text-muted">
          {cheers} cheering
        </span>
      )}

      <JoinSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        parentCommitId={commit.id}
        originalText={commit.text}
        authorName={commit.author.name.split(" ")[0]}
        onJoined={() => {
          setJoined(true);
          router.refresh();
        }}
      />
    </div>
  );
}
