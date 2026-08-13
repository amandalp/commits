import { Avatar } from "./Avatar";
import { deadlineLabel } from "@/lib/utils";
import type { Person } from "@/lib/types";

/**
 * The branded, screenshot-ready share card. Unmistakably Commits:
 * cream field, big commitment, accent deadline, "Hold me to it →".
 * Type scales with the card's width (container query units) so it fits
 * cleanly whether rendered tiny on the login screen or large in a sheet.
 */
export function ShareCard({
  text,
  deadline,
  author,
  shipped,
}: {
  text: string;
  deadline: string;
  author: Person;
  shipped?: boolean;
}) {
  return (
    <div
      style={{ containerType: "inline-size" }}
      className="aspect-[4/5] w-full overflow-hidden rounded-3xl bg-cream ring-1 ring-border"
    >
      <div
        className="flex h-full flex-col"
        style={{ padding: "7cqi" }}
      >
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "5.5cqi" }} className="font-extrabold tracking-tight text-ink">
            Commits
          </span>
          {shipped ? (
            <span
              style={{ fontSize: "3cqi" }}
              className="rounded-full bg-success-soft px-2.5 py-1 font-bold tracking-wide text-success-strong"
            >
              SHIPPED ✓
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center py-[4cqi]">
          <div style={{ fontSize: "3.4cqi", letterSpacing: "0.12em" }} className="font-bold text-muted">
            {shipped ? "I SAID I’D" : "I'M GOING TO"}
          </div>
          <div
            style={{ fontSize: "9cqi", lineHeight: 1.04 }}
            className="mt-[2cqi] font-display font-bold text-ink"
          >
            {text}
          </div>
          <div
            style={{ fontSize: "3.4cqi", letterSpacing: "0.12em" }}
            className="mt-[4cqi] font-bold text-muted"
          >
            BY
          </div>
          <div style={{ fontSize: "7cqi" }} className="mt-[1cqi] font-display font-bold text-accent">
            {deadlineLabel(deadline)}
          </div>
        </div>

        <div className="flex items-center gap-[2.5cqi]">
          <Avatar person={author} size="sm" />
          <div className="min-w-0">
            <div style={{ fontSize: "3.6cqi" }} className="truncate font-semibold text-ink">
              {author.name}
            </div>
            <div style={{ fontSize: "3cqi" }} className="truncate text-muted">
              @{author.username}
            </div>
          </div>
          <span
            style={{ fontSize: "3.4cqi" }}
            className={
              shipped
                ? "ml-auto shrink-0 font-semibold text-success-strong"
                : "ml-auto shrink-0 font-semibold text-accent"
            }
          >
            {shipped ? "said it. did it." : "Hold me to it →"}
          </span>
        </div>
      </div>
    </div>
  );
}
