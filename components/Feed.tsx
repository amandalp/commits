import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CommitCard, ShippedCard } from "./CommitCard";
import { EmptyState, Button } from "./ui";
import type { CommitView } from "@/lib/types";

export function Feed({
  commits,
  emptyTab,
}: {
  commits: CommitView[];
  emptyTab: "for-you" | "following";
}) {
  if (commits.length === 0) {
    return emptyTab === "following" ? (
      <EmptyState
        icon={<Sparkles className="h-6 w-6" />}
        title="Your Following feed is quiet"
        body="Follow a few people and their commitments will show up here."
        action={
          <Link href="/?tab=for-you">
            <Button variant="secondary">Explore For You</Button>
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={<Sparkles className="h-6 w-6" />}
        title="Nothing here yet"
        body="Be the first to put something on the record."
        action={
          <Link href="/commit/new">
            <Button>Make a Commit</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="animate-rise">
      {commits.map((c) =>
        c.status === "shipped" ? (
          <ShippedCard key={c.id} commit={c} />
        ) : (
          <CommitCard key={c.id} commit={c} />
        )
      )}
    </div>
  );
}
