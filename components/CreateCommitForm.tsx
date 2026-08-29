"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Check, ImagePlus, Loader2, Users, X } from "lucide-react";
import {
  DeadlineField,
  defaultDeadline,
  durationDeadline,
  parseNaturalDeadline,
  parseNaturalDuration,
  toLocalInput,
} from "./DeadlineField";
import { MediaStrip } from "./MediaStrip";
import { MentionTextarea } from "./MentionTextarea";
import { AddPeopleSheet } from "./AddPeopleSheet";
import { TrackingField } from "./TrackingField";
import { Avatar } from "./Avatar";
import { Button } from "./ui";
import { useThemeStyle } from "./ThemeStyle";
import { cn } from "@/lib/utils";
import { uploadMedia } from "@/lib/upload";
import { createCommit } from "@/lib/actions/commits";
import { detectRepeat, trackable, type Weekday } from "@/lib/schedule";
import { durationLabel } from "@/lib/utils";
import type { Duration, Person } from "@/lib/types";

const MAX_MEDIA = 6;
const MAX_VIDEO_SECS = 60;

/** Read a local video's duration (seconds) without uploading it. */
function videoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    v.src = url;
  });
}

export function CreateCommitForm() {
  const router = useRouter();
  const { hand } = useThemeStyle();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [loopIn, setLoopIn] = useState<Person[]>([]);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [when, setWhen] = useState(defaultDeadline);
  // Non-null when the commitment reads "for 30 days" instead of "by <date>";
  // `when` still carries the deadline that duration lands on.
  const [duration, setDuration] = useState<Duration | null>(null);
  // The days a repeating commitment is tracked on; null = not tracked.
  const [repeatDays, setRepeatDays] = useState<Weekday[] | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convenience only: if someone tacks a deadline onto the sentence
  // ("… by Friday at noon", "… for 30 days"), lift it out into the date or the
  // duration. Runs on blur so it never fights the user mid-keystroke, and only
  // when the phrase parses.
  function absorbNaturalLanguage() {
    const trimmed = text.trim();

    const span = trimmed.match(/^(.*\S)\s+for\s+(.+)$/i);
    if (span) {
      const parsed = parseNaturalDuration(span[2]);
      if (parsed) {
        setText(span[1]);
        setDuration(parsed);
        setWhen((w) => durationDeadline(parsed, w.split("T")[1] ?? "18:00"));
        return;
      }
    }

    const m = trimmed.match(/^(.*\S)\s+by\s+(.+)$/i);
    if (!m) return;
    const parsed = parseNaturalDeadline(m[2]);
    if (!parsed) return;
    setText(m[1]);
    setDuration(null);
    setWhen(toLocalInput(parsed));
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;

    const room = MAX_MEDIA - media.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_MEDIA} items.`);
      return;
    }

    setUploading(true);
    setError(null);
    const added: string[] = [];
    for (const file of files.slice(0, room)) {
      if (file.type.startsWith("video/")) {
        const secs = await videoDuration(file);
        if (secs > MAX_VIDEO_SECS + 0.5) {
          setError(`Videos need to be ${MAX_VIDEO_SECS} seconds or shorter.`);
          continue;
        }
      }
      const res = await uploadMedia(file, "commits");
      if ("error" in res) setError(res.error);
      else added.push(res.url);
    }
    if (added.length) setMedia((m) => [...m, ...added]);
    else if (files.length > room)
      setError(`You can add up to ${MAX_MEDIA} items.`);
    setUploading(false);
  }

  function togglePerson(person: Person) {
    setLoopIn((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person]
    );
  }

  async function submit() {
    if (!text.trim()) {
      setError("Say what you're going to do.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await createCommit({
      text,
      context: noteOpen && context.trim() ? context : null,
      mediaUrls: media,
      deadline: new Date(when).toISOString(),
      duration,
      repeatDays,
      loopInIds: loopIn.map((p) => p.id),
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
        <MentionTextarea
          autoGrow
          autoFocus
          value={text}
          onValueChange={setText}
          maxLength={280}
          onBlur={absorbNaturalLanguage}
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

      <DeadlineField
        value={when}
        onChange={setWhen}
        duration={duration}
        onDurationChange={(d) => {
          setDuration(d);
          if (!trackable(d)) setRepeatDays(null);
        }}
        hidden={!text.trim()}
      />

      {/* Tracking is only offered once there's a run of days to track. */}
      {text.trim() && trackable(duration) && (
        <TrackingField
          detected={detectRepeat(text)}
          value={repeatDays}
          onChange={setRepeatDays}
          durationLabel={durationLabel(duration!)}
        />
      )}

      {text.trim() && (
        <div className="mt-5 space-y-3">
          {/* The optional note: an inline underlined field, not a boxed composer. */}
          {noteOpen && (
            <div className="animate-rise">
              <label
                className={cn(
                  "mb-1 block text-[14px] font-medium text-muted",
                  hand && "ink-hand text-[16px] text-ink-soft"
                )}
              >
                {hand ? "a little context" : "A little context"}
              </label>
              <MentionTextarea
                value={context}
                onValueChange={setContext}
                maxLength={600}
                placeholder="Why does this matter to you?"
                rows={2}
                autoFocus
                className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-1.5 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-accent"
              />
            </div>
          )}

          {/* People in the loop: chips with a live "+ add" affordance. */}
          {loopIn.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 animate-rise">
              <span className="text-[13px] font-medium text-muted">in the loop</span>
              {loopIn.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 text-[13.5px] font-medium text-ink"
                >
                  <Avatar person={p} size="xs" />
                  {p.name}
                  <button
                    type="button"
                    onClick={() => togglePerson(p)}
                    aria-label={`Remove ${p.name}`}
                    className="ml-0.5 text-muted hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setPeopleOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-[13.5px] font-medium text-ink-soft hover:border-accent hover:text-accent"
              >
                <Plus className="h-3.5 w-3.5" /> add
              </button>
            </div>
          )}

          {/* Small, borderless sibling actions. */}
          <div className="flex items-center gap-5 text-[14px] font-medium">
            {loopIn.length === 0 && (
              <button
                type="button"
                onClick={() => setPeopleOpen(true)}
                className="flex items-center gap-1.5 text-ink-soft"
              >
                <Users className="h-4 w-4" /> add people
              </button>
            )}
            {!noteOpen && (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="flex items-center gap-1.5 text-ink-soft"
              >
                <Plus className="h-4 w-4" /> add a note
              </button>
            )}
            {media.length === 0 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-ink-soft disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? "Uploading…" : "add photo or video"}
              </button>
            )}
            {noteOpen && (
              <button
                type="button"
                onClick={() => {
                  setNoteOpen(false);
                  setContext("");
                }}
                className="ml-auto text-muted"
              >
                remove note
              </button>
            )}
          </div>

          {media.length > 0 && (
            <MediaStrip
              items={media}
              max={MAX_MEDIA}
              onRemove={(url) => setMedia((m) => m.filter((u) => u !== url))}
              onAdd={() => fileRef.current?.click()}
            />
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onFiles}
            className="hidden"
          />
        </div>
      )}

      <AddPeopleSheet
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        selected={loopIn}
        onToggle={togglePerson}
      />

      {error && <p className="mt-4 text-sm text-[#d1477a]">{error}</p>}

      <Button
        full
        size="lg"
        className="mt-6"
        onClick={submit}
        loading={pending}
        disabled={!text.trim() || uploading}
      >
        {!pending && <Sparkles className="h-[18px] w-[18px]" />}
        <span className={cn(hand && "ink-hand text-[19px]")}>
          {hand ? "commit in public" : "Commit in public"}
        </span>
      </Button>
    </div>
  );
}
