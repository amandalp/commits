"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sheet } from "./Sheet";
import { Avatar } from "./Avatar";
import { getCheerers } from "@/lib/actions/social";
import type { Person } from "@/lib/types";

/** Bottom sheet listing everyone who cheered a commit. Fetches on open. */
export function CheerersSheet({
  commitId,
  open,
  onClose,
}: {
  commitId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Person[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setPeople(null);
    getCheerers(commitId).then((list) => {
      if (active) setPeople(list);
    });
    return () => {
      active = false;
    };
  }, [open, commitId]);

  return (
    <Sheet open={open} onClose={onClose} title="Cheered by">
      {people === null ? (
        <p className="py-8 text-center text-sm text-muted">Loading…</p>
      ) : people.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No cheers yet.</p>
      ) : (
        <div className="max-h-[60vh] space-y-1 overflow-y-auto">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/u/${p.username}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-cream-deep"
            >
              <Avatar person={p} size="sm" />
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">@{p.username}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Sheet>
  );
}
