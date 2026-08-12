"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

/** Clears the unread badge shortly after the Activity screen is viewed. */
export function MarkReadOnMount({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(() => {
      markAllNotificationsRead();
    }, 1200);
    return () => clearTimeout(t);
  }, [hasUnread]);
  return null;
}
