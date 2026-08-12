"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { MentionText } from "./MentionText";
import { cn, timeAgo, compact } from "@/lib/utils";
import { addComment, toggleCommentLike } from "@/lib/actions/social";
import type { CommentView, Person } from "@/lib/types";

export function Comments({
  commitId,
  viewer,
  initialComments,
  authorUsername,
}: {
  commitId: string;
  viewer: Person;
  initialComments: CommentView[];
  authorUsername: string;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  // Render directly from server truth; router.refresh() re-supplies props.
  const comments = initialComments;
  const ordered = sort === "newest" ? comments : [...comments].reverse();

  return (
    <section id="comments">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold text-ink">Support</h2>
        {comments.length > 1 && (
          <button
            onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
            className="text-[13px] font-medium text-muted hover:text-ink"
          >
            {sort === "newest" ? "Newest" : "Oldest"} ▾
          </button>
        )}
      </div>

      <Composer
        commitId={commitId}
        viewer={viewer}
        placeholder={`share support with ${authorUsername}…`}
        onPosted={() => router.refresh()}
      />

      <div className="mt-4 space-y-4 pl-[7px]">
        {ordered.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-muted">
            No comments yet. Say something encouraging.
          </p>
        ) : (
          ordered.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              commitId={commitId}
              viewer={viewer}
              onChange={() => router.refresh()}
            />
          ))
        )}
      </div>
    </section>
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
  viewer: Person;
  onChange: () => void;
  isReply?: boolean;
}) {
  const [liked, setLiked] = useState(comment.viewer_liked);
  const [likes, setLikes] = useState(comment.like_count);
  const [replying, setReplying] = useState(false);

  function like() {
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
          {!isReply && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-[12.5px] font-medium text-muted hover:text-ink"
            >
              Reply
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2">
            <Composer
              commitId={commitId}
              viewer={viewer}
              parentCommentId={comment.id}
              placeholder={`Reply to ${comment.author.name.split(" ")[0]}…`}
              compact
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
  viewer,
  parentCommentId,
  placeholder = "Send a comment…",
  compact: isCompact,
  onPosted,
}: {
  commitId: string;
  viewer: Person;
  parentCommentId?: string;
  placeholder?: string;
  compact?: boolean;
  onPosted: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

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
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full border border-border bg-cream-deep pr-1.5",
        isCompact ? "pl-4" : "pl-1.5"
      )}
    >
      {!isCompact && <Avatar person={viewer} size="sm" />}
      <input
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
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
  );
}
