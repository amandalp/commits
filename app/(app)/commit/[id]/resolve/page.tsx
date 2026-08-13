import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { getViewerId } from "@/lib/data/session";
import { getCommit } from "@/lib/data/commits";
import { TopBar } from "@/components/TopBar";
import { CommitStructure } from "@/components/CommitStructure";

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

  return (
    <div>
      <TopBar variant="close" fallbackHref={`/commit/${id}`} />
      <div className="px-5 pb-10 pt-4">
        <h1 className="ink-hand font-display text-[30px] font-bold text-ink">
          did you do it?
        </h1>
        <p className="mt-2 text-[13px] font-medium text-muted">You said you’d:</p>
        <div className="mt-3 rounded-3xl border border-border bg-surface p-5">
          <CommitStructure text={commit.text} deadline={commit.deadline} size="md" />
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href={`/commit/${id}/ship`}
            className="flex items-center gap-4 rounded-3xl border border-success-border bg-success-soft p-5 transition hover:brightness-[0.98] active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-bold text-ink">I did it</span>
              <span className="block text-[14px] text-success-strong">share the win</span>
            </span>
          </Link>

          <Link
            href={`/commit/${id}/not-yet`}
            className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 transition hover:border-border-strong active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep text-ink-soft">
              <Clock className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-bold text-ink">Not yet</span>
              <span className="block text-[14px] text-muted">Need more time</span>
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
