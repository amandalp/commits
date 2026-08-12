import { redirect } from "next/navigation";
import { getViewerId } from "@/lib/data/session";
import { getNotifications } from "@/lib/data/activity";
import { ActivityList } from "@/components/ActivityList";
import { MarkReadOnMount } from "@/components/MarkReadOnMount";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const viewerId = await getViewerId();
  if (!viewerId) redirect("/login");

  const notifications = await getNotifications(viewerId);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border-soft bg-cream/90 px-4 pb-3 pt-4 backdrop-blur-md sm:px-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Activity</h1>
      </header>
      <MarkReadOnMount hasUnread={hasUnread} />
      <ActivityList notifications={notifications} />
    </div>
  );
}
