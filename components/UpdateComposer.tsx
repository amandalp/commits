"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { MediaField } from "./MediaField";
import { Button } from "./ui";
import { postUpdate } from "@/lib/actions/commits";
import type { Person } from "@/lib/types";

/** The creator's "Your update / Share a quick update…" composer. */
export function UpdateComposer({
  commitId,
  author,
}: {
  commitId: string;
  author: Person;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const res = await postUpdate(commitId, {
      text,
      mediaUrl: media,
      linkUrl: link,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setText("");
    setMedia(null);
    setLink(null);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition hover:border-border-strong"
      >
        <Avatar person={author} size="sm" />
        <span className="text-[15px] text-muted">Share a quick update…</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        <Avatar person={author} size="sm" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          placeholder="Venue is confirmed. MVP is almost ready…"
          rows={3}
          autoFocus
          className="mt-1 flex-1 resize-none bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
        />
      </div>
      <div className="mt-2 pl-12">
        <MediaField
          folder="updates"
          mediaUrl={media}
          linkUrl={link}
          onMedia={setMedia}
          onLink={setLink}
        />
      </div>
      {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={submit}
          loading={pending}
          disabled={!text.trim() && !media && !link}
        >
          Post update
        </Button>
      </div>
    </div>
  );
}
