import { ImageResponse } from "next/og";
import { ACCENT, loadShareFonts } from "@/lib/og-render";

// Shared by the root `opengraph-image` and `twitter-image`. The default
// preview for any page without its own (homepage, login, etc.).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Commits: commit out loud";

const PAPER = "#fdfcf9";

/**
 * The homepage card: the handwritten `commits.` wordmark on a bold violet
 * field. Built to stay recognizable even when a messaging app shrinks it.
 */
export default async function HomeOgImage() {
  const fonts = await loadShareFonts();

  // A cream hand-drawn underline under the wordmark.
  const underline =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='44' viewBox='0 0 520 44' preserveAspectRatio='none'><path d='M12 30 C 150 14 320 40 508 22' fill='none' stroke='${PAPER}' stroke-width='9' stroke-linecap='round'/></svg>`
    );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: ACCENT,
          fontFamily: "Caveat",
          color: PAPER,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Caveat", fontWeight: 700, fontSize: 180, lineHeight: 1 }}>
            commits.
          </div>
          <img src={underline} width={520} height={44} style={{ marginTop: -8 }} alt="" />
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Caveat",
            fontWeight: 400,
            fontSize: 60,
            marginTop: 40,
            color: "rgba(253,252,249,0.92)",
          }}
        >
          Commit out loud.
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
