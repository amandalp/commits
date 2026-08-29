import { redirect } from "next/navigation";
import { getViewerId } from "@/lib/data/session";
import { MarketingLanding } from "@/components/MarketingLanding";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Commits: social accountability, minus the shame",
};

export default async function WelcomePage() {
  // Signed-in users get the app, not the pitch.
  const viewerId = await getViewerId();
  if (viewerId) redirect("/");
  return <MarketingLanding />;
}
