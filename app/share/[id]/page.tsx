import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import { Button } from "@/components/ui";
import { deadlineLabel, durationLabel } from "@/lib/utils";
import type { Duration, DurationUnit, Person } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPublic(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commits")
    .select(
      "id, text, deadline, duration_amount, duration_unit, status, shipped_at, author:profiles!commits_user_id_fkey(id, name, username, avatar_url)"
    )
    .eq("id", id)
    .maybeSingle();
  return data as
    | {
        id: string;
        text: string;
        deadline: string;
        duration_amount: number | null;
        duration_unit: DurationUnit | null;
        status: string;
        shipped_at: string | null;
        author: Person;
      }
    | null;
}

/** The commit's own framing: "for 30 days" when it has one, else "by <date>". */
function framing(c: {
  deadline: string;
  duration_amount: number | null;
  duration_unit: DurationUnit | null;
}): { duration: Duration | null; phrase: string } {
  const duration =
    c.duration_amount && c.duration_unit
      ? { amount: c.duration_amount, unit: c.duration_unit }
      : null;
  return {
    duration,
    phrase: duration ? `for ${durationLabel(duration)}` : `by ${deadlineLabel(c.deadline)}`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await getPublic(id);
  if (!c) return { title: "Commits" };

  const shipped = c.status === "shipped";
  const name = c.author.name;
  const { phrase } = framing(c);

  // Generic they/them keeps the copy correct for every author — we don't
  // store anyone's pronouns, and guessing from a name would misgender people.
  const title = shipped ? `${name} did it` : `${name} is committing out loud`;
  const description = shipped
    ? `${name} said they’d ${c.text} ${phrase} — and they did. See what happened.`
    : `${name} is going to ${c.text} ${phrase}. Hold them to it — or commit to something of your own.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/share/${c.id}`,
      siteName: "Commits",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getPublic(id);
  if (!c) notFound();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center text-2xl font-extrabold tracking-tight text-ink">
        Commits
      </div>
      <div className="mx-auto w-full max-w-[320px]">
        <ShareCard
          text={c.text}
          deadline={c.deadline}
          duration={framing(c).duration}
          author={c.author}
          shipped={c.status === "shipped"}
        />
      </div>
      <div className="mt-8 space-y-2.5">
        <Link href={`/commit/${c.id}`}>
          <Button full size="lg">
            Open in Commits
          </Button>
        </Link>
        <Link href="/login">
          <Button full size="lg" variant="secondary">
            Make your own commitment
          </Button>
        </Link>
      </div>
    </div>
  );
}
