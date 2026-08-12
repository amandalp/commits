import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { UpdateComposer } from "./UpdateComposer";
import { countdown, deadlineFull, lifeProgress } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

/** The creator's follow-up panel on their own active commit. */
export function OwnerPanel({ commit }: { commit: CommitView }) {
  const cd = countdown(commit.deadline);
  const progress = lifeProgress(commit.created_at, commit.deadline);
  const needsResolve = cd.overdue;

  return (
    <div className="space-y-3">
      {needsResolve ? (
        <Link
          href={`/commit/${commit.id}/resolve`}
          className="flex items-center gap-3 rounded-2xl border border-accent-soft bg-accent-soft px-4 py-4 transition hover:brightness-[0.98]"
        >
          <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
          <div>
            <div className="font-semibold text-accent-strong">How did it go?</div>
            <div className="text-[13px] text-accent-strong/80">
              Your deadline has passed — ship it or set a new one.
            </div>
          </div>
          <span className="ml-auto text-lg text-accent">→</span>
        </Link>
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-4 py-4">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Clock className="h-4 w-4 text-accent" />
            {cd.label}
          </div>
          <div className="mt-0.5 text-[13px] text-muted">
            {deadlineFull(commit.deadline)}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream-deep">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[13px] text-muted">You can do this 💪</div>
        </div>
      )}

      <UpdateComposer commitId={commit.id} author={commit.author} />
    </div>
  );
}
