"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { searchPeople, getSuggestedPeople } from "@/lib/actions/loop";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

// The @token immediately before the caret: an @ at a word boundary followed by
// up to 30 handle characters. Empty (just "@") is allowed — we show follows.
const TOKEN = /(?:^|\s)@([A-Za-z0-9_]{0,30})$/;

type TextEl = HTMLInputElement | HTMLTextAreaElement;

/**
 * Shared @mention autocomplete logic for any text field (input or textarea).
 * Attach the returned handlers to the element and render <MentionMenu> from the
 * returned state. Handles token detection, debounced search, keyboard nav, and
 * caret restoration after insertion.
 */
export function useMentions({
  elRef,
  value,
  onValueChange,
  maxLength,
}: {
  elRef: React.RefObject<TextEl | null>;
  value: string;
  onValueChange: (value: string) => void;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Person[]>([]);
  const [active, setActive] = useState(0);

  const token = useRef<{ start: number; end: number } | null>(null);
  const lastQuery = useRef<string | null>(null);
  const suppressed = useRef(false); // set on Escape, cleared when the query changes
  const pendingCaret = useRef<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(q: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const list = q ? await searchPeople(q) : await getSuggestedPeople();
      setItems(list);
    }, 160);
  }

  // Inspect the text around the caret and open/close the menu accordingly.
  function detect() {
    const el = elRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? el.value.length;
    const m = el.value.slice(0, caret).match(TOKEN);
    if (!m) {
      token.current = null;
      lastQuery.current = null;
      suppressed.current = false;
      setOpen(false);
      return;
    }
    const q = m[1];
    token.current = { start: caret - q.length - 1, end: caret };
    if (lastQuery.current !== q) {
      lastQuery.current = q;
      suppressed.current = false;
      setActive(0);
      runSearch(q);
    }
    if (suppressed.current) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }

  function choose(person: Person) {
    const el = elRef.current;
    const tok = token.current;
    if (!el || !tok) return;
    const cur = el.value;
    const before = cur.slice(0, tok.start);
    const after = cur.slice(tok.end);
    const insert = `@${person.username} `;
    let next = before + insert + after;
    if (maxLength) next = next.slice(0, maxLength);
    pendingCaret.current = Math.min((before + insert).length, next.length);
    onValueChange(next);
    token.current = null;
    lastQuery.current = null;
    setOpen(false);
  }

  /** Returns true when it consumed the key (caller should not also handle it). */
  function onKeyDown(e: React.KeyboardEvent<TextEl>): boolean {
    if (!open || !items.length) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      choose(items[active]);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      suppressed.current = true;
      setOpen(false);
      return true;
    }
    return false;
  }

  function close() {
    setOpen(false);
  }

  // Restore the caret after a mention insertion re-renders the field.
  useEffect(() => {
    if (pendingCaret.current == null || !elRef.current) return;
    const c = pendingCaret.current;
    pendingCaret.current = null;
    elRef.current.focus();
    elRef.current.setSelectionRange(c, c);
  }, [value, elRef]);

  return { open, items, active, detect, choose, onKeyDown, close };
}

/** The floating suggestion list. Position it with `className` (defaults below). */
export function MentionMenu({
  items,
  active,
  onChoose,
  className,
}: {
  items: Person[];
  active: number;
  onChoose: (person: Person) => void;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-pop",
        className
      )}
    >
      {items.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChoose(p)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition",
            i === active ? "bg-cream-deep" : "hover:bg-cream-deep"
          )}
        >
          <Avatar person={p} size="xs" />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-ink">
              {p.name}
            </span>
            <span className="block truncate text-[12.5px] text-muted">
              @{p.username}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
