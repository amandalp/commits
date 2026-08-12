import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getUnreadCount } from "@/lib/data/activity";
import { BottomNav, SideNav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const unread = await getUnreadCount(user.id);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[980px] justify-center">
      <SideNav user={user} unread={unread} />
      <main className="min-h-screen w-full max-w-[600px] flex-1 border-x border-border-soft bg-cream pb-24 sm:pb-10">
        {children}
      </main>
      <BottomNav user={user} unread={unread} />
    </div>
  );
}
