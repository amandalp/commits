"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { Avatar } from "./Avatar";
import { Button } from "./ui";
import { cn } from "@/lib/utils";
import { searchPeople, getSuggestedPeople } from "@/lib/actions/loop";
import type { Person } from "@/lib/types";

/**
 * "Put someone in the loop" picker. Shows a searchable list of people; the
 * ones already selected are checked. Selection is controlled by the parent so
 * the chips on the create screen update live.
 */
export function AddPeopleSheet({
  open,
  onClose,
  selected,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  selected: Person[];
  onToggle: (person: Person) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggested, setSuggested] = useState<Person[] | null>(null);
  const [results, setResults] = useState<Person[] | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = new Set(selected.map((p) => p.id));
  const q = query.trim();

  // Focus the search field when the sheet opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  // Lazily load the "Recent" (people you follow) list the first time it opens.
  useEffect(() => {
    if (!open || suggested !== null) return;
    getSuggestedPeople().then(setSuggested);
  }, [open, suggested]);

  // Debounced search as the user types. Clearing the box just falls back to
  // the suggested list (see `list` below), so nothing to reset synchronously.
  useEffect(() => {
    if (!q) return;
    let active = true;
    const t = setTimeout(async () => {
      const list = await searchPeople(q);
      if (active) {
        setResults(list);
        setSearching(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  // Reset the query on close so the next open starts fresh. Runs in an event
  // handler (not an effect), so it never causes cascading renders.
  function handleClose() {
    setQuery("");
    setSearching(false);
    onClose();
  }

  const list = q ? results : suggested;
  const heading = q ? "Results" : "Recent";
  const waiting = q ? searching || results === null : suggested === null;

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Put someone in the loop"
      subtitle="They'll be told you said this — it doesn't make them responsible for it."
    >
      {/* Search field — leading magnifier, matches the app's input convention. */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 py-2.5 focus-within:border-accent">
        <Search className="h-[18px] w-[18px] shrink-0 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearching(e.target.value.trim().length > 0);
          }}
          placeholder="Search people"
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="mt-4 min-h-[8rem]">
        <p className="mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-faint">
          {heading}
        </p>

        {waiting ? (
          <p className="py-8 text-center text-sm text-muted">
            {q ? "Searching…" : "Loading…"}
          </p>
        ) : !list || list.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {q ? "No one found." : "Follow people to see them here — or search above."}
          </p>
        ) : (
          <div className="max-h-[46vh] space-y-0.5 overflow-y-auto">
            {list.map((p) => {
              const on = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-cream-deep"
                >
                  <Avatar person={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{p.name}</div>
                    <div className="truncate text-[13px] text-muted">@{p.username}</div>
                  </div>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                      on
                        ? "border-accent bg-accent text-white"
                        : "border-border-strong text-transparent"
                    )}
                    aria-hidden
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button full size="lg" className="mt-5" onClick={handleClose}>
        {selected.length > 0 ? `Done · ${selected.length} in the loop` : "Done"}
      </Button>
    </Sheet>
  );
}
