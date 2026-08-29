import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Duration } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Relative "2m", "5h", "3d" style timestamp used in the feed. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 45) return "now";
  if (secs < 90) return "1m";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "August 27": the deadline as shown in the commitment sentence. */
export function deadlineLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "Aug 27" / "Aug 27, 2027": a compact date for tails and captions. */
export function deadlineLabelShort(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "30 days" / "1 month" / "24 hours": a commitment framed as a stretch of time. */
export function durationLabel({ amount, unit }: Duration): string {
  return `${amount} ${amount === 1 ? unit.slice(0, -1) : unit}`;
}

/**
 * Where a duration lands: "Sep 21" for a run of days, and a clock time for one
 * measured in hours. "6:00 PM" today, "Sep 23, 6:00 PM" once it crosses a day.
 */
export function durationEndsLabel(iso: string, unit: Duration["unit"]): string {
  if (unit !== "hours") return deadlineLabelShort(iso);
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${deadlineLabelShort(iso)}, ${time}`;
}

/** "August 27, 6:00 PM": the commitment deadline with its time. */
export function deadlineLabelTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${deadlineLabel(iso)}, ${time}`;
}

/** "Tuesday, Aug 27 at 6:00 PM": full deadline for detail/progress. */
export function deadlineFull(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

export type Countdown = {
  overdue: boolean;
  dueSoon: boolean; // within 24h
  label: string; // "Due in 3 days" / "Due tomorrow" / "Overdue by 2 days"
};

export function countdown(iso: string): Countdown {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);

  const unit = () => {
    if (mins < 60) return `${Math.max(1, mins)} min${mins === 1 ? "" : "s"}`;
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"}`;
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  if (diff < 0) {
    return {
      overdue: true,
      dueSoon: false,
      label: hrs < 24 ? "Overdue" : `Overdue by ${unit()}`,
    };
  }

  const dueSoon = diff <= 86400000;
  let label: string;
  if (hrs < 1) label = `Due in ${unit()}`;
  else if (hrs < 24) label = `Due in ${unit()}`;
  else if (days === 1) label = "Due tomorrow";
  else label = `Due in ${unit()}`;

  return { overdue: false, dueSoon, label };
}

/** 0..1 progress across a commit's lifespan for the subtle time bar. */
export function lifeProgress(createdAt: string, deadline: string): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

const NAME_COLORS = [
  "#6d5ae6",
  "#2f9e63",
  "#c9772f",
  "#d1477a",
  "#3b82c4",
  "#8a5cf6",
  "#c2410c",
];

/** Deterministic fallback avatar color from a user id/name. */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Compact social counts: 1.2k etc. */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "") + "k";
}

export function usernameOk(u: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

/** True when a media URL points at a video file we should render with <video>. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)($|\?)/i.test(url);
}
