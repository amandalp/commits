"use client";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Avatar } from "./Avatar";
import { CommitStructure } from "./CommitStructure";
import { TrackProgress } from "./TrackProgress";
import { CommitActions } from "./CommitActions";
import { WatchingProof } from "./WatchingProof";
import { StatusBadge } from "./ui";
import { ShipProof } from "./ShipProof";
import { timeAgo, deadlineLabel, countdown } from "@/lib/utils";
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
            @{commit.author.username}
          </Link>
          {badge}
        </div>
        <div className="text-[13px] text-muted">committed {timeAgo(commit.created_at)}</div>
        <JoinedFrom commit={commit} />
      </div>
    </div>
  );
}

function JoinedFrom({ commit }: { commit: CommitView }) {
  if (!commit.parent) return null;
  return (
    <div className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] text-muted">
      <Link
        href={`/commit/${commit.parent.id}`}
        className="hover:text-ink-soft"
      >
        ↪ joined
      </Link>
      <Link
        href={`/u/${commit.parent.author.username}`}
        className="font-semibold text-ink hover:underline"
      >
        @{commit.parent.author.username}
      </Link>
      <Link
        href={`/commit/${commit.parent.id}`}
        className="hover:text-ink-soft"
      >
        &apos;s commit
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

      <div className="mt-3.5">
        <Link href={`/commit/${commit.id}`} className="block">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            duration={commit.duration}
            size="md"
            tone={commit.status === "closed" ? "closed" : "active"}
          />
        </Link>

        {commit.repeat_days?.length ? (
          <Link href={`/commit/${commit.id}`} className="mt-2 block">
            <TrackProgress
              createdAt={commit.created_at}
              deadline={commit.deadline}
              repeatDays={commit.repeat_days}
              doneCount={commit.check_in_count}
            />
          </Link>
        ) : null}

        {unresolvedOwner && (
          <Link
            href={`/commit/${commit.id}`}
            className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
          >
            <span className="text-ink-soft">
              <span className="font-medium text-muted">deadline reached · </span>
              did you do it?
            </span>
            <span className="font-semibold text-accent">→</span>
          </Link>
        )}

        {/* heart · comment · send, with the watching stack trailing right. */}
        <div className="mt-3.5 flex items-center gap-3">
          <CommitActions commit={commit} />
          <WatchingProof commit={commit} className="ml-auto" />
        </div>
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
        {commit.author.name.split(" ")[0]} shipped a commit
      </div>

      <CardHeader commit={commit} badge={<StatusBadge kind="shipped" className="hw-shipped" />} />

      <div className="mt-3.5">
        <Link href={`/commit/${commit.id}`} className="block">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            duration={commit.duration}
            size="md"
            tone="shipped"
          />
        </Link>

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

        {/* the signature beat: said it, did it. */}
        <div className="hw-shipdate mt-3 flex items-center gap-2">
          <span className="ink-hand text-[15px] font-semibold text-success-strong">
            said it. did it.
          </span>
          {commit.shipped_at && (
            <span className="text-[12.5px] text-muted">
              · {deadlineLabel(commit.shipped_at)}
            </span>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <CommitActions commit={commit} />
          <WatchingProof commit={commit} className="ml-auto" />
        </div>
      </div>
    </article>
  );
}
