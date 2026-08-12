"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

/** Sticky sub-page header with a back (or close) affordance. */
export function TopBar({
  title,
  variant = "back",
  right,
  fallbackHref = "/",
}: {
  title?: string;
  variant?: "back" | "close";
  right?: React.ReactNode;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const Icon = variant === "close" ? X : ArrowLeft;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border-soft bg-cream/90 px-2 backdrop-blur-md">
      <button
        onClick={goBack}
        aria-label={variant === "close" ? "Close" : "Back"}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-cream-deep"
      >
        <Icon className="h-5 w-5" />
      </button>
      {title && <h1 className="text-[17px] font-bold text-ink">{title}</h1>}
      <div className="ml-auto flex items-center gap-1 pr-1">{right}</div>
    </header>
  );
}
