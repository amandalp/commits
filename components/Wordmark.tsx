"use client";

import { cn } from "@/lib/utils";
import { useThemeStyle } from "./ThemeStyle";

/**
 * The Commits wordmark. Renders "commits." in the marker face when the
 * handwritten theme is on, otherwise the clean "Commits".
 */
export function Wordmark({ className }: { className?: string }) {
  const { hand } = useThemeStyle();
  return (
    <span className={cn("wordmark", className)}>
      {hand ? "commits." : "Commits"}
    </span>
  );
}
