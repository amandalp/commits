"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sheet } from "./Sheet";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { getFollowList } from "@/lib/actions/social";
import { cn, compact } from "@/lib/utils";
import type { PersonWithFollow } from "@/lib/types";

type Tab = "followers" | "following";

/**
 * Threads-style tabbed sheet listing a profile's followers and following.
 * Fetches each tab's list on first view and caches it for the session.
 */
export function FollowListSheet({
  userId,
  name,
  open,
  initialTab,
  followers,
  following,
  onClose,
}: {
  userId: string;
  name: string;
  open: boolean;
  initialTab: Tab;
  followers: number;
  following: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [lists, setLists] = useState<Record<Tab, PersonWithFollow[] | null>>({
    followers: null,
    following: null,
  });

  // Reset to the tab the user tapped whenever the sheet opens.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Fetch the active tab's list the first time it's shown.
  useEffect(() => {
    if (!open || lists[tab] !== null) return;
    let active = true;
    getFollowList(userId, tab).then((list) => {
      if (active) setLists((prev) => ({ ...prev, [tab]: list }));
    });
    return () => {
      active = false;
    };
  }, [open, tab, userId, lists]);

  const people = lists[tab];

  return (
    <Sheet open={open} onClose={onClose} title={name} className="sm:max-w-md">
      <div className="-mt-1 flex border-b border-border-soft">
        <TabButton
          label="Followers"
          count={followers}
          active={tab === "followers"}
          onClick={() => setTab("followers")}
        />
        <TabButton
          label="Following"
          count={following}
          active={tab === "following"}
          onClick={() => setTab("following")}
        />
      </div>

      <div className="max-h-[60vh] min-h-[8rem] overflow-y-auto pt-1">
        {people === null ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : people.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            {tab === "followers" ? "No followers yet." : "Not following anyone yet."}
          </p>
        ) : (
          people.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <Link
                href={`/u/${p.username}`}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar person={p} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{p.name}</div>
                  <div className="truncate text-[13px] text-muted">
                    @{p.username}
                    {p.bio ? ` · ${p.bio}` : ""}
                  </div>
                </div>
              </Link>
              {!p.is_self && (
                <FollowButton
                  targetId={p.id}
                  initialFollowing={p.is_following}
                  name={p.name}
                  size="sm"
                />
              )}
            </div>
          ))
        )}
      </div>
    </Sheet>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 pb-3 pt-1 text-center"
    >
      <span
        className={cn(
          "text-[15px] font-semibold",
          active ? "text-ink" : "text-muted"
        )}
      >
        {label}
        <span className="ml-1.5 text-[13px] font-normal text-muted">{compact(count)}</span>
      </span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-full rounded-full bg-ink" />
      )}
    </button>
  );
}
