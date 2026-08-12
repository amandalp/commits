import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getUserCommits } from "@/lib/data/commits";
import { TopBar } from "@/components/TopBar";
import { CommitRow } from "@/components/CommitRow";
import { EmptyState, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCommitsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = tab === "shipped" ? "shipped" : "active";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commits = await getUserCommits(user.id, active, user.id);

  return (
    <div>
      <TopBar title="My Commits" fallbackHref="/profile" />
      <nav className="flex border-b border-border-soft px-2">
        <Tab href="/me?tab=active" label="Active" active={active === "active"} />
        <Tab href="/me?tab=shipped" label="Shipped" active={active === "shipped"} />
      </nav>

      {commits.length === 0 ? (
        <EmptyState
          title={active === "active" ? "No active commitments" : "Nothing shipped yet"}
          body={
            active === "active"
              ? "When you commit to something, it lands here."
              : "Ship a commitment to see it here."
          }
          action={
            active === "active" ? (
              <Link href="/commit/new">
                <Button>Make a Commit</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="animate-rise">
          {commits.map((c) => (
            <CommitRow key={c.id} commit={c} />
          ))}
        </div>
      )}
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
