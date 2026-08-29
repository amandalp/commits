"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/lib/actions/social";
import { useAuthGate } from "./AuthGate";

export function FollowButton({
  targetId,
  initialFollowing,
  size = "md",
  name,
}: {
  targetId: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
  /** Only used to word the sign-in prompt a guest sees. */
  name?: string;
}) {
  const gate = useAuthGate();
  const [following, setFollowing] = useState(initialFollowing);
  const [hover, setHover] = useState(false);

  function onClick() {
    if (!gate.require({ kind: "follow", userId: targetId, who: name })) return;
    const next = !following;
    setFollowing(next);
    toggleFollow(targetId).then((r) => {
      if (!r.ok) setFollowing(!next);
    });
  }

  const label = following ? (hover ? "Unfollow" : "Following") : "Follow";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "rounded-full font-semibold transition-all active:scale-[0.97]",
        size === "sm" ? "h-9 px-4 text-[13.5px]" : "h-10 px-5 text-sm",
        following
          ? "border border-border bg-surface text-ink hover:border-[#d1477a] hover:text-[#d1477a]"
          : "bg-ink text-white hover:bg-ink-soft"
      )}
    >
      {label}
    </button>
  );
}
