"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { ShipProof } from "./ShipProof";
import { MentionText } from "./MentionText";
import { useMentions, MentionMenu } from "./mentions";
import { cn, timeAgo, compact } from "@/lib/utils";
import { addComment, toggleCommentLike } from "@/lib/actions/social";
import type { CommentView, UpdateView, Person } from "@/lib/types";

/**
 * One promise, one evolving conversation. Creator updates, the shipped
 * outcome, and everyone's replies live in a single chronological thread —
 * no separate "updates" vs "support" systems.
 */
type ThreadItem =
  | { key: string; at: string; kind: "comment"; comment: CommentView }
  | { key: string; at: string; kind: "update"; update: UpdateView };

export function Conversation({
  commitId,
  viewer,
  comments,
  updates,
  ship,
  authorId,
}: {
  commitId: string;
  viewer: Person | null;
  comments: CommentView[];
  updates: UpdateView[];
  ship: UpdateView | null;
  authorId: string;
}) {
  const router = useRouter();

  const items: ThreadItem[] = [
    ...comments.map((c) => ({
      key: `c-${c.id}`,
      at: c.created_at,
      kind: "comment" as const,
      comment: c,
    })),
    ...[...updates, ...(ship ? [ship] : [])].map((u) => ({
      key: `u-${u.id}`,
      at: u.created_at,
      kind: "update" as const,
      update: u,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)); // newest first

  return (
    <section id="conversation">
      {viewer && (
        <Composer
          commitId={commitId}
          placeholder="say something…"
          onPosted={() => router.refresh()}
        />
      )}

      <div className="mt-5 space-y-5">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Be the first to say something.
          </p>
        ) : (
          items.map((item) =>
            item.kind === "update" ? (
              <UpdateItem key={item.key} update={item.update} isAuthor={item.update.author.id === authorId} />
            ) : (
              <CommentItem
                key={item.key}
                comment={item.comment}
                commitId={commitId}
                viewer={viewer}
                onChange={() => router.refresh()}
              />
            )
          )
        )}
      </div>
    </section>
  );
}

/** A creator post in the thread — a progress update, or the shipped outcome. */
function UpdateItem({ update, isAuthor }: { update: UpdateView; isAuthor: boolean }) {
  const shipped = update.kind === "ship";
  const label =
    update.kind === "ship"
      ? "said it. did it."
      : update.kind === "not_yet"
      ? "gave it more time"
      : "shared an update";

  return (
    <div className="flex gap-3">
      <Link href={`/u/${update.author.username}`} className="shrink-0">
        <Avatar person={update.author} size="sm" />
      </Link>
      <div
        className={cn(
          "min-w-0 flex-1",
          shipped && "rounded-2xl border border-success-border bg-success-soft/40 px-4 py-3"
        )}
      >
        <div className="flex items-baseline gap-2">
          <Link
            href={`/u/${update.author.username}`}
            className="text-sm font-semibold text-ink hover:underline"
          >
            @{update.author.username}
          </Link>
          <span
            className={cn(
              "text-[12px]",
              shipped ? "font-semibold text-success-strong" : "text-muted"
            )}
          >
            {isAuthor ? label : "replied"} · {timeAgo(update.created_at)}
          </span>
        </div>
        {update.text && (
          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-snug text-ink-soft">
            <MentionText text={update.text} />
          </p>
        )}
        <ShipProof mediaUrl={update.media_url} linkUrl={update.link_url} />
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  commitId,
  viewer,
  onChange,
  isReply,
}: {
  comment: CommentView;
  commitId: string;
  viewer: Person | null;
  onChange: () => void;
  isReply?: boolean;
}) {
  const [liked, setLiked] = useState(comment.viewer_liked);
  const [likes, setLikes] = useState(comment.like_count);
  const [replying, setReplying] = useState(false);

  function like() {
    if (!viewer) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    toggleCommentLike(comment.id, commitId).then((r) => {
      if (!r.ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }

  return (
    <div className="flex gap-3">
      <Link href={`/u/${comment.author.username}`} className="shrink-0">
        <Avatar person={comment.author} size={isReply ? "xs" : "sm"} />
      </Link>
      <div className="min-w-0 flex-1">
        <div>
          <div className="flex items-baseline gap-2">
            <Link
              href={`/u/${comment.author.username}`}
              className="text-sm font-semibold text-ink hover:underline"
            >
              @{comment.author.username}
            </Link>
            <span className="text-[12px] text-muted">
              {timeAgo(comment.created_at)}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-snug text-ink-soft">
            <MentionText text={comment.text} />
          </p>
        </div>
        <div className="mt-1 flex items-center gap-4 pl-1.5">
          <button
            onClick={like}
            disabled={!viewer}
            className={cn(
              "flex items-center gap-1 text-[12.5px] font-medium transition",
              liked ? "text-[#d1477a]" : "text-muted hover:text-ink"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", liked && "fill-[#d1477a]")}
              strokeWidth={2.2}
            />
            {likes > 0 && compact(likes)}
          </button>
          {!isReply && viewer && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-[12.5px] font-medium text-muted hover:text-ink"
            >
              Reply
            </button>
          )}
        </div>

        {replying && viewer && (
          <div className="mt-2">
            <Composer
              commitId={commitId}
              parentCommentId={comment.id}
              placeholder={`Reply to ${comment.author.name.split(" ")[0]}…`}
              onPosted={() => {
                setReplying(false);
                onChange();
              }}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-border-soft pl-3">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                commitId={commitId}
                viewer={viewer}
                onChange={onChange}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({
  commitId,
  parentCommentId,
  placeholder = "say something…",
  onPosted,
}: {
  commitId: string;
  parentCommentId?: string;
  placeholder?: string;
  onPosted: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const mentions = useMentions({ elRef: ref, value: text, onValueChange: setText });

  async function submit() {
    if (!text.trim() || pending) return;
    setPending(true);
    const res = await addComment(commitId, text, parentCommentId ?? null);
    setPending(false);
    if (res.ok) {
      setText("");
      onPosted();
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-full border border-border bg-cream-deep px-4 pr-1.5">
        <input
          ref={ref}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            mentions.detect();
          }}
          onKeyUp={mentions.detect}
          onClick={mentions.detect}
          onKeyDown={(e) => {
            if (mentions.onKeyDown(e)) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onBlur={mentions.close}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-faint"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || pending}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white transition disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {mentions.open && (
        <MentionMenu
          items={mentions.items}
          active={mentions.active}
          onChoose={mentions.choose}
        />
      )}
    </div>
  );
}
