"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Wordmark } from "./Wordmark";

const KEY = "commits:intro_dismissed";

/**
 * Whether this visitor has waved the introduction away, read straight from
 * localStorage. An external store rather than effect-driven state, so the band
 * never renders and then vanishes for someone who already dismissed it.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function isDismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** The server can't know, so it assumes dismissed and the band fades in. */
const dismissedOnServer = () => true;

function dismiss() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked, so the band just comes back next visit */
  }
  listeners.forEach((fn) => fn());
}

/**
 * The compact introduction above the public feed. First-time visitors get one
 * line explaining what this is and a way in; the feed itself does the selling,
 * so the band collapses for good once dismissed.
 */
export function GuestIntro() {
  const hidden = useSyncExternalStore(subscribe, isDismissed, dismissedOnServer);
  if (hidden) return null;

  return (
    <div className="relative border-b border-border-soft bg-cream-deep/60 px-4 py-3.5 animate-rise sm:px-5">
      <button
        onClick={dismiss}
        aria-label="Dismiss introduction"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-cream-deep hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-8">
        <p className="text-[19px] font-extrabold leading-none tracking-tight text-ink">
          <Wordmark />
        </p>
        <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">
          Say what you&apos;re going to do, out loud, with a deadline. People
          cheer you on, and notice when you ship.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Link
            href="/start"
            className="ink-hand text-[19px] font-semibold text-accent hover:underline"
          >
            make a commit →
          </Link>
          <Link href="/welcome" className="text-[13.5px] text-muted hover:text-ink">
            How it works
          </Link>
        </div>
      </div>
    </div>
  );
}
