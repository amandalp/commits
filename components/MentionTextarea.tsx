"use client";

import { useEffect, useRef } from "react";
import { useMentions, MentionMenu } from "./mentions";

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
 * dropdown of matching people appears; picking one inserts "@username ".
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
  const m = useMentions({ elRef, value, onValueChange, maxLength });

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    let v = e.target.value;
    if (maxLength) v = v.slice(0, maxLength);
    onValueChange(v);
    m.detect();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (m.onKeyDown(e)) return;
    onKeyDown?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    // A suggestion click uses onMouseDown+preventDefault, so focus stays and
    // this blur won't fire mid-selection. Any other blur closes the menu.
    m.close();
    onBlur?.(e);
  }

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
        onKeyUp={m.detect}
        onClick={m.detect}
        onBlur={handleBlur}
        className={className}
        {...rest}
      />
      {m.open && (
        <MentionMenu items={m.items} active={m.active} onChoose={m.choose} />
      )}
    </div>
  );
}
