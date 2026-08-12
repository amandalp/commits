"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Wordmark } from "./Wordmark";
import { useThemeStyle } from "./ThemeStyle";
import type { SessionUser } from "@/lib/data/session";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
};

function items(username: string): NavItem[] {
  return [
    { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
    {
      href: "/activity",
      label: "Activity",
      icon: Bell,
      match: (p) => p.startsWith("/activity"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      match: (p) => p === "/profile" || p === `/u/${username}` || p === "/me",
    },
  ];
}

function BottomTab({
  item,
  pathname,
  unread,
}: {
  item: NavItem;
  pathname: string;
  unread: number;
}) {
  const active = item.match(pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
    >
      <span className="relative">
        <Icon
          className={cn("h-6 w-6", active ? "text-ink" : "text-faint")}
          strokeWidth={active ? 2.4 : 2}
        />
        {item.href === "/activity" && unread > 0 && (
          <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </span>
      <span
        className={cn(
          "text-[10.5px] font-medium",
          active ? "text-ink" : "text-faint"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

/** Mobile bottom navigation with emphasized center Commit action. */
export function BottomNav({
  user,
  unread,
}: {
  user: SessionUser;
  unread: number;
}) {
  const pathname = usePathname();
  const [home, activity, profile] = items(user.username);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-cream/90 backdrop-blur-md sm:hidden pb-safe">
      <div className="mx-auto flex max-w-[600px] items-center">
        <BottomTab item={home} pathname={pathname} unread={unread} />
        <div className="flex flex-1 justify-center">
          <Link
            href="/commit/new"
            aria-label="Create a commit"
            className="flex h-12 w-12 -translate-y-1 items-center justify-center rounded-2xl bg-ink text-white shadow-card transition active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
        <BottomTab item={activity} pathname={pathname} unread={unread} />
        <BottomTab item={profile} pathname={pathname} unread={unread} />
      </div>
    </nav>
  );
}

/** Desktop left navigation. */
export function SideNav({
  user,
  unread,
}: {
  user: SessionUser;
  unread: number;
}) {
  const pathname = usePathname();
  const nav = items(user.username);
  const { hand } = useThemeStyle();

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col justify-between px-3 py-5 sm:flex">
      <div>
        <Link href="/" className="mb-6 block px-3 text-[26px] font-extrabold tracking-tight text-ink">
          <Wordmark />
        </Link>
        <div className="space-y-1">
          {nav.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 rounded-full px-3.5 py-2.5 text-[15px] font-medium transition",
                  active
                    ? "bg-cream-deep font-semibold text-ink"
                    : "text-ink-soft hover:bg-cream-deep"
                )}
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                  {item.href === "/activity" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/commit/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-ink-soft active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span className={cn(hand && "ink-hand text-[19px]")}>
            {hand ? "make a commit" : "Commit"}
          </span>
        </Link>
      </div>

      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-full p-2 transition hover:bg-cream-deep"
      >
        <Avatar person={user} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
          <div className="truncate text-[12px] text-muted">@{user.username}</div>
        </div>
      </Link>
    </aside>
  );
}
