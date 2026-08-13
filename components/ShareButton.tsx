"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Download, Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { InstagramIcon, TikTokIcon } from "./SocialIcons";
import { HandShare } from "./HandIcons";
import { useThemeStyle } from "./ThemeStyle";
import { cn } from "@/lib/utils";
import type { CommitView } from "@/lib/types";

/** Force the handwritten marker face regardless of the active theme. */
const hand = { fontFamily: "var(--font-hand), cursive" } as const;

/** Touch devices can hand a file to a real app via the OS share sheet. */
function isMobile() {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1
  );
}

export function ShareButton({
  commit,
  label,
}: {
  commit: CommitView;
  label?: boolean;
}) {
  const { hand: isHand } = useThemeStyle();
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<string | null>(null); // object URL for preview
  const blobRef = useRef<Blob | null>(null);
  const [done, setDone] = useState<string | null>(null); // last completed action label

  const url =
    (typeof window !== "undefined" ? window.location.origin : "") +
    `/share/${commit.id}`;

  // Generate the 1080×1920 Story asset once per open, then reuse the blob for
  // the preview and every destination.
  useEffect(() => {
    if (!open) return;
    let objectUrl: string | null = null;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/share/${commit.id}/story`, {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const blob = await res.blob();
        blobRef.current = blob;
        objectUrl = URL.createObjectURL(blob);
        setAsset(objectUrl);
      } catch {
        /* aborted or failed */
      }
    })();
    return () => {
      ac.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setAsset(null);
      blobRef.current = null;
    };
  }, [open, commit.id]);

  function flash(labelText: string) {
    setDone(labelText);
    setTimeout(() => setDone(null), 1600);
  }

  function assetFile() {
    return blobRef.current
      ? new File([blobRef.current], `commit-${commit.id}.png`, { type: "image/png" })
      : null;
  }

  // Web uploaders to fall back to on desktop, where the OS share sheet can't
  // reach the app.
  const APP_WEB: Record<string, string> = {
    Instagram: "https://www.instagram.com/",
    TikTok: "https://www.tiktok.com/upload",
  };

  // Instagram / TikTok. On a phone the OS share sheet surfaces the real app and
  // hands it the image — the "ready to post" flow. Desktop has no such target,
  // so we save the asset and open the app's web uploader to pick it.
  async function toApp(dest: "Instagram" | "TikTok") {
    const file = assetFile();
    if (isMobile() && file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My commit" });
        return;
      } catch {
        return; // user cancelled
      }
    }
    saveBlob();
    window.open(APP_WEB[dest], "_blank", "noopener,noreferrer");
    flash(dest);
  }

  async function messageLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Commits",
          text: `I'm going to ${commit.text}`,
          url,
        });
        return;
      } catch {
        return;
      }
    }
    window.location.href = `sms:?&body=${encodeURIComponent(
      `I'm going to ${commit.text} — ${url}`
    )}`;
  }

  function saveBlob() {
    const blob = blobRef.current;
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `commit-${commit.id}.png`;
    a.click();
    URL.revokeObjectURL(href);
  }

  function downloadImage() {
    saveBlob();
    flash("Download");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share"
        title="Share"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1 rounded-full px-1.5 text-[13px] font-medium text-ink-soft transition-all hover:bg-cream-deep active:scale-90"
        )}
      >
        {isHand ? (
          <HandShare className="h-[18px] w-[18px]" />
        ) : (
          <Send className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
        {label && <span>Share</span>}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Share your commit"
        title={
          <span style={hand} className="text-[26px] font-bold leading-none text-ink">
            share your commit
          </span>
        }
        subtitle={
          <span style={hand} className="text-[17px] text-muted">
            let people hold you to it.
          </span>
        }
      >
        {/* Preview of the exact asset that will be shared */}
        <div className="mt-1 flex justify-center">
          <div className="aspect-[9/16] h-[40dvh] overflow-hidden rounded-2xl bg-cream ring-1 ring-border">
            {asset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset}
                alt="Your commit, ready to share"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="skeleton h-full w-full" />
            )}
          </div>
        </div>

        {/* Destinations */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          <Dest
            label="Instagram"
            onClick={() => toApp("Instagram")}
            tile="bg-[linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)]"
            icon={<InstagramIcon className="h-7 w-7 text-white" />}
          />
          <Dest
            label="TikTok"
            onClick={() => toApp("TikTok")}
            tile="bg-ink"
            icon={<TikTokIcon className="h-6 w-6 text-white" />}
          />
          <Dest
            label="Message"
            onClick={messageLink}
            tile="bg-cream-deep"
            icon={<MessageCircle className="h-6 w-6 text-ink" strokeWidth={2} />}
          />
          <Dest
            label={done === "Download" ? "Saved" : "Download"}
            onClick={downloadImage}
            tile="bg-cream-deep"
            icon={
              done === "Download" ? (
                <Check className="h-6 w-6 text-success-strong" strokeWidth={2.5} />
              ) : (
                <Download className="h-6 w-6 text-ink" strokeWidth={2} />
              )
            }
          />
        </div>
      </Sheet>
    </>
  );
}

function Dest({
  label,
  icon,
  tile,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tile: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl py-1 transition-transform active:scale-95"
    >
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5",
          tile
        )}
      >
        {icon}
      </span>
      <span className="text-[12.5px] font-medium text-muted">{label}</span>
    </button>
  );
}
