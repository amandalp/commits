import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getCommit, getUpdates, getJoiners } from "@/lib/data/commits";
import { getComments, getCommentCount } from "@/lib/data/comments";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { CommitStructure } from "@/components/CommitStructure";
import { CommitActions } from "@/components/CommitActions";
import { OwnerPanel } from "@/components/OwnerPanel";
import { UpdatesTimeline } from "@/components/UpdatesTimeline";
import { Comments } from "@/components/Comments";
import { ShipProof } from "@/components/ShipProof";
import { ShareButton } from "@/components/ShareButton";
import { CommitMenu } from "@/components/CommitMenu";
import { StatusBadge } from "@/components/ui";
import { timeAgo, deadlineLabel, deadlineFull, compact } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const commit = await getCommit(id, viewer?.id ?? null);
  if (!commit) notFound();

  const [updates, joiners, comments, commentCount] = await Promise.all([
    getUpdates(id),
    commit.join_count > 0 ? getJoiners(id) : Promise.resolve([]),
    getComments(id, viewer?.id ?? null, "newest"),
    getCommentCount(id),
  ]);

  const shipped = commit.status === "shipped";
  const closed = commit.status === "closed";

  return (
    <div>
      <TopBar
        right={
          <>
            <ShareButton commit={commit} />
            <CommitMenu commitId={commit.id} isOwner={commit.is_owner} />
          </>
        }
      />

      <div className="px-4 pb-8 sm:px-5">
        {/* author */}
        <div className="flex items-center gap-3 pt-3">
          <Link href={`/u/${commit.author.username}`}>
            <Avatar person={commit.author} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${commit.author.username}`}
              className="block font-semibold text-ink hover:underline"
            >
              {commit.author.name}
            </Link>
            <div className="text-[13px] text-muted">
              @{commit.author.username} · {timeAgo(commit.created_at)}
            </div>
          </div>
        </div>

        {commit.parent && (
          <Link
            href={`/commit/${commit.parent.id}`}
            className="mt-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink-soft"
          >
            ↪ Joined {commit.parent.author.name.split(" ")[0]}&apos;s Commit
          </Link>
        )}

        {/* commitment card */}
        <div className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <CommitStructure
              text={commit.text}
              deadline={commit.deadline}
              size="lg"
              tone={shipped ? "shipped" : closed ? "closed" : "active"}
            />
            {(shipped || closed) && (
              <StatusBadge kind={shipped ? "shipped" : "closed"} />
            )}
          </div>

          {shipped && commit.shipped_at && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-[13px] font-semibold text-success-strong">
              ✓ Shipped on {deadlineLabel(commit.shipped_at)}
            </div>
          )}

          {commit.context && (
            <p className="mt-4 whitespace-pre-wrap border-t border-border-soft pt-4 text-[15px] leading-relaxed text-ink-soft">
              {commit.context}
            </p>
          )}
        </div>

        {/* ship outcome */}
        {shipped && commit.ship && (commit.ship.text || commit.ship.media_url || commit.ship.link_url) && (
          <div className="mt-4">
            <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">What happened</h2>
            {commit.ship.text && (
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {commit.ship.text}
              </p>
            )}
            <ShipProof
              mediaUrl={commit.ship.media_url}
              linkUrl={commit.ship.link_url}
            />
          </div>
        )}

        {/* social summary */}
        <div className="mt-4 flex items-center gap-4 text-[14px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🙌</span>
            <span className="font-semibold text-ink">{compact(commit.cheer_count)}</span>
          </span>
          {commit.join_count > 0 && (
            <span className="flex items-center gap-2">
              <AvatarStack people={commit.joiners} />
              <span>{compact(commit.join_count)} joined</span>
            </span>
          )}
          {!shipped && !closed && (
            <span className="ml-auto text-[13px]">{deadlineFull(commit.deadline)}</span>
          )}
        </div>

        {/* primary actions */}
        <div className="mt-4">
          {commit.is_owner ? (
            !shipped && !closed ? (
              <OwnerPanel commit={commit} />
            ) : shipped ? (
              <div className="rounded-2xl border border-success-border bg-success-soft px-4 py-3 text-[14px] font-semibold text-success-strong">
                🎉 You shipped this. Nicely done.
              </div>
            ) : null
          ) : (
            <CommitActions commit={commit} size="detail" />
          )}
        </div>

        {/* joiners */}
        {joiners.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2.5 px-1 text-[15px] font-bold text-ink">
              {compact(commit.join_count)}{" "}
              {commit.join_count === 1 ? "person" : "people"} joined this Commit
            </h2>
            <div className="flex flex-wrap gap-2">
              {joiners.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${p.username}`}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3.5 hover:border-border-strong"
                >
                  <Avatar person={p} size="xs" />
                  <span className="text-[13px] font-medium text-ink">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* updates */}
        {updates.length > 0 && (
          <div className="mt-6">
            <UpdatesTimeline updates={updates} />
          </div>
        )}

        {/* comments */}
        {viewer && (
          <div className="mt-7">
            <Comments
              commitId={commit.id}
              viewer={viewer}
              initialComments={comments}
              totalCount={commentCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
