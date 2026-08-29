import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled deadline nudges. Vercel Cron hits this hourly (see vercel.json)
 * and it fans out the "how's it going?" notifications: ~12h before each
 * deadline and ~12h after, if the commit is still open. All the windowing and
 * de-duping lives in the generate_deadline_notifications() SQL function; this
 * route just invokes it with the service role and reports how many it wrote.
 *
 * Guarded by CRON_SECRET: Vercel Cron sends `Authorization: Bearer <secret>`.
 * If CRON_SECRET is unset the route stays open (fine for local dev only).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("generate_deadline_notifications");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: data ?? 0 });
}
