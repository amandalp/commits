import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { countdown } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

/** The creator's follow-up panel on their own active commit. */
export function OwnerPanel({ commit }: { commit: CommitView }) {
  const cd = countdown(commit.deadline);
  if (!cd.overdue) return null;

  return (
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
  );
}
