"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./ui";
import { ShareCard } from "./ShareCard";
import type { CommitView } from "@/lib/types";

export function ShareButton({
  commit,
  label,
}: {
  commit: CommitView;
  label?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    (typeof window !== "undefined" ? window.location.origin : "") +
    `/share/${commit.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Commits",
          text: `I'm going to ${commit.text}`,
          url,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={nativeShare}
        aria-label="Share"
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13.5px] font-semibold text-ink hover:bg-cream-deep"
      >
        <Share2 className="h-5 w-5" />
        {label && "Share"}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Share this Commit">
        <div className="mx-auto max-w-[300px]">
          <ShareCard
            text={commit.text}
            deadline={commit.deadline}
            author={commit.author}
            shipped={commit.status === "shipped"}
          />
        </div>
        <p className="mt-4 text-center text-[13px] text-muted">
          Screenshot the card for your story, or copy the link.
        </p>
        <Button full size="lg" className="mt-4" onClick={copy}>
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Link copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </Button>
      </Sheet>
    </>
  );
}
