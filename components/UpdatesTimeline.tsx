import { Avatar } from "./Avatar";
import { ShipProof } from "./ShipProof";
import { timeAgo } from "@/lib/utils";
import type { UpdateView } from "@/lib/types";

/** Progress updates on a commit detail page (newest first). */
export function UpdatesTimeline({ updates }: { updates: UpdateView[] }) {
  if (updates.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 px-1 text-[15px] font-bold text-ink">Updates</h2>
      <div className="space-y-4">
        {updates.map((u) => (
          <div key={u.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar person={u.author} size="sm" />
              <div className="mt-1 w-px flex-1 bg-border-soft" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  @{u.author.username}
                </span>
                <span className="text-[13px] text-muted">
                  {u.kind === "not_yet" ? "moved the goalposts" : "posted an update"}{" "}
                  · {timeAgo(u.created_at)}
                </span>
              </div>
              {u.text && (
                <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                  {u.text}
                </p>
              )}
              <ShipProof mediaUrl={u.media_url} linkUrl={u.link_url} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
