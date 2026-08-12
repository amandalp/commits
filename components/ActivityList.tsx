import Link from "next/link";
import { Calendar, UserPlus, MessageCircle, Eye } from "lucide-react";
import { Avatar } from "./Avatar";
import { EmptyState } from "./ui";
import { Bell } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationView } from "@/lib/types";

function actorNames(n: NotificationView): string {
  const first = n.actors[0]?.name ?? "Someone";
  const others = Math.max(0, n.actors.length - 1) + n.extra_count;
  if (others <= 0) return first;
  if (others === 1 && n.actors[1]) return `${first} and ${n.actors[1].name}`;
  return `${first} and ${others} other${others === 1 ? "" : "s"}`;
}

function phrase(n: NotificationView): { verb: string; emoji?: string } {
  switch (n.type) {
    case "cheer":
      return { verb: "cheered your commit", emoji: "🙌" };
    case "watch":
      return { verb: "is watching your commit", emoji: "👀" };
    case "join":
      return { verb: "joined your commit", emoji: "🙌" };
    case "comment":
      return { verb: "commented on your commit", emoji: "💬" };
    case "comment_reply":
      return { verb: "replied to your comment", emoji: "💬" };
    case "follow":
      return { verb: "followed you" };
    case "deadline":
      return { verb: "is due soon" };
    case "shipped":
      return { verb: "shipped a commit you follow", emoji: "🎉" };
    case "update":
      return { verb: "posted an update", emoji: "✏️" };
    case "not_yet":
      return { verb: "moved a deadline" };
  }
}

function Icon({ n }: { n: NotificationView }) {
  const base = "flex h-9 w-9 items-center justify-center rounded-full shrink-0";
  if (n.type === "deadline")
    return (
      <span className={cn(base, "bg-warn-soft text-warn")}>
        <Calendar className="h-[18px] w-[18px]" />
      </span>
    );
  if (n.type === "follow")
    return (
      <span className={cn(base, "bg-accent-soft text-accent")}>
        <UserPlus className="h-[18px] w-[18px]" />
      </span>
    );
  if (n.type === "watch")
    return (
      <span className={cn(base, "bg-accent-soft text-accent")}>
        <Eye className="h-[18px] w-[18px]" />
      </span>
    );
  if (n.type === "comment" || n.type === "comment_reply")
    return (
      <span className={cn(base, "bg-accent-soft text-accent")}>
        <MessageCircle className="h-[18px] w-[18px]" />
      </span>
    );
  return null;
}

function Row({ n }: { n: NotificationView }) {
  const { verb, emoji } = phrase(n);
  const actor = n.actors[0] ?? n.actor;
  const href =
    n.type === "follow" && actor
      ? `/u/${actor.username}`
      : n.commit_id
      ? `/commit/${n.commit_id}`
      : "#";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 border-b border-border-soft px-4 py-3.5 transition hover:bg-surface-muted sm:px-5",
        !n.read && "bg-accent-soft/40"
      )}
    >
      {actor ? (
        <div className="relative shrink-0">
          <Avatar person={actor} size="md" />
          <span className="absolute -bottom-1 -right-1">
            <Icon n={n} />
          </span>
        </div>
      ) : (
        <Icon n={n} />
      )}

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[14.5px] leading-snug text-ink">
          {n.type === "deadline" ? (
            <>
              <span className="font-semibold">Your commit</span> {verb}
            </>
          ) : (
            <>
              <span className="font-semibold">{actorNames(n)}</span> {verb}
            </>
          )}{" "}
          {emoji}
        </p>
        {n.commit_text && (
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {n.type === "comment" || n.type === "comment_reply"
              ? n.comment_text
              : `“${n.commit_text}”`}
          </p>
        )}
        <p className="mt-0.5 text-[12px] text-faint">{timeAgo(n.created_at)}</p>
      </div>

      {!n.read && (
        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
      )}
    </Link>
  );
}

export function ActivityList({ notifications }: { notifications: NotificationView[] }) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-6 w-6" />}
        title="No activity yet"
        body="Cheers, joins, comments and deadline reminders will show up here."
      />
    );
  }
  return (
    <div className="animate-rise">
      {notifications.map((n) => (
        <Row key={n.id} n={n} />
      ))}
    </div>
  );
}
