import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { deadlineLabel } from "@/lib/utils";
import {
  CREAM,
  INK,
  MUTED,
  ACCENT,
  OgAvatar,
  Underline,
  loadShareFonts,
} from "@/lib/og-render";

export const runtime = "nodejs";

const W = 1080;
const H = 1920;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let text = "";
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
            <OgAvatar avatar={avatar} name={name} seed={authorId} size={104} />
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
    { width: W, height: H, fonts }
  );
}
