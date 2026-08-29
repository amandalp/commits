import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getViewerId } from "@/lib/data/session";
import { getProfileByUsername } from "@/lib/data/profile";
import { getUserCommits } from "@/lib/data/commits";
import { ProfileView } from "@/components/ProfileView";
import { TopBar } from "@/components/TopBar";
import { OPEN_FILTER_COOKIE, parseOpenFilter } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab } = await searchParams;
  const active = tab === "done" ? "done" : "open";
  const viewerId = await getViewerId();

  const profile = await getProfileByUsername(username, viewerId);
  if (!profile) notFound();
  if (profile.is_self) redirect(`/profile?tab=${active}`);

  const commits = await getUserCommits(profile.id, active, viewerId);

  return (
    <div>
      <TopBar title={profile.name} />
      <ProfileView
        profile={profile}
        activeTab={active}
        openFilter={parseOpenFilter((await cookies()).get(OPEN_FILTER_COOKIE)?.value)}
        commits={commits}
        basePath={`/u/${username}`}
      />
    </div>
  );
}
