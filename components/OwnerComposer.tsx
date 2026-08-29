"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaField } from "./MediaField";
import { Confetti } from "./Confetti";
import { DeadlinePicker, toLocalInput } from "./DeadlinePicker";
import { Button } from "./ui";
import { postUpdate, shipCommit, notYet } from "@/lib/actions/commits";
import { deadlineLabel } from "@/lib/utils";

type Mode = "idle" | "update" | "ship" | "notyet";

/**
 * The creator's control, sitting directly beneath their commitment:
 *
 *   so… how's it going?
 *   [ I did it ]   [ not yet ]   share an update
 *
 * "I did it" and "not yet" resolve the promise; "share an update" adds to the
 * conversation without resolving it. Whatever they post lands in the single
 * thread below.
 */
export function OwnerComposer({
  commitId,
  text,
  originalDeadline,
}: {
  commitId: string;
  text: string;
  originalDeadline: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");

  if (mode === "update")
    return <UpdatePanel commitId={commitId} onClose={() => setMode("idle")} />;
  if (mode === "ship")
    return <ShipPanel commitId={commitId} text={text} onClose={() => setMode("idle")} />;
  if (mode === "notyet")
    return (
      <NotYetPanel commitId={commitId} originalDeadline={originalDeadline} onClose={() => setMode("idle")} />
    );

  return (
    <div>
      <p className="ink-hand text-[20px] text-ink-soft">so… how&apos;s it going?</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button variant="primary" className="px-7" onClick={() => setMode("ship")}>
          I did it
        </Button>
        <button
          onClick={() => setMode("notyet")}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border-strong bg-surface px-7 text-[15px] font-semibold text-ink transition-all hover:bg-cream-deep active:scale-[0.98]"
        >
          not yet
        </button>
        <button
          onClick={() => setMode("update")}
          className="ml-1 text-[14px] font-medium text-muted hover:text-ink"
        >
          share an update
        </button>
      </div>
    </div>
  );
}

/** "share an update": progress that doesn't resolve the promise. */
function UpdatePanel({ commitId, onClose }: { commitId: string; onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const res = await postUpdate(commitId, { text, mediaUrl: media, linkUrl: link });
    setPending(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-2 text-[13px] font-medium text-muted">Give us the update</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        placeholder="What happened?"
        rows={3}
        autoFocus
        className="w-full resize-none bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
      />
      <div className="mt-1">
        <MediaField folder="updates" mediaUrl={media} linkUrl={link} onMedia={setMedia} onLink={setLink} />
      </div>
      {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} loading={pending} disabled={!text.trim() && !media && !link}>
          share update
        </Button>
      </div>
    </div>
  );
}

/** "you did it. show us.": proof welcome, everything optional. */
function ShipPanel({ commitId, text, onClose }: { commitId: string; text: string; onClose: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const res = await shipCommit(commitId, { text: note, mediaUrl: media, linkUrl: link });
    if (!res.ok) {
      setPending(false);
      return setError(res.error);
    }
    router.refresh();
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-success-border bg-success-soft/50 p-4">
      <Confetti />
      <h2 className="ink-hand text-[22px] font-bold text-ink">you did it. show us.</h2>
      <p className="mt-0.5 text-[13px] text-muted">You said you&apos;d {text}</p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 1000))}
        placeholder="Guess what, I actually did it 😂"
        rows={3}
        autoFocus
        className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-success"
      />
      <div className="mt-2">
        <MediaField folder="proof" mediaUrl={media} linkUrl={link} onMedia={setMedia} onLink={setLink} />
      </div>
      {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back
        </Button>
        <Button variant="success" size="sm" onClick={submit} loading={pending}>
          share the win
        </Button>
      </div>
    </div>
  );
}

/** "what happened?": three honest, un-punishing outs. */
function NotYetPanel({
  commitId,
  originalDeadline,
  onClose,
}: {
  commitId: string;
  originalDeadline: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<"pick" | "time" | "changed" | "letgo">("pick");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 3 * 864e5)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(payload: { newDeadline?: string; close?: boolean }) {
    setPending(true);
    setError(null);
    const res = await notYet(commitId, { text: note, ...payload });
    if (!res.ok) {
      setPending(false);
      return setError(res.error);
    }
    router.refresh();
    if (payload.newDeadline) onClose();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="ink-hand text-[22px] font-bold text-ink">what happened?</h2>

      {choice === "pick" && (
        <div className="mt-3 space-y-2">
          <ChoiceRow label="I need more time" onClick={() => setChoice("time")} />
          <ChoiceRow label="I changed my mind" onClick={() => setChoice("changed")} />
          <ChoiceRow label="I’m letting this one go" onClick={() => setChoice("letgo")} />
          <button
            onClick={onClose}
            className="mt-1 block w-full text-center text-[13px] font-medium text-muted hover:text-ink-soft"
          >
            never mind
          </button>
        </div>
      )}

      {choice === "time" && (
        <div className="mt-3 animate-rise">
          <div className="mb-3 rounded-xl bg-cream-deep px-3.5 py-2.5 text-[13px] text-ink-soft">
            Original deadline <span className="font-semibold">{deadlineLabel(originalDeadline)}</span> stays on the record.
          </div>
          <label className="mb-2 block text-[13px] font-medium text-muted">new deadline</label>
          <DeadlinePicker value={when} onChange={setWhen} />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder="Got pulled into client work. Finishing Friday."
            rows={2}
            className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setChoice("pick")}>
              Back
            </Button>
            <Button full onClick={() => run({ newDeadline: new Date(when).toISOString() })} loading={pending}>
              keep going
            </Button>
          </div>
        </div>
      )}

      {(choice === "changed" || choice === "letgo") && (
        <div className="mt-3 animate-rise">
          <p className="text-[15px] text-ink-soft">
            {choice === "changed"
              ? "That’s allowed. This closes the commit. It stays on your profile with its full history."
              : "No shame in it. This closes the commit. It stays on your profile with its full history."}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder="Add a note (optional)"
            rows={2}
            className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-sm text-[#d1477a]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setChoice("pick")}>
              Back
            </Button>
            <Button full variant="secondary" onClick={() => run({ close: true })} loading={pending}>
              {choice === "changed" ? "close it out" : "let it go"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 text-left text-[15px] font-medium text-ink transition hover:border-border-strong"
    >
      {label}
    </button>
  );
}
