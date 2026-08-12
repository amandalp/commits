"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStyle } from "./ThemeStyle";

/** The "you said you'd do this — how did it go?" prompt above the feed. */
export function ResolveNudge({ href, count }: { href: string; count: number }) {
  const { hand } = useThemeStyle();

  const label =
    count > 1
      ? `${count} commitments to resolve`
      : hand
      ? "you said you'd do this — how did it go?"
      : "You have a commitment to resolve";

  return (
    <Link
      href={href}
      className={cn(
        "mx-4 mt-4 flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm transition",
        hand
          ? "border border-accent/50 bg-surface"
          : "border border-accent-soft bg-accent-soft"
      )}
    >
      {hand && <Sparkles className="h-[18px] w-[18px] shrink-0 text-accent" />}
      <span
        className={cn(
          "font-semibold text-accent-strong",
          hand && "ink-hand text-[18px] font-normal text-ink"
        )}
      >
        {label}
      </span>
      {hand ? (
        <ArrowRight className="ml-auto h-5 w-5 text-accent" />
      ) : (
        <span className="ml-auto font-semibold text-accent">How did it go? →</span>
      )}
    </Link>
  );
}
