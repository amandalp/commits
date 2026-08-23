import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getCommit, getJoiners, getUpdates } from "@/lib/data/commits";
import { getComments } from "@/lib/data/comments";
import { getCheckIns } from "@/lib/data/checkins";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { CommitStructure } from "@/components/CommitStructure";
import { CommitActions } from "@/components/CommitActions";
import { CheckInTracker } from "@/components/CheckInTracker";
import { WatchingProof } from "@/components/WatchingProof";
import { OwnerComposer } from "@/components/OwnerComposer";
import { Conversation } from "@/components/Conversation";
import { MediaGallery } from "@/components/MediaGallery";
import { CommitMenu } from "@/components/CommitMenu";
import { MentionText } from "@/components/MentionText";
import { StatusBadge } from "@/components/ui";
import { timeAgo, deadlineLabel, compact } from "@/lib/utils";

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

  const [joiners, comments, updates, checkIns] = await Promise.all([
    commit.join_count > 0 ? getJoiners(id) : Promise.resolve([]),
    getComments(id, viewer?.id ?? null, "newest"),
    getUpdates(id),
    commit.repeat_days?.length ? getCheckIns(id) : Promise.resolve([]),
  ]);

  const shipped = commit.status === "shipped";
  const closed = commit.status === "closed";

  return (
    <div>
      <TopBar
        right={<CommitMenu commitId={commit.id} isOwner={commit.is_owner} />}
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
              className="block truncate font-semibold text-ink hover:underline"
            >
              @{commit.author.username}
            </Link>
            <div className="text-[13px] text-muted">committed {timeAgo(commit.created_at)}</div>
          </div>
          {(shipped || closed) && (
            <StatusBadge kind={shipped ? "shipped" : "closed"} />
          )}
        </div>

        {commit.parent && (
          <div className="mt-3 inline-flex items-center gap-1 text-[13px] text-muted">
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
        )}

        {/* the promise itself — light hero, no task-card chrome */}
        <div className="mt-5">
          <CommitStructure
            text={commit.text}
            deadline={commit.deadline}
            duration={commit.duration}
            tone={shipped ? "shipped" : closed ? "closed" : "active"}
            size="lg"
          />

          {shipped && commit.shipped_at && (
            <div className="mt-3 flex items-center gap-2">
              <span className="ink-hand text-[15px] font-semibold text-success-strong">
                said it. did it.
              </span>
              <span className="text-[12.5px] text-muted">
                · shipped {deadlineLabel(commit.shipped_at)}
              </span>
            </div>
          )}

          {commit.context && (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
              <MentionText text={commit.context} />
            </p>
          )}

          {commit.media_urls.length > 0 && (
            <div className="mt-4">
              <MediaGallery urls={commit.media_urls} />
            </div>
          )}

          {commit.looped_in.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-muted">in the loop:</span>
              {commit.looped_in.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${p.username}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-0.5 pl-0.5 pr-3 hover:border-border-strong"
                >
                  <Avatar person={p} size="xs" />
                  <span className="text-[13px] font-medium text-ink">{p.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* actions — the same heart · comment · send row everywhere, with the
            joined stack and deadline alongside it. */}
        <div className="mt-5 flex items-center gap-4">
          <CommitActions commit={commit} />
          {commit.join_count > 0 && (
            <span className="flex items-center gap-2 text-[14px] text-muted">
              <AvatarStack people={commit.joiners} />
              <span>{compact(commit.join_count)} joined</span>
            </span>
          )}
          <WatchingProof commit={commit} className="ml-auto" />
        </div>

        {/* the tracker for a repeating commit — one calendar, one promise */}
        {commit.repeat_days?.length ? (
          <div className="mt-5">
            <CheckInTracker
              commitId={commit.id}
              createdAt={commit.created_at}
              deadline={commit.deadline}
              repeatDays={commit.repeat_days}
              checkIns={checkIns}
              isOwner={commit.is_owner}
              resolved={shipped || closed}
            />
          </div>
        ) : null}

        {/* the creator's control, directly beneath the promise */}
        {commit.is_owner && !shipped && !closed && (
          <div className="mt-6">
            <OwnerComposer
              commitId={commit.id}
              text={commit.text}
              originalDeadline={commit.original_deadline}
            />
          </div>
        )}

        {/* one promise, one evolving conversation */}
        <div className="mt-7 border-t border-border-soft pt-6">
          <Conversation
            commitId={commit.id}
            viewer={viewer}
            comments={comments}
            updates={updates}
            ship={commit.ship ?? null}
            authorId={commit.author.id}
          />
        </div>

        {/* who joined — secondary social proof */}
        {joiners.length > 0 && (
          <div className="mt-8">
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
      </div>
    </div>
  );
}
