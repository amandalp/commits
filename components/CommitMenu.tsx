"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Link2, Trash2 } from "lucide-react";
import { deleteCommit } from "@/lib/actions/commits";

export function CommitMenu({
  commitId,
  isOwner,
}: {
  commitId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + `/commit/${commitId}`
      );
    } catch {}
    setOpen(false);
  }

  async function remove() {
    if (!confirm("Delete this commit? This can't be undone.")) return;
    await deleteCommit(commitId);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-cream-deep"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-pop animate-rise">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-cream-deep"
          >
            <Link2 className="h-4 w-4" /> Copy link
          </button>
          {isOwner && (
            <button
              onClick={remove}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[#d1477a] hover:bg-cream-deep"
            >
              <Trash2 className="h-4 w-4" /> Delete commit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
