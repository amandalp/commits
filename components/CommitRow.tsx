import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CommitStructure } from "./CommitStructure";
import { StatusBadge } from "./ui";
import { countdown, deadlineLabel, compact } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

/** Compact management row used in My Commits. */
export function CommitRow({ commit }: { commit: CommitView }) {
  const cd = countdown(commit.deadline);
  const shipped = commit.status === "shipped";
  const closed = commit.status === "closed";
  const overdue = !shipped && !closed && cd.overdue;

  const meta = shipped
    ? `said it. did it. · ${deadlineLabel(commit.shipped_at ?? commit.deadline)}`
    : closed
    ? `Closed`
    : overdue
    ? "did you do it?"
    : cd.label;

  return (
    <Link
      href={overdue ? `/commit/${commit.id}/resolve` : `/commit/${commit.id}`}
      className="flex items-center gap-3 border-b border-border-soft px-4 py-4 transition hover:bg-surface-muted sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          {shipped && <StatusBadge kind="shipped" />}
          {closed && <StatusBadge kind="closed" />}
          {overdue && (
            <span className="inline-flex items-center rounded-full bg-cream-deep px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-muted">
              DEADLINE REACHED
            </span>
          )}
          {!shipped && !closed && !overdue && cd.dueSoon && (
            <StatusBadge kind="due-soon" />
          )}
        </div>
        <CommitStructure
          text={commit.text}
          deadline={commit.deadline}
          duration={commit.duration}
          size="sm"
          tone={shipped ? "shipped" : closed ? "closed" : "active"}
        />
        <div className="mt-2 flex items-center gap-3 text-[13px] text-muted">
          <span className={overdue ? "font-semibold text-accent" : ""}>{meta}</span>
          {commit.cheer_count > 0 && <span>🙌 {compact(commit.cheer_count)}</span>}
          {commit.join_count > 0 && <span>{compact(commit.join_count)} joined</span>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
    </Link>
  );
}
