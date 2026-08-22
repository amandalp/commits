import {
  cn,
  deadlineLabelTime,
  durationEndsLabel,
  durationLabel,
} from "@/lib/utils";
import type { Duration } from "@/lib/types";

const TEXT_SIZE = {
  sm: "text-[22px] leading-[1.12]",
  md: "text-[26px] leading-[1.1]",
  lg: "text-[32px] leading-[1.08]",
  xl: "text-[40px] leading-[1.05]",
};

const LEAD_SIZE = {
  sm: "text-[17px]",
  md: "text-[19px]",
  lg: "text-[22px]",
  xl: "text-[26px]",
};

const BY_SIZE = {
  sm: "text-[18px]",
  md: "text-[20px]",
  lg: "text-[24px]",
  xl: "text-[28px]",
};

/**
 * The defining object of the product:
 *   I'm going to
 *   [big handwritten commitment, hand-underlined]
 *   by [deadline + time in accent, hand-underlined]
 *
 * A commit framed as a span of time reads "for 30 days · ends Sep 21"
 * on that last line instead — same shape, same ink.
 *
 * The `.ink-hand` / `.hw-underline` / `.hw-underline-accent` hooks activate the
 * marker face and hand-drawn underlines only under the handwritten theme (see
 * globals.css). Used identically in the feed and on the commit detail page.
 */
export function CommitStructure({
  text,
  deadline,
  duration,
  size = "sm",
  tone = "active",
  className,
}: {
  text: string;
  deadline: string;
  /** When set the commitment reads "for 30 days" and the deadline is its end. */
  duration?: Duration | null;
  size?: keyof typeof TEXT_SIZE;
  tone?: "active" | "shipped" | "closed";
  className?: string;
}) {
  const lead =
    tone === "shipped" ? "I said I’d" : tone === "closed" ? "I committed to" : "I'm going to";

  return (
    <div className={cn("font-display", className)}>
      <span className={cn("ink-hand-light mb-1 block leading-none text-ink-soft", LEAD_SIZE[size])}>
        {lead}
      </span>
      <span
        className={cn(
          "commit-hw ink-hand hw-underline inline font-bold text-ink",
          TEXT_SIZE[size],
          tone === "closed" && "text-ink-soft"
        )}
      >
        {text}
      </span>
      <span className={cn("mt-2 block", BY_SIZE[size])}>
        <span className="ink-hand-light text-muted">{duration ? "for " : "by "}</span>
        <span
          className={cn(
            "ink-hand-light inline",
            tone === "active" ? "hw-underline-accent text-accent" : "text-muted"
          )}
        >
          {duration ? durationLabel(duration) : deadlineLabelTime(deadline)}
        </span>
        {duration && (
          <span className="ink-hand-light whitespace-nowrap text-muted">
            {" "}
            · ends {durationEndsLabel(deadline, duration.unit)}
          </span>
        )}
      </span>
    </div>
  );
}
