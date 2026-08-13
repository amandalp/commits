"use client";

import { useState } from "react";
import { FollowListSheet } from "./FollowListSheet";
import { compact } from "@/lib/utils";

type Tab = "followers" | "following";

/** The Following / Followers counts on a profile — tap either to open the list. */
export function FollowStats({
  userId,
  name,
  followers,
  following,
}: {
  userId: string;
  name: string;
  followers: number;
  following: number;
}) {
  const [tab, setTab] = useState<Tab | null>(null);

  return (
    <>
      <div className="mt-3 flex gap-4 text-[13.5px]">
        <button onClick={() => setTab("following")} className="hover:underline">
          <span className="font-bold text-ink">{compact(following)}</span>{" "}
          <span className="text-muted">Following</span>
        </button>
        <button onClick={() => setTab("followers")} className="hover:underline">
          <span className="font-bold text-ink">{compact(followers)}</span>{" "}
          <span className="text-muted">Followers</span>
        </button>
      </div>

      <FollowListSheet
        userId={userId}
        name={name}
        open={tab !== null}
        initialTab={tab ?? "followers"}
        followers={followers}
        following={following}
        onClose={() => setTab(null)}
      />
    </>
  );
}
