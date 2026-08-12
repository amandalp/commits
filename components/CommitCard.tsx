"use client";

import Link from "next/link";
import { MessageCircle, Clock, PartyPopper } from "lucide-react";
import { Avatar, AvatarStack } from "./Avatar";
import { CommitStructure } from "./CommitStructure";
import { CommitActions } from "./CommitActions";
import { StatusBadge } from "./ui";
import { ShipProof } from "./ShipProof";
import { ShareButton } from "./ShareButton";
import { CheerInline } from "./CheerInline";
import { timeAgo, deadlineLabel, countdown, compact } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

function CardHeader({
  commit,
  badge,
}: {
  commit: CommitView;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Link href={`/u/${commit.author.username}`} className="shrink-0">
        <Avatar person={commit.author} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${commit.author.username}`}
            className="truncate font-semibold text-ink hover:underline"
          >
            {commit.author.name}
          </Link>
          {badge}
        </div>
        <div className="text-[13px] text-muted">@{commit.author.username}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[13px] text-faint">
        <Clock className="h-3.5 w-3.5" />
        {timeAgo(commit.created_at)}
      </div>
    </div>
  );
}

function JoinedFrom({ commit }: { commit: CommitView }) {
  if (!commit.parent) return null;
  return (
    <Link
      href={`/commit/${commit.parent.id}`}
      className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink-soft"
    >
      ↪ Joined {commit.parent.author.name.split(" ")[0]}&apos;s Commit
    </Link>
  );
}

function SocialProof({ commit }: { commit: CommitView }) {
  const bits: React.ReactNode[] = [];
  if (commit.cheer_count > 0)
    bits.push(
      <span key="c" className="flex items-center gap-1.5">
        <AvatarStack people={commit.cheerers} />
        {compact(commit.cheer_count)} cheering
      </span>
    );
  if (commit.join_count > 0)
    bits.push(<span key="j">{compact(commit.join_count)} joined</span>);

  return (
    <div className="mt-3 flex items-center gap-3 text-[13px] text-muted">
      {bits.map((b, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span className="text-border-strong">·</span>}
          {b}
        </span>
      ))}
      <Link
        href={`/commit/${commit.id}`}
        className="ml-auto flex items-center gap-1.5 hover:text-ink-soft"
      >
        <MessageCircle className="h-4 w-4" />
        {commit.comment_count > 0 ? compact(commit.comment_count) : ""}
      </Link>
    </div>
  );
}

/** Standard active/closed commit card. */
export function CommitCard({ commit }: { commit: CommitView }) {
  const cd = countdown(commit.deadline);
  const unresolvedOwner =
    commit.is_owner && commit.status !== "shipped" && commit.status !== "closed" && cd.overdue;

  return (
    <article className="border-b border-border-soft px-4 py-4 sm:px-5">
      <CardHeader
        commit={commit}
        badge={
          commit.status === "closed" ? <StatusBadge kind="closed" /> : null
        }
      />

      <div className="mt-3 pl-[calc(2.75rem+0.75rem)]">
        <JoinedFrom commit={commit} />
        <Link href={`/commit/${commit.id}`} className="block">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            size="sm"
            tone={commit.status === "closed" ? "closed" : "active"}
          />
        </Link>

        {unresolvedOwner ? (
          <Link
            href={`/commit/${commit.id}/resolve`}
            className="mt-3 flex items-center justify-between rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-strong"
          >
            How did it go? Resolve your commit →
          </Link>
        ) : (
          <div className="mt-3.5">
            <CommitActions commit={commit} />
          </div>
        )}

        <SocialProof commit={commit} />
      </div>
    </article>
  );
}

/** Celebratory shipped post. */
export function ShippedCard({ commit }: { commit: CommitView }) {
  return (
    <article className="hw-note relative border-b border-border-soft px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-success-strong">
        <PartyPopper className="h-4 w-4" />
        {commit.author.name.split(" ")[0]} shipped a Commit
      </div>

      <CardHeader commit={commit} badge={<StatusBadge kind="shipped" className="hw-shipped" />} />

      <div className="mt-3 pl-[calc(2.75rem+0.75rem)]">
        <Link href={`/commit/${commit.id}`} className="block">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            size="sm"
            tone="shipped"
          />
        </Link>

        {commit.shipped_at && (
          <div className="hw-shipdate ink-hand mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[13px] font-semibold text-success-strong">
            ✓ Shipped on {deadlineLabel(commit.shipped_at)}
          </div>
        )}

        {commit.ship?.text && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            {commit.ship.text}
          </p>
        )}

        {commit.ship && (
          <ShipProof
            mediaUrl={commit.ship.media_url}
            linkUrl={commit.ship.link_url}
          />
        )}

        <div className="mt-3.5 flex items-center gap-2">
          <CheerInline
            commitId={commit.id}
            initialCheered={commit.viewer_cheered}
            initialCount={commit.cheer_count}
          />
          <Link
            href={`/commit/${commit.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13.5px] font-semibold text-ink-soft hover:border-border-strong"
          >
            <MessageCircle className="h-4 w-4" />
            {commit.comment_count > 0 ? compact(commit.comment_count) : "Comment"}
          </Link>
          <ShareButton commit={commit} />
        </div>
      </div>
    </article>
  );
}
