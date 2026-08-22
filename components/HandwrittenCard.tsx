import { Heart, MessageCircle, Send } from "lucide-react";
import { CommitStructure } from "./CommitStructure";
import { avatarColor, initials } from "@/lib/utils";
import type { Duration, Person } from "@/lib/types";

/**
 * The login hero card. A left-justified commit note that mirrors the feed /
 * commit-page card exactly (same `CommitStructure`: handwritten "I'm going to"
 * and "by <date>", hand-drawn underlines), wrapped in the tilted, shadowed
 * frame from the login page.
 */

const LIKE = "#e0245e";

// A few faces for the decorative "watching" stack.
const WATCHERS = ["/demo/p2.jpg", "/demo/p3.jpg", "/demo/p4.jpg"];

export function HandwrittenCard({
  text,
  deadline,
  duration,
  author,
}: {
  text: string;
  deadline: string;
  duration?: Duration | null;
  author: Person;
}) {
  return (
    <div className="rounded-3xl bg-surface px-5 py-5 text-left ring-1 ring-border">
      {/* author */}
      <div className="flex items-center gap-3">
        {author.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar_url}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: avatarColor(author.id || author.name) }}
          >
            {initials(author.name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="font-bold text-ink">{author.name}</div>
          <div className="text-[13px] text-muted">@{author.username} · committed 22h ago</div>
        </div>
      </div>

      {/* the promise — identical treatment to the feed and commit pages */}
      <div className="mt-4">
        <CommitStructure text={text} deadline={deadline} duration={duration} size="md" />
      </div>

      {/* engagement row */}
      <div className="mt-5 flex items-center gap-3 text-muted">
        <span className="flex items-center gap-1.5 text-[13px] font-medium">
          <Heart className="h-[19px] w-[19px]" style={{ fill: LIKE, color: LIKE }} />
          24
        </span>
        <span className="flex items-center gap-1.5 text-[13px] font-medium">
          <MessageCircle className="h-[19px] w-[19px]" strokeWidth={2} />1
        </span>
        <Send className="h-[18px] w-[18px]" strokeWidth={2} />
        <span className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="flex -space-x-2">
            {WATCHERS.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-6 w-6 rounded-full object-cover ring-2 ring-surface"
              />
            ))}
          </span>
          3 watching
        </span>
      </div>
    </div>
  );
}
