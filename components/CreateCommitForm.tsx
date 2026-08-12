"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Check } from "lucide-react";
import { DeadlinePicker, toLocalInput } from "./DeadlinePicker";
import { Button } from "./ui";
import { useThemeStyle } from "./ThemeStyle";
import { cn } from "@/lib/utils";
import { createCommit } from "@/lib/actions/commits";

export function CreateCommitForm() {
  const router = useRouter();
  const { hand } = useThemeStyle();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [when, setWhen] = useState(() =>
    toLocalInput(new Date(Date.now() + 864e5))
  );
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  // Auto-grow the commitment textarea.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  async function submit() {
    if (!text.trim()) {
      setError("Say what you're going to do.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await createCommit({
      text,
      context: showContext ? context : null,
      deadline: new Date(when).toISOString(),
    });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push(`/commit/${res.data!.id}`);
      router.refresh();
    }, 850);
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center animate-rise">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
          <Check className="h-8 w-8 text-success" strokeWidth={2.5} />
        </div>
        <h2 className={cn("mt-5 text-2xl font-bold text-ink", hand && "ink-hand text-3xl")}>
          You&apos;re on the record.
        </h2>
        <p className="mt-1.5 text-muted">Now go make it happen.</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-2">
      <h1 className={cn("font-display text-[30px] font-bold leading-tight text-ink", hand && "hw-lower")}>
        What are you
        <br />
        committing to?
      </h1>

      <div className="mt-7">
        <label className={cn("mb-2 block text-[14px] font-medium text-muted", hand && "ink-hand text-[17px] text-ink-soft")}>
          I&apos;m going to
        </label>
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="launch the first version of Commits"
          rows={2}
          className={cn(
            "w-full resize-none rounded-2xl border border-border bg-surface p-4 font-display text-[22px] font-bold leading-tight text-ink outline-none transition placeholder:font-bold placeholder:text-faint focus:border-accent",
            hand && "commit-hw ink-hand text-[26px]"
          )}
        />
        <div className="mt-1 text-right text-[12px] text-faint">
          {text.length}/280
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-[14px] font-medium text-muted">by</label>
        <DeadlinePicker value={when} onChange={setWhen} />
      </div>

      <div className="mt-5">
        {!showContext ? (
          <button
            onClick={() => setShowContext(true)}
            className="flex items-center gap-1.5 text-[14px] font-medium text-ink-soft"
          >
            <Plus className="h-4 w-4" /> {hand ? "add context" : "Add context (optional)"}
          </button>
        ) : (
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, 600))}
            placeholder="Why is this important to you?"
            rows={3}
            autoFocus
            className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-accent"
          />
        )}
      </div>

      {error && <p className="mt-4 text-sm text-[#d1477a]">{error}</p>}

      <Button
        full
        size="lg"
        className="mt-6"
        onClick={submit}
        loading={pending}
        disabled={!text.trim()}
      >
        {!pending && <Sparkles className="h-[18px] w-[18px]" />}
        <span className={cn(hand && "ink-hand text-[19px]")}>
          {hand ? "put it on the record" : "Commit"}
        </span>
      </Button>
      <p className="mt-3 text-center text-[13px] text-muted">
        You&apos;re on the record.
      </p>
    </div>
  );
}
