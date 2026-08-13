import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import { Button } from "@/components/ui";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPublic(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commits")
    .select(
      "id, text, deadline, status, shipped_at, author:profiles!commits_user_id_fkey(id, name, username, avatar_url)"
    )
    .eq("id", id)
    .maybeSingle();
  return data as
    | {
        id: string;
        text: string;
        deadline: string;
        status: string;
        shipped_at: string | null;
        author: Person;
      }
    | null;
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
  return {
    title: shipped
      ? `${c.author.name}: I said I’d ${c.text} — said it, did it.`
      : `${c.author.name}: I'm going to ${c.text}`,
    description: shipped
      ? "Said it. Did it. See the whole story on Commits →"
      : "Put your commitments on the record. Hold me to it →",
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
