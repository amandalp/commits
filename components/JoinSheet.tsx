"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "./Sheet";
import { DeadlinePicker, toLocalInput } from "./DeadlinePicker";
import { Button } from "./ui";
import { joinCommit } from "@/lib/actions/commits";

export function JoinSheet({
  open,
  onClose,
  parentCommitId,
  originalText,
  authorName,
  onJoined,
}: {
  open: boolean;
  onClose: () => void;
  parentCommitId: string;
  originalText: string;
  authorName: string;
  onJoined?: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState(originalText);
  const [when, setWhen] = useState(() =>
    toLocalInput(new Date(Date.now() + 7 * 864e5))
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const res = await joinCommit(parentCommitId, {
      text,
      deadline: new Date(when).toISOString(),
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onJoined?.();
    onClose();
    if (res.data) router.push(`/commit/${res.data.id}`);
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Join ${authorName}'s Commit`}>
      <p className="mb-4 text-sm text-muted">
        Make it your own. Keep the wording or tweak it, and set your own deadline.
      </p>

      <label className="mb-1.5 block text-[13px] font-medium text-muted">
        I want to
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={280}
        className="mb-4 w-full resize-none rounded-2xl border border-border bg-surface p-4 text-lg font-semibold text-ink outline-none focus:border-accent"
      />

      <label className="mb-2 block text-[13px] font-medium text-muted">by</label>
      <DeadlinePicker value={when} onChange={setWhen} />

      {error && <p className="mt-3 text-sm text-[#d1477a]">{error}</p>}

      <Button
        full
        size="lg"
        className="mt-5"
        onClick={submit}
        loading={pending}
        disabled={!text.trim()}
      >
        Join this Commit
      </Button>
    </Sheet>
  );
}
