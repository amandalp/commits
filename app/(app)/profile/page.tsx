import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/session";
import { getProfileById } from "@/lib/data/profile";
import { getUserCommits } from "@/lib/data/commits";
import Link from "next/link";
import { Settings } from "lucide-react";
import { ProfileView } from "@/components/ProfileView";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = tab === "shipped" ? "shipped" : "active";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(user.id, user.id);
  if (!profile) redirect("/onboarding");
  const commits = await getUserCommits(user.id, active, user.id);

  return (
    <div>
      <TopBar
        title={profile.name}
        right={
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-cream-deep hover:text-ink"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />
      <ProfileView
        profile={profile}
        activeTab={active}
        commits={commits}
        basePath="/profile"
      />
    </div>
  );
}
