import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { deadlineLabel, durationLabel } from "@/lib/utils";
import type { Duration, DurationUnit } from "@/lib/types";
import {
  CREAM,
  INK,
  MUTED,
  ACCENT,
  SUCCESS,
  SUCCESS_SOFT,
  OgAvatar,
  Underline,
  loadShareFonts,
} from "@/lib/og-render";

// Shared by both `opengraph-image` and `twitter-image` for /share/[id].
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A commitment on Commits";

/**
 * The link-preview card: the handwritten Commits look, featuring the person's
 * photo and their actual commitment. Before shipping it reads "I'm going to …
 * hold me to it."; once shipped it flips to "I said I'd … said it. did it."
 */
export default async function CommitOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let text = "";
  let deadline = new Date().toISOString();
  let name = "Someone";
  let username = "someone";
  let avatar: string | null = null;
  let authorId = id;
  let shipped = false;
  let duration: Duration | null = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("commits")
      .select(
        "text, deadline, duration_amount, duration_unit, status, author:profiles!commits_user_id_fkey(id, name, username, avatar_url)"
      )
      .eq("id", id)
      .maybeSingle();
    if (data) {
      text = data.text as string;
      deadline = data.deadline as string;
      shipped = data.status === "shipped";
      if (data.duration_amount && data.duration_unit)
        duration = {
          amount: data.duration_amount as number,
          unit: data.duration_unit as DurationUnit,
        };
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

  // A duration commit reads "for 30 days" where a dated one reads "by Aug 27".
  const lead = duration ? "for" : "by";
  const date = duration ? durationLabel(duration) : deadlineLabel(deadline);
  const fonts = await loadShareFonts();

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
          padding: "58px 72px",
          fontFamily: "Caveat",
          color: INK,
        }}
      >
        {/* Wordmark + shipped badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Caveat", fontWeight: 700, fontSize: 54, lineHeight: 1 }}>
              commits.
            </div>
            <Underline width={172} y={-4} />
          </div>
          {shipped && (
            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 26,
                color: SUCCESS,
                background: SUCCESS_SOFT,
                padding: "8px 22px",
                borderRadius: 999,
              }}
            >
              SHIPPED ✓
            </div>
          )}
        </div>

        {/* The commitment */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingTop: 12 }}>
          <div style={{ display: "flex", fontFamily: "Caveat", fontWeight: 400, fontSize: 44, color: MUTED }}>
            {shipped ? "I said I’d" : "I’m going to"}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Caveat",
              fontWeight: 700,
              fontSize: 88,
              lineHeight: 1.02,
              marginTop: 2,
              maxWidth: 1000,
            }}
          >
            {text}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 16, fontSize: 60 }}>
            <span style={{ marginRight: 16 }}>{lead}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: ACCENT }}>{date}</span>
              <Underline width={Math.min(420, 130 + date.length * 30)} y={-12} />
            </div>
          </div>
        </div>

        {/* Footer: payoff line + author */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Caveat",
                fontWeight: 700,
                fontSize: 52,
                color: shipped ? SUCCESS : ACCENT,
              }}
            >
              {shipped ? "said it. did it." : "hold me to it."}
            </div>
            <Underline width={shipped ? 300 : 260} y={-6} color={shipped ? SUCCESS : ACCENT} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <OgAvatar avatar={avatar} name={name} seed={authorId} size={76} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Caveat", fontWeight: 700, fontSize: 42, lineHeight: 1 }}>
                {name}
              </span>
              <span style={{ fontFamily: "Inter", fontSize: 24, color: MUTED, marginTop: 4 }}>
                @{username}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
