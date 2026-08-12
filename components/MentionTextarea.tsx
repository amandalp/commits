"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { searchPeople, getSuggestedPeople } from "@/lib/actions/loop";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

// The @token immediately before the caret: an @ at a word boundary followed by
// up to 30 handle characters. Empty (just "@") is allowed — we show follows.
const TOKEN = /(?:^|\s)@([A-Za-z0-9_]{0,30})$/;

type Props = Omit<
  React.ComponentProps<"textarea">,
  "onChange" | "value" | "ref"
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Grow the textarea to fit its content (like the commitment field). */
  autoGrow?: boolean;
};

/**
 * A <textarea> with inline @mention autocomplete. As the user types "@ma", a
 * dropdown of matching people appears; picking one inserts "@username ". Works
 * for both the commitment field and the note.
 */
export function MentionTextarea({
  value,
  onValueChange,
  autoGrow,
  maxLength,
  className,
  onKeyDown,
  onBlur,
  ...rest
}: Props) {
  const elRef = useRef<HTMLTextAreaElement | null>(null);
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

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    let v = e.target.value;
    if (maxLength) v = v.slice(0, maxLength);
    onValueChange(v);
    detect();
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (open && items.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(items[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        suppressed.current = true;
        setOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    // A suggestion click uses onMouseDown+preventDefault, so focus stays and
    // this blur won't fire mid-selection. Any other blur closes the menu.
    setOpen(false);
    onBlur?.(e);
  }

  // Restore the caret after a mention insertion re-renders the textarea.
  useEffect(() => {
    if (pendingCaret.current == null || !elRef.current) return;
    const c = pendingCaret.current;
    pendingCaret.current = null;
    elRef.current.focus();
    elRef.current.setSelectionRange(c, c);
  }, [value]);

  // Optional auto-grow to fit content.
  useEffect(() => {
    if (!autoGrow) return;
    const el = elRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, autoGrow]);

  return (
    <div className="relative">
      <textarea
        ref={elRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={detect}
        onClick={detect}
        onBlur={handleBlur}
        className={className}
        {...rest}
      />

      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-pop">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
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
      )}
    </div>
  );
}
