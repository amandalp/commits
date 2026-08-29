"use client";

import { useState } from "react";
import { SectionHeader } from "./ui";
import { cn } from "@/lib/utils";
import { OPEN_FILTER_COOKIE, type OpenFilter } from "@/lib/prefs";

/**
 * The Open list, with one quiet way to narrow it:
 *
 *   All · Big moves · Everyday
 *
 * A long run of big moves buries the everyday ones, so there has to be a way
 * through — but this is a preference, not navigation. Plain words, a thin
 * underline under the chosen one, no pills and no counts. It sits only under
 * Open (Done has its own two groupings) and only appears when both kinds are
 * actually on the list; with one kind there is nothing to choose between.
 *
 * Narrowing to one kind drops that section's header — the choice above already
 * says which list you're looking at.
 *
 * The choice is remembered in a cookie rather than localStorage so the server
 * renders the right list first time, with no flash of the full list on load.
 */
export function OpenList({
  initial,
  bigMoves,
  everyday,
  hasBigMoves,
  hasEveryday,
}: {
  /** The remembered choice, read from the cookie on the server. */
  initial: OpenFilter;
  /** Already-rendered rows or cards — this component only decides what shows. */
  bigMoves: React.ReactNode;
  everyday: React.ReactNode;
  hasBigMoves: boolean;
  hasEveryday: boolean;
}) {
  const [stored, setStored] = useState<OpenFilter>(initial);

  // Nothing to choose between until both kinds are on the list. The remembered
  // choice is kept, just not acted on — it comes back when the other kind does.
  const choosable = hasBigMoves && hasEveryday;
  const choice: OpenFilter = choosable ? stored : "all";

  function pick(next: OpenFilter) {
    setStored(next);
    document.cookie = `${OPEN_FILTER_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  const showBig = hasBigMoves && choice !== "everyday";
  const showEveryday = hasEveryday && choice !== "big";
  const headers = choice === "all";

  return (
    <div>
      {choosable && (
        <div className="flex items-center gap-2 px-4 pt-3.5 text-[13.5px] sm:px-5">
          <Choice label="All" on={choice === "all"} onPick={() => pick("all")} />
          <Dot />
          <Choice label="Big moves" on={choice === "big"} onPick={() => pick("big")} />
          <Dot />
          <Choice
            label="Everyday"
            on={choice === "everyday"}
            onPick={() => pick("everyday")}
          />
        </div>
      )}

      <div className="animate-rise">
        {showBig && (
          <section>
            {headers && <SectionHeader label="Big moves" />}
            {bigMoves}
          </section>
        )}
        {showEveryday && (
          <section>
            {headers && <SectionHeader label="Everyday" />}
            {everyday}
          </section>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="text-faint">·</span>;
}

function Choice({
  label,
  on,
  onPick,
}: {
  label: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={cn(
        "ink-hand-light transition-colors",
        on ? "pick-underline font-medium text-accent" : "text-muted hover:text-ink-soft"
      )}
    >
      {label}
    </button>
  );
}
