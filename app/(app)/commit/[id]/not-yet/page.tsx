import { notFound, redirect } from "next/navigation";
import { getViewerId } from "@/lib/data/session";
import { getCommit } from "@/lib/data/commits";
import { TopBar } from "@/components/TopBar";
import { NotYetForm } from "@/components/NotYetForm";

export const dynamic = "force-dynamic";

export default async function NotYetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewerId = await getViewerId();
  const commit = await getCommit(id, viewerId);
  if (!commit) notFound();
  if (!commit.is_owner) redirect(`/commit/${id}`);
  if (commit.status === "shipped" || commit.status === "closed")
    redirect(`/commit/${id}`);

  return (
    <div>
      <TopBar variant="back" title="Not yet" fallbackHref={`/commit/${id}/resolve`} />
      <NotYetForm
        commitId={id}
        text={commit.text}
        originalDeadline={commit.original_deadline}
      />
    </div>
  );
}
