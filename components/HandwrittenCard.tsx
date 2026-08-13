import { avatarColor, initials, deadlineLabel } from "@/lib/utils";
import type { Person } from "@/lib/types";

/**
 * The login hero card. A clean cream note — sans "I'M GOING TO" / "BY" labels
 * and a purple accent — with the brand logo, the commitment, and the deadline
 * set in the Caveat marker face. Handle-only footer with "Hold me to it →".
 *
 * Colors are hard-coded to the shared asset's palette (not the CSS theme
 * variables) so it reads the same even when the app is in the "clean" theme.
 * Type scales with the card width via container query units.
 */

const CREAM = "#f4efe2";
const INK = "#1b1a16";
const MUTED = "#78756c";
const ACCENT = "#6d5ae6";

const HAND = "var(--font-hand), cursive";
const SANS = "var(--font-sans), system-ui, sans-serif";

const LABEL = {
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: "3.2cqi",
  letterSpacing: "0.14em",
  color: MUTED,
} as const;

export function HandwrittenCard({
  text,
  deadline,
  author,
}: {
  text: string;
  deadline: string;
  author: Person;
}) {
  return (
    <div
      style={{ containerType: "inline-size", background: CREAM, color: INK }}
      className="aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1 ring-border"
    >
      <div className="flex h-full flex-col justify-between" style={{ padding: "7cqi" }}>
        {/* Logo + status dot */}
        <div className="flex items-start justify-between">
          <span style={{ fontFamily: HAND, fontWeight: 700, fontSize: "7cqi", lineHeight: 1 }}>
            commits.
          </span>
          <span
            style={{ width: "3cqi", height: "3cqi", borderRadius: 999, background: ACCENT, marginTop: "1cqi" }}
          />
        </div>

        {/* Commitment */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span style={LABEL}>I&apos;M GOING TO</span>
          <span
            style={{
              fontFamily: HAND,
              fontWeight: 400,
              fontSize: "9.5cqi",
              lineHeight: 1.05,
              marginTop: "2cqi",
            }}
          >
            {text}
          </span>
          <span style={{ ...LABEL, marginTop: "4cqi" }}>BY</span>
          <span
            style={{
              fontFamily: HAND,
              fontWeight: 400,
              fontSize: "8.5cqi",
              lineHeight: 1,
              color: ACCENT,
              marginTop: "1cqi",
            }}
          >
            {deadlineLabel(deadline)}
          </span>
        </div>

        {/* Handle + hold me to it */}
        <div className="flex items-center" style={{ gap: "3cqi" }}>
          {author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar_url}
              alt=""
              style={{ width: "11cqi", height: "11cqi", borderRadius: 999, objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                width: "11cqi",
                height: "11cqi",
                borderRadius: 999,
                background: avatarColor(author.id || author.name),
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: "4.5cqi",
              }}
            >
              {initials(author.name)}
            </span>
          )}
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: "3.6cqi", color: INK }}>
            @{author.username}
          </span>
          <span
            style={{ fontFamily: SANS, fontWeight: 600, fontSize: "3.4cqi", color: ACCENT, marginLeft: "auto" }}
          >
            Hold me to it →
          </span>
        </div>
      </div>
    </div>
  );
}
