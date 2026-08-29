import { Fragment } from "react";
import Link from "next/link";

// Matches @handle (letters, digits, underscore). Capturing group keeps the
// delimiters in the split so we can rebuild the string with links inline.
const MENTION = /(@[A-Za-z0-9_]{1,30})/g;

/**
 * Renders free text with @username mentions turned into profile links. Plain,
 * dependency-free, so it is safe in both server and client components. Wrap in a
 * `whitespace-pre-wrap` container to preserve the author's line breaks.
 */
export function MentionText({ text }: { text: string }) {
  const parts = text.split(MENTION);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const handle = part.slice(1);
          return (
            <Link
              key={i}
              href={`/u/${handle}`}
              className="font-medium text-accent hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
