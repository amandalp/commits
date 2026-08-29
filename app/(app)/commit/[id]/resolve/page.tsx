import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock, CalendarPlus } from "lucide-react";
import { getViewerId } from "@/lib/data/session";
import { getCommit } from "@/lib/data/commits";
import { getCheckIns } from "@/lib/data/checkins";
import { TopBar } from "@/components/TopBar";
import { CommitStructure } from "@/components/CommitStructure";
import { RunSummary } from "@/components/RunSummary";
import { RepeatRunCard } from "@/components/RepeatRunCard";
import { durationLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewerId = await getViewerId();
  const commit = await getCommit(id, viewerId);
  if (!commit) notFound();
  if (!commit.is_owner) redirect(`/commit/${id}`);
  if (commit.status === "shipped" || commit.status === "closed")
    redirect(`/commit/${id}`);

  const tracked = !!commit.repeat_days?.length;
  const checkIns = tracked ? await getCheckIns(id) : [];

  return (
    <div>
      <TopBar variant="close" fallbackHref={`/commit/${id}`} />
      <div className="px-5 pb-10 pt-4">
        <h1 className="ink-hand font-display text-[30px] font-bold text-ink">
          {tracked ? "how'd it go?" : "did you do it?"}
        </h1>
        <p className="mt-2 text-[13px] font-medium text-muted">You said you’d:</p>
        <div className="mt-3 rounded-3xl border border-border bg-surface p-5">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            duration={commit.duration}
            size="md"
          />
        </div>

        {tracked && (
          <div className="mt-5">
            <RunSummary
              createdAt={commit.created_at}
              deadline={commit.deadline}
              repeatDays={commit.repeat_days!}
              checkIns={checkIns}
              duration={commit.duration}
            />
          </div>
        )}

        {/*
          A big move gets the two answers its shape allows: I did it, or not
          yet. An everyday commitment ends on purpose instead: close it out,
          run it again, or turn it into something longer, so a week of
          sunscreen never quietly becomes a permanent habit tracker.
        */}
        <div className="mt-6 space-y-3">
          <Link
            href={`/commit/${id}/ship`}
            className="flex items-center gap-4 rounded-3xl border border-success-border bg-success-soft p-5 transition hover:brightness-[0.98] active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-bold text-ink">
                {tracked ? "That's a wrap" : "I did it"}
              </span>
              <span className="block text-[14px] text-success-strong">
                {tracked ? "close it out and share how it went" : "share the win"}
              </span>
            </span>
          </Link>

          {tracked && (
            <RepeatRunCard
              commitId={commit.id}
              spanLabel={commit.duration ? durationLabel(commit.duration) : null}
            />
          )}

          <Link
            href={`/commit/${id}/not-yet`}
            className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 transition hover:border-border-strong active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-deep text-ink-soft">
              {tracked ? (
                <CalendarPlus className="h-7 w-7" />
              ) : (
                <Clock className="h-7 w-7" />
              )}
            </span>
            <span>
              <span className="block text-lg font-bold text-ink">
                {tracked ? "Make it something longer" : "Not yet"}
              </span>
              <span className="block text-[14px] text-muted">
                {tracked ? "pick a new end date, or let it go" : "Need more time"}
              </span>
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-[13px] text-muted">
          You can add an update either way.
        </p>
      </div>
    </div>
  );
}
