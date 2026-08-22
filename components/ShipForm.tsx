"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Confetti } from "./Confetti";
import { MediaField } from "./MediaField";
import { CommitStructure } from "./CommitStructure";
import { Button } from "./ui";
import { shipCommit } from "@/lib/actions/commits";
import type { Duration } from "@/lib/types";

export function ShipForm({
  commitId,
  text,
  deadline,
  duration,
}: {
  commitId: string;
  text: string;
  deadline: string;
  duration?: Duration | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const res = await shipCommit(commitId, {
      text: note,
      mediaUrl: media,
      linkUrl: link,
    });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    router.push(`/commit/${commitId}`);
    router.refresh();
  }

  return (
    <div className="px-5 pb-10 pt-2">
      <Confetti />
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
          <PartyPopper className="h-7 w-7 text-success" />
        </div>
        <h1 className="ink-hand mt-4 font-display text-[28px] font-bold text-ink">
          you did it. show us.
        </h1>
        <p className="mt-1 text-muted">A message, proof, or nothing at all.</p>
      </div>

      <div className="mt-5 rounded-2xl border border-success-border bg-success-soft/50 p-4">
        <CommitStructure
          text={text}
          deadline={deadline}
          duration={duration}
          size="sm"
          tone="shipped"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-[14px] font-medium text-muted">
          Say something (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 1000))}
          placeholder="Guess what—I actually did it 😂"
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-accent"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-[14px] font-medium text-muted">
          Add proof
        </label>
        <MediaField
          folder="proof"
          mediaUrl={media}
          linkUrl={link}
          onMedia={setMedia}
          onLink={setLink}
        />
      </div>

      {error && <p className="mt-4 text-sm text-[#d1477a]">{error}</p>}

      <Button
        full
        size="lg"
        variant="success"
        className="mt-6"
        onClick={submit}
        loading={pending}
      >
        share the win
      </Button>
    </div>
  );
}
