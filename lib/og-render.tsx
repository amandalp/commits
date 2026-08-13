/**
 * Shared building blocks for the social-share images we generate with
 * `next/og` (satori): the warm palette, a real-TTF font loader, and the
 * handwritten avatar + underline marks. Used by the homepage OG image, the
 * per-commitment OG/Twitter image, and the tall Story asset.
 */

// Warm paper + ink, matching the handwritten theme.
export const CREAM = "#f4efe2";
export const INK = "#1b1a16";
export const MUTED = "#78756c";
export const ACCENT = "#6d5ae6";
export const SUCCESS = "#1f8a52";
export const SUCCESS_SOFT = "#e7f3ea";

const AVATAR_COLORS = [
  "#6d5ae6",
  "#2f9e63",
  "#c9772f",
  "#d1477a",
  "#2f88b3",
  "#8a54c9",
];

/** Deterministic accent for the initials fallback when there's no photo. */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Pull a real TTF for a Google font so satori can render it. The ancient
 * User-Agent forces the `truetype` source instead of woff2 (which satori
 * can't parse).
 */
export async function loadFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(
      / /g,
      "+"
    )}:wght@${weight}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30",
      },
    }
  ).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`No TTF for ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

/** The four faces every share image uses: Caveat (marker) + Inter (labels). */
export async function loadShareFonts() {
  const [hand, handBold, sans, sansSemi] = await Promise.all([
    loadFont("Caveat", 400),
    loadFont("Caveat", 700),
    loadFont("Inter", 400),
    loadFont("Inter", 600),
  ]);
  return [
    { name: "Caveat", data: hand, weight: 400 as const, style: "normal" as const },
    { name: "Caveat", data: handBold, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: sansSemi, weight: 600 as const, style: "normal" as const },
  ];
}

/** A hand-drawn accent underline, sized by the caller. */
export function Underline({
  width,
  y = 8,
  color = ACCENT,
}: {
  width: number;
  y?: number;
  color?: string;
}) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='28' viewBox='0 0 300 28' preserveAspectRatio='none'><path d='M6 18 C 80 10 150 24 294 14' fill='none' stroke='${color}' stroke-width='5' stroke-linecap='round'/></svg>`;
  return (
    <img
      width={width}
      height={28}
      style={{ marginTop: y }}
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
      alt=""
    />
  );
}

/** The author's photo, or a colored initials disc when there's none. */
export function OgAvatar({
  avatar,
  name,
  seed,
  size,
}: {
  avatar: string | null;
  name: string;
  seed: string;
  size: number;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" }}
        alt=""
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: avatarColor(seed || name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: size * 0.42,
      }}
    >
      {initials(name)}
    </div>
  );
}
