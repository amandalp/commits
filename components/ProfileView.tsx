import Link from "next/link";
import { MapPin, Link as LinkIcon, ListChecks } from "lucide-react";
import { Avatar } from "./Avatar";
import { InstagramIcon, TikTokIcon, XIcon } from "./SocialIcons";
import { FollowButton } from "./FollowButton";
import { EditProfileSheet } from "./EditProfileSheet";
import { CommitCard, ShippedCard } from "./CommitCard";
import { EmptyState, Button } from "./ui";
import { cn, compact } from "@/lib/utils";
import type { CommitView, ProfileFull } from "@/lib/types";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[17px] font-bold text-ink">{compact(value)}</span>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}

export function ProfileView({
  profile,
  activeTab,
  commits,
  basePath,
}: {
  profile: ProfileFull;
  activeTab: "active" | "shipped";
  commits: CommitView[];
  basePath: string; // "/profile" or "/u/username"
}) {
  const websiteHref = profile.website
    ? profile.website.startsWith("http")
      ? profile.website
      : `https://${profile.website}`
    : null;

  return (
    <div>
      <div className="px-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between">
          <Avatar person={profile} size="xl" />
          <div className="mt-2">
            {profile.is_self ? (
              <EditProfileSheet profile={profile} />
            ) : (
              <FollowButton targetId={profile.id} initialFollowing={profile.is_following} />
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-[22px] font-bold text-ink">{profile.name}</h1>
          <p className="text-[14px] text-muted">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{profile.bio}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-muted">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {profile.location}
            </span>
          )}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {profile.website!.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {(profile.instagram || profile.tiktok || profile.x) && (
          <div className="mt-2.5 flex items-center gap-3.5 text-muted">
            {profile.instagram && (
              <SocialLink
                href={`https://instagram.com/${profile.instagram}`}
                label={`Instagram: @${profile.instagram}`}
              >
                <InstagramIcon className="h-[19px] w-[19px]" />
              </SocialLink>
            )}
            {profile.tiktok && (
              <SocialLink
                href={`https://tiktok.com/@${profile.tiktok}`}
                label={`TikTok: @${profile.tiktok}`}
              >
                <TikTokIcon className="h-[19px] w-[19px]" />
              </SocialLink>
            )}
            {profile.x && (
              <SocialLink href={`https://x.com/${profile.x}`} label={`X: @${profile.x}`}>
                <XIcon className="h-[17px] w-[17px]" />
              </SocialLink>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-4 text-[13.5px]">
          <span>
            <span className="font-bold text-ink">{compact(profile.following)}</span>{" "}
            <span className="text-muted">Following</span>
          </span>
          <span>
            <span className="font-bold text-ink">{compact(profile.followers)}</span>{" "}
            <span className="text-muted">Followers</span>
          </span>
        </div>

        <div className="mt-4 flex items-center gap-5 rounded-2xl border border-border bg-surface px-4 py-3">
          <Stat value={profile.commits} label="Commits" />
          <span className="h-8 w-px bg-border-soft" />
          <Stat value={profile.shipped} label="Shipped" />
          <span className="h-8 w-px bg-border-soft" />
          <Stat value={profile.cheers_received} label="Cheers" />
        </div>

        {profile.is_self && (
          <Link
            href="/me"
            className="mt-3 flex items-center gap-2 text-[14px] font-medium text-ink-soft hover:text-ink"
          >
            <ListChecks className="h-4 w-4" /> Manage my commits →
          </Link>
        )}
      </div>

      {/* tabs */}
      <nav className="mt-4 flex border-b border-border-soft px-2">
        <TabLink href={`${basePath}?tab=active`} label="Active" active={activeTab === "active"} />
        <TabLink
          href={`${basePath}?tab=shipped`}
          label="Shipped"
          active={activeTab === "shipped"}
        />
      </nav>

      {commits.length === 0 ? (
        <EmptyState
          title={activeTab === "active" ? "No active commitments" : "Nothing shipped yet"}
          body={
            profile.is_self
              ? activeTab === "active"
                ? "Put something on the record."
                : "Ship an active commitment and it shows up here."
              : `${profile.name.split(" ")[0]} hasn't posted here yet.`
          }
          action={
            profile.is_self && activeTab === "active" ? (
              <Link href="/commit/new">
                <Button>Make a Commit</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="animate-rise">
          {commits.map((c) =>
            activeTab === "shipped" ? (
              <ShippedCard key={c.id} commit={c} />
            ) : (
              <CommitCard key={c.id} commit={c} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="text-muted transition-colors hover:text-ink"
    >
      {children}
    </a>
  );
}

function TabLink({
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
      <span
        className={cn(
          "text-[15px] font-semibold",
          active ? "text-ink" : "text-muted"
        )}
      >
        {label}
      </span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-14 rounded-full bg-ink sm:w-full" />
      )}
    </Link>
  );
}
