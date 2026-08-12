import Link from "next/link";
import { Bell } from "lucide-react";
import { getViewerId } from "@/lib/data/session";
import { getFeed, getUnresolvedCommits } from "@/lib/data/commits";
import { getUnreadCount } from "@/lib/data/activity";
import { Feed } from "@/components/Feed";
import { Wordmark } from "@/components/Wordmark";
import { ResolveNudge } from "@/components/ResolveNudge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = tab === "following" ? "following" : "for-you";
  const viewerId = await getViewerId();

  const [commits, unresolved, unread] = await Promise.all([
    getFeed(active, viewerId),
    viewerId ? getUnresolvedCommits(viewerId) : Promise.resolve([]),
    viewerId ? getUnreadCount(viewerId) : Promise.resolve(0),
  ]);

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border-soft bg-cream/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink">
            <Wordmark />
          </h1>
          <Link
            href="/activity"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-cream-deep sm:hidden"
            aria-label="Activity"
          >
            <Bell className="h-[22px] w-[22px]" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-cream" />
            )}
          </Link>
        </div>
        <nav className="flex px-2">
          <Tab href="/?tab=for-you" label="For you" active={active === "for-you"} />
          <Tab
            href="/?tab=following"
            label="Following"
            active={active === "following"}
          />
        </nav>
      </header>

      {unresolved.length > 0 && (
        <ResolveNudge
          href={`/commit/${unresolved[0].id}/resolve`}
          count={unresolved.length}
        />
      )}

      <Feed commits={commits} emptyTab={active} />
    </div>
  );
}

function Tab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex-1 pb-3 pt-1 text-center text-[15px] font-semibold sm:flex-none sm:px-8"
    >
      <span className={cn(active ? "text-ink" : "text-muted")}>{label}</span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-14 rounded-full bg-ink sm:w-full" />
      )}
    </Link>
  );
}
