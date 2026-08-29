import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getUserCommits } from "@/lib/data/commits";
import { TopBar } from "@/components/TopBar";
import { CommitRow } from "@/components/CommitRow";
import { EmptyState, Button, SectionHeader } from "@/components/ui";
import { OpenList } from "@/components/OpenList";
import { byEnding, byKind } from "@/lib/types";
import { OPEN_FILTER_COOKIE, parseOpenFilter } from "@/lib/prefs";
import type { CommitView } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The personal record. Two statuses and nothing else: Open and Done.
 *
 * Open separates the two kinds of commitment the product actually has —
 * big moves (one outcome, one deadline) and everyday practices (a cadence and
 * tiny check-ins) — as passive sections, not filters. Done holds both kinds of
 * ending: shipped, and closed after a change of direction.
 */
export default async function MyCommitsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = tab === "done" ? "done" : "open";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commits = await getUserCommits(user.id, active, user.id);
  const openFilter = parseOpenFilter(
    (await cookies()).get(OPEN_FILTER_COOKIE)?.value
  );
  const { bigMoves, everyday } = byKind(commits);
  const { shipped, closed } = byEnding(commits);

  return (
    <div>
      <TopBar title="My Commits" fallbackHref="/profile" />
      <nav className="flex border-b border-border-soft px-2">
        <Tab href="/me?tab=open" label="Open" active={active === "open"} />
        <Tab href="/me?tab=done" label="Done" active={active === "done"} />
      </nav>

      {commits.length === 0 ? (
        <EmptyState
          title={active === "open" ? "Nothing open" : "Nothing finished yet"}
          body={
            active === "open"
              ? "When you commit to something, it lands here."
              : "Commitments land here once you ship them or let them go."
          }
          action={
            active === "open" ? (
              <Link href="/commit/new">
                <Button>Make a Commit</Button>
              </Link>
            ) : undefined
          }
        />
      ) : active === "open" ? (
        <OpenList
          initial={openFilter}
          hasBigMoves={bigMoves.length > 0}
          hasEveryday={everyday.length > 0}
          bigMoves={<Rows commits={bigMoves} />}
          everyday={<Rows commits={everyday} />}
        />
      ) : (
        <div className="animate-rise">
          <Section label="Shipped" commits={shipped} />
          <Section
            label="Closed"
            note="Changed direction, or deliberately let go."
            commits={closed}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  note,
  commits,
}: {
  label: string;
  note?: string;
  commits: CommitView[];
}) {
  if (commits.length === 0) return null;
  return (
    <section>
      <SectionHeader label={label} note={note} />
      <Rows commits={commits} />
    </section>
  );
}

function Rows({ commits }: { commits: CommitView[] }) {
  return commits.map((c) => <CommitRow key={c.id} commit={c} />);
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
    <Link href={href} className="relative flex-1 pb-3 pt-1 text-center sm:flex-none sm:px-8">
      <span className={cn("text-[15px] font-semibold", active ? "text-ink" : "text-muted")}>
        {label}
      </span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-14 rounded-full bg-ink sm:w-full" />
      )}
    </Link>
  );
}
