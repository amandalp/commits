import { AvatarStack } from "./Avatar";
import { cn, compact } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

/**
 * "[avatars] N watching": the trailing social-proof cluster on a commit,
 * shown beside the heart/comment/share row. Renders nothing when no one is
 * watching yet.
 */
export function WatchingProof({
  commit,
  className,
}: {
  commit: CommitView;
  className?: string;
}) {
  if (commit.watch_count <= 0) return null;
  return (
    <span className={cn("flex shrink-0 items-center gap-2 text-[13px] text-muted", className)}>
      {commit.watchers.length > 0 && <AvatarStack people={commit.watchers} size="xs" />}
      <span>{compact(commit.watch_count)} watching</span>
    </span>
  );
}
