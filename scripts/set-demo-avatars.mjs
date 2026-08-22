// Non-destructive: sets avatar_url on the seeded demo profiles so the feed
// shows real photos instead of initials. Does NOT delete anything and does not
// touch any account outside the list below.
//
//   node --env-file=.env.local scripts/set-demo-avatars.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE || URL.includes("placeholder")) {
  console.error("\n✗ Missing Supabase env in .env.local\n");
  process.exit(1);
}

const db = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// username -> avatar path (served from /public)
const AVATARS = {
  mayachen: "/demo/maya.jpg",
  alexm: "/demo/alex.jpg",
  sarahk: "/demo/sarah.jpg",
  jordanlee: "/demo/jordan.jpg",
  priyawrites: "/demo/priya.jpg",
  marcusj: "/demo/marcus.jpg",
  taylork: "/demo/taylor.jpg",
  samgreen: "/demo/sam.jpg",
};

let updated = 0;
for (const [username, avatar] of Object.entries(AVATARS)) {
  const { data, error } = await db
    .from("profiles")
    .update({ avatar_url: avatar })
    .eq("username", username)
    .select("username");
  if (error) {
    console.error(`  ✗ @${username}: ${error.message}`);
    continue;
  }
  if (data?.length) {
    console.log(`  ✓ @${username} → ${avatar}`);
    updated += data.length;
  } else {
    console.log(`  – @${username} not found (skipped)`);
  }
}
console.log(`\nDone. Updated ${updated} demo profile(s).`);
