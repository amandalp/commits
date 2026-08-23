import { createClient } from "@/lib/supabase/server";
import type { CheckIn } from "@/lib/types";

/** Every check-in logged against a commit, oldest first. */
export async function getCheckIns(commitId: string): Promise<CheckIn[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("check_ins")
    .select("day, status")
    .eq("commit_id", commitId)
    .order("day", { ascending: true });

  return (data ?? []).map((r) => ({ day: r.day, status: r.status }));
}

/** Check-in counts for a set of commits — used for compact progress lines. */
export async function getCheckInCounts(
  commitIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!commitIds.length) return counts;

  const supabase = await createClient();
  const { data } = await supabase
    .from("check_ins")
    .select("commit_id, status")
    .in("commit_id", commitIds)
    .eq("status", "done");

  for (const row of data ?? [])
    counts.set(row.commit_id, (counts.get(row.commit_id) ?? 0) + 1);
  return counts;
}
