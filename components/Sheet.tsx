"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** A bottom sheet on mobile, centered dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  ariaLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Accessible name when `title` isn't a plain string. */
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-rise"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
        className={cn(
          "relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface p-5 pb-8 shadow-pop animate-rise sm:max-h-[88dvh] sm:rounded-3xl sm:pb-7",
          className
        )}
        style={{ animationDuration: "0.24s" }}
      >
        <div className="shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
              {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream-deep"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
