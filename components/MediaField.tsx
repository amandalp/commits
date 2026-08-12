"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, Link as LinkIcon } from "lucide-react";
import { uploadMedia } from "@/lib/upload";

/**
 * Controlled photo + link attachment used by update / ship / not-yet forms.
 */
export function MediaField({
  folder,
  mediaUrl,
  linkUrl,
  onMedia,
  onLink,
}: {
  folder: "updates" | "proof" | "avatars";
  mediaUrl: string | null;
  linkUrl: string | null;
  onMedia: (url: string | null) => void;
  onLink: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLink, setShowLink] = useState(!!linkUrl);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const res = await uploadMedia(file, folder);
    setUploading(false);
    if ("error" in res) setError(res.error);
    else onMedia(res.url);
    e.target.value = "";
  }

  return (
    <div className="space-y-2.5">
      {mediaUrl && (
        <div className="relative w-fit">
          <img
            src={mediaUrl}
            alt="Attachment"
            className="max-h-56 rounded-2xl border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onMedia(null)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showLink && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3">
          <LinkIcon className="h-4 w-4 text-muted" />
          <input
            type="url"
            inputMode="url"
            value={linkUrl ?? ""}
            onChange={(e) => onLink(e.target.value || null)}
            placeholder="https://…"
            className="flex-1 bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13.5px] font-medium text-ink-soft hover:bg-cream-deep"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Photo
        </button>
        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13.5px] font-medium text-ink-soft hover:bg-cream-deep"
        >
          <LinkIcon className="h-4 w-4" />
          Link
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {error && <p className="text-sm text-[#d1477a]">{error}</p>}
    </div>
  );
}
