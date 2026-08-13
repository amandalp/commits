import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const W = 1080;
const H = 1920;

// Warm paper + ink to match the handwritten theme.
const CREAM = "#f4efe2";
const INK = "#1b1a16";
const MUTED = "#78756c";
const ACCENT = "#6d5ae6";

const NAME_COLORS = [
  "#6d5ae6",
  "#2f9e63",
  "#c9772f",
  "#d1477a",
  "#2f88b3",
  "#8a54c9",
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function deadlineLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

/**
 * Pull a real TTF for a Google font so satori can render it. The old
 * User-Agent forces the `truetype` source instead of woff2 (unsupported).
 */
async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
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

// A hand-drawn accent underline, sized by the caller.
function Underline({ width, y = 8 }: { width: number; y?: number }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='28' viewBox='0 0 300 28' preserveAspectRatio='none'><path d='M6 18 C 80 10 150 24 294 14' fill='none' stroke='${ACCENT}' stroke-width='5' stroke-linecap='round'/></svg>`;
  return (
    <img
      width={width}
      height={28}
      style={{ marginTop: y }}
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
    />
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let text = "put it on the record";
  let deadline = new Date().toISOString();
  let name = "Someone";
  let username = "someone";
  let avatar: string | null = null;
  let authorId = id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("commits")
      .select(
        "text, deadline, author:profiles!commits_user_id_fkey(id, name, username, avatar_url)"
      )
      .eq("id", id)
      .maybeSingle();
    if (data) {
      text = data.text as string;
      deadline = data.deadline as string;
      const a = (
        Array.isArray(data.author) ? data.author[0] : data.author
      ) as {
        id?: string;
        name?: string;
        username?: string;
        avatar_url?: string | null;
      } | null;
      name = a?.name ?? name;
      username = a?.username ?? username;
      avatar = a?.avatar_url ?? null;
      authorId = a?.id ?? authorId;
    }
  } catch {
    /* fall back to defaults */
  }

  const [hand, handBold, sans, sansSemi] = await Promise.all([
    loadFont("Caveat", 400),
    loadFont("Caveat", 700),
    loadFont("Inter", 400),
    loadFont("Inter", 600),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "132px 104px 108px",
          fontFamily: "Caveat",
          color: INK,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Caveat", fontWeight: 700, fontSize: 96 }}>
            commits.
          </div>
          <Underline width={300} y={-6} />
        </div>

        {/* Commitment */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingTop: 40 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Caveat",
              fontWeight: 400,
              fontSize: 132,
              lineHeight: 1.02,
            }}
          >
            <span style={{ marginRight: 24 }}>I&apos;m going to</span>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Caveat",
              fontWeight: 400,
              fontSize: 132,
              lineHeight: 1.06,
              marginTop: 6,
            }}
          >
            {text}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 24, fontSize: 132, lineHeight: 1 }}>
            <span style={{ marginRight: 22 }}>by</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: ACCENT }}>{deadlineLabel(deadline)}</span>
              <Underline width={Math.min(560, 190 + deadlineLabel(deadline).length * 44)} y={-14} />
            </div>
          </div>
        </div>

        {/* Author + hold me to it + wordmark URL */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                width={104}
                height={104}
                style={{ width: 104, height: 104, borderRadius: 999, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 999,
                  background: avatarColor(authorId || name),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 44,
                }}
              >
                {initials(name)}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Caveat", fontWeight: 700, fontSize: 60, lineHeight: 1 }}>
                {name}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: 34, color: MUTED, marginTop: 4 }}>
                @{username}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 64 }}>
            <div style={{ display: "flex", fontFamily: "Caveat", fontWeight: 700, fontSize: 76 }}>
              hold me to it.
            </div>
            <Underline width={430} y={-8} />
          </div>

          <div style={{ display: "flex", fontFamily: "Inter", fontSize: 30, color: MUTED, marginTop: 56 }}>
            commitsapp.co
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Caveat", data: hand, weight: 400, style: "normal" },
        { name: "Caveat", data: handBold, weight: 700, style: "normal" },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
        { name: "Inter", data: sansSemi, weight: 600, style: "normal" },
      ],
    }
  );
}
