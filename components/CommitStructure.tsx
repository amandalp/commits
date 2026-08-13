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
  hero = false,
  className,
}: {
  text: string;
  deadline: string;
  size?: keyof typeof TEXT_SIZE;
  tone?: "active" | "shipped" | "closed";
  /** Hero treatment: the commitment reads in a strong humanist sans, and only
   *  the connective words ("I'm going to", "by") stay handwritten — better
   *  scanning, personality kept where it counts. */
  hero?: boolean;
  className?: string;
}) {
  const lead =
    tone === "shipped"
      ? "I said I’d"
      : tone === "closed"
      ? "Committed to"
      : hero
      ? "I'm going to"
      : "I want to";

  if (hero) {
    return (
      <div className={cn("font-display", className)}>
        <span className="ink-hand block text-[22px] leading-none text-ink-soft">
          {lead}
        </span>
        <span
          className={cn(
            "commit-hw hw-underline mt-2.5 inline-block font-sans text-[33px] font-extrabold leading-[1.16] tracking-tight text-ink",
            tone === "closed" && "text-ink-soft line-through decoration-1"
          )}
        >
          {text}
        </span>
        <span className="mt-3 block text-[26px] font-bold">
          <span className="ink-hand font-normal text-ink-soft">by </span>
          <span className={tone === "shipped" ? "text-muted" : "text-accent"}>
            {deadlineLabel(deadline)}
          </span>
        </span>
      </div>
    );
  }

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
