"use client";

import { useState } from "react";
import { X, Plus, Play } from "lucide-react";
import { Sheet } from "./Sheet";
import { isVideoUrl } from "@/lib/utils";

/**
 * A compact horizontal strip of attached photos/videos. Each thumbnail has a
 * remove control; a trailing "+" tile adds more (until `max`). Tapping a video
 * opens a play/pause preview.
 */
export function MediaStrip({
  items,
  onRemove,
  onAdd,
  max = 6,
}: {
  items: string[];
  onRemove: (url: string) => void;
  onAdd: () => void;
  max?: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-2 py-2">
        {items.map((url) => {
          const video = isVideoUrl(url);
          return (
            <div key={url} className="relative shrink-0">
              <button
                type="button"
                onClick={() => video && setPreview(url)}
                className="relative block h-16 w-16 overflow-hidden rounded-xl border border-border bg-cream-deep"
              >
                {video ? (
                  <>
                    <video
                      src={url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/60">
                        <Play className="h-3 w-3 fill-white text-white" />
                      </span>
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt="Attachment"
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove attachment"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white shadow-pop"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}

        {items.length < max && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add more"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border-strong text-muted transition hover:bg-cream-deep"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <Sheet open={!!preview} onClose={() => setPreview(null)} title="Preview">
        {preview && (
          <video
            src={preview}
            controls
            autoPlay
            playsInline
            className="max-h-[60vh] w-full rounded-2xl bg-black"
          />
        )}
      </Sheet>
    </>
  );
}
