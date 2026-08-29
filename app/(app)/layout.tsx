import { getCurrentUser } from "@/lib/data/session";
import { getUnreadCount } from "@/lib/data/activity";
import { BottomNav, SideNav } from "@/components/nav";
import { AuthGateProvider } from "@/components/AuthGate";
import { PendingActions } from "@/components/PendingActions";

export const dynamic = "force-dynamic";

/**
 * The app shell, for members and guests alike. Reading Commits is public, so
 * a signed-out visitor gets the same feed inside a shell that offers an
 * account rather than demanding one. The individual actions ask, at the
 * moment they're used.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount(user.id) : 0;

  return (
    <AuthGateProvider isGuest={!user}>
      <div className="mx-auto flex min-h-screen w-full max-w-[980px] justify-center">
        {user && <PendingActions />}
        <SideNav user={user} unread={unread} />
        <main className="min-h-screen w-full max-w-[600px] flex-1 border-x border-border-soft bg-cream pb-24 sm:pb-10">
          {children}
        </main>
        <BottomNav user={user} unread={unread} />
      </div>
    </AuthGateProvider>
  );
}
