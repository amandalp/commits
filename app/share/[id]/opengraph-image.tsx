import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A commitment on Commits";

function deadlineLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export default async function OgImage({
  params,
}: {
  params: { id: string };
}) {
  let text = "";
  let deadline = new Date().toISOString();
  let name = "Someone";
  let shipped = false;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("commits")
      .select("text, deadline, status, author:profiles!commits_user_id_fkey(name)")
      .eq("id", params.id)
      .maybeSingle();
    if (data) {
      text = data.text as string;
      deadline = data.deadline as string;
      shipped = data.status === "shipped";
      const author = data.author as { name?: string } | { name?: string }[] | null;
      name = Array.isArray(author) ? author[0]?.name ?? name : author?.name ?? name;
    }
  } catch {
    /* fall back to defaults */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f3ee",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#1b1a16" }}>Commits</div>
          {shipped ? (
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#1f8a52",
                background: "#e7f3ea",
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              SHIPPED ✓
            </div>
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: 999, background: "#6d5ae6" }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#78756c" }}>
            {shipped ? "I SAID I'D" : "I'M GOING TO"}
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: "#1b1a16",
              lineHeight: 1.05,
              marginTop: 12,
              maxWidth: 1000,
            }}
          >
            {text}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#78756c", marginTop: 28 }}>
            BY
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#6d5ae6", marginTop: 6 }}>
            {deadlineLabel(deadline)}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#1b1a16" }}>{name}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: shipped ? "#1f8a52" : "#6d5ae6" }}>
            {shipped ? "said it. did it." : "Hold me to it →"}
          </div>
        </div>
      </div>
    ),
    size
  );
}
