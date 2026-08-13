"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  DeadlineField,
  defaultDeadline,
  parseNaturalDeadline,
  toLocalInput,
} from "./DeadlineField";
import { HandwrittenCard } from "./HandwrittenCard";
import { AuthButtons } from "./AuthButtons";
import { Button } from "./ui";
import { savePendingDraft } from "@/lib/draft";

const HAND = "var(--font-hand), cursive";

/**
 * Commit-first signup. The visitor writes a commitment and sees the finished
 * card before any auth appears; choosing a sign-in method persists the draft so
 * it publishes automatically once they're back in the app.
 */
export function StartFlow() {
  const [step, setStep] = useState<"compose" | "preview">("compose");
  const [text, setText] = useState("");
  const [when, setWhen] = useState(defaultDeadline);

  const deadlineIso = () => new Date(when).toISOString();

  // If someone tacks a deadline onto the sentence ("… by Friday"), lift it out
  // into the date picker. Runs on blur so it never fights mid-keystroke.
  function absorbNaturalLanguage() {
    const m = text.trim().match(/^(.*\S)\s+by\s+(.+)$/i);
    if (!m) return;
    const parsed = parseNaturalDeadline(m[2]);
    if (!parsed) return;
    setText(m[1]);
    setWhen(toLocalInput(parsed));
  }

  if (step === "preview") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <button
          onClick={() => setStep("compose")}
          className="mb-5 inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> edit
        </button>

        <div className="mx-auto w-64 max-w-full rotate-[-2.5deg] rounded-3xl shadow-[0_22px_50px_-14px_rgba(27,26,22,0.28)]">
          <HandwrittenCard
            text={text.trim()}
            deadline={deadlineIso()}
            author={{ id: "you", name: "You", username: "you", avatar_url: null }}
          />
        </div>

        <h1 style={{ fontFamily: HAND }} className="mt-9 text-center text-[28px] font-bold leading-tight text-ink">
          Put it on the record.
        </h1>
        <p className="mt-1.5 mb-6 text-center text-[15px] text-muted">
          Sign in to publish your commit and let people hold you to it.
        </p>

        <AuthButtons
          next="/"
          onBeforeAuth={() => savePendingDraft({ text: text.trim(), deadline: deadlineIso() })}
        />

        <p className="mt-6 text-center text-[14px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <p style={{ fontFamily: HAND }} className="text-3xl font-bold leading-none text-ink">
        commits.
      </p>
      <h1 className="mt-6 font-display text-[30px] font-bold leading-tight text-ink">
        What are you going to do?
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Say it out loud. You&apos;ll see how it looks before you sign in.
      </p>

      <div className="mt-7">
        <label className="mb-2 block text-[14px] font-medium text-muted">I&apos;m going to</label>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          onBlur={absorbNaturalLanguage}
          placeholder="launch the first version of Commits"
          rows={2}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-4 font-display text-[22px] font-bold leading-tight text-ink outline-none transition placeholder:font-bold placeholder:text-faint focus:border-accent"
        />
        <div className="mt-1 text-right text-[12px] text-faint">{text.length}/280</div>
      </div>

      <DeadlineField value={when} onChange={setWhen} hidden={!text.trim()} />

      <Button
        full
        size="lg"
        className="mt-7"
        onClick={() => setStep("preview")}
        disabled={!text.trim()}
      >
        Preview <ArrowRight className="h-[18px] w-[18px]" />
      </Button>

      <p className="mt-6 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
