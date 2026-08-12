import { cn, deadlineLabel } from "@/lib/utils";

const TEXT_SIZE = {
  sm: "text-[22px] leading-[1.12]",
  md: "text-[26px] leading-[1.1]",
  lg: "text-[32px] leading-[1.08]",
  xl: "text-[40px] leading-[1.05]",
};

const BY_SIZE = {
  sm: "text-[22px]",
  md: "text-[26px]",
  lg: "text-[32px]",
  xl: "text-[40px]",
};

/**
 * The defining object of the product:
 *   I'm going to
 *   [big bold commitment]
 *   by [deadline in accent]
 *
 * The `.ink-hand` / `.hw-underline` hooks activate the marker face and
 * hand-drawn underlines only under the handwritten theme (see globals.css).
 */
export function CommitStructure({
  text,
  deadline,
  size = "sm",
  tone = "active",
  className,
}: {
  text: string;
  deadline: string;
  size?: keyof typeof TEXT_SIZE;
  tone?: "active" | "shipped" | "closed";
  className?: string;
}) {
  const lead = tone === "active" ? "I'm going to" : "Committed to";
  return (
    <div className={cn("font-display", className)}>
      <span className="mb-1.5 block text-[13px] font-medium tracking-normal text-muted">
        {lead}
      </span>
      <span
        className={cn(
          "commit-hw ink-hand hw-underline inline-block font-bold text-ink",
          TEXT_SIZE[size],
          tone === "closed" && "text-ink-soft"
        )}
      >
        {text}
      </span>
      <span
        className={cn(
          "mt-1 block font-bold",
          BY_SIZE[size],
          tone === "shipped" ? "text-muted" : "text-accent"
        )}
      >
        <span className="font-normal text-muted">by </span>
        <span className="ink-hand">{deadlineLabel(deadline)}</span>
      </span>
    </div>
  );
}
