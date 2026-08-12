import { notFound, redirect } from "next/navigation";
import { getViewerId } from "@/lib/data/session";
import { getCommit } from "@/lib/data/commits";
import { TopBar } from "@/components/TopBar";
import { ShipForm } from "@/components/ShipForm";

export const dynamic = "force-dynamic";

export default async function ShipPage({
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
      <TopBar variant="close" title="Cancel" fallbackHref={`/commit/${id}`} />
      <ShipForm commitId={id} text={commit.text} deadline={commit.original_deadline} />
    </div>
  );
}
