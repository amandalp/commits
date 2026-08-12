// Seed realistic accounts + content so Commits feels alive on first open.
// Run:  npm run seed   (loads .env.local via node --env-file)
//
// Idempotent: re-running finds existing auth users and rebuilds their content.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE || URL.includes("placeholder")) {
  console.error(
    "\n✗ Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n"
  );
  process.exit(1);
}

const db = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const at = (ms) => new Date(ms).toISOString();

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const DEMO_PASSWORD = "commitments";
const users = [
  {
    key: "amanda",
    email: "amanda@flossy.com",
    name: "Amanda Peterson",
    username: "amandap",
    bio: "Building things. Hosting Builder Nights.",
    location: "NYC",
    website: "linktr.ee/amandap",
  },
  { key: "maya", email: "maya@example.com", name: "Maya Chen", username: "mayachen", bio: "Runner. Designer. One race at a time.", location: "San Francisco" },
  { key: "alex", email: "alex@example.com", name: "Alex Martinez", username: "alexm", bio: "Indie hacker shipping small things.", location: "Austin", website: "alexbuilds.dev" },
  { key: "sarah", email: "sarah@example.com", name: "Sarah Kim", username: "sarahk", bio: "Product designer looking for the next thing.", location: "Seattle" },
  { key: "jordan", email: "jordan@example.com", name: "Jordan Lee", username: "jordanlee", bio: "Learning to cook for other people.", location: "Chicago" },
  { key: "priya", email: "priya@example.com", name: "Priya Patel", username: "priyawrites", bio: "Writer. Finally hitting publish.", location: "London" },
  { key: "marcus", email: "marcus@example.com", name: "Marcus Johnson", username: "marcusj", bio: "Turning talk into prototypes.", location: "Atlanta" },
  { key: "taylor", email: "taylor@example.com", name: "Taylor Kim", username: "taylork", bio: "Cheering everyone on.", location: "LA" },
  { key: "sam", email: "sam@example.com", name: "Sam Green", username: "samgreen", bio: "Shipping the beta, finally.", location: "Denver" },
];

const id = {}; // key -> user id

async function findOrCreateUsers() {
  // Page through existing users to map emails -> ids.
  const existing = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) existing.set(u.email, u.id);
    if (data.users.length < 200) break;
    page++;
  }

  for (const u of users) {
    if (existing.has(u.email)) {
      id[u.key] = existing.get(u.email);
      await db.auth.admin.updateUserById(id[u.key], {
        user_metadata: { name: u.name, username: u.username },
      });
    } else {
      const { data, error } = await db.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name, username: u.username },
      });
      if (error) throw error;
      id[u.key] = data.user.id;
    }
    // Upsert profile details (handle_new_user creates the base row).
    await db.from("profiles").upsert(
      {
        id: id[u.key],
        name: u.name,
        username: u.username,
        bio: u.bio ?? null,
        location: u.location ?? null,
        website: u.website ?? null,
      },
      { onConflict: "id" }
    );
  }
}

async function wipeContent() {
  const ids = Object.values(id);
  // Deleting commits cascades cheers/watches/comments/updates + notifications.
  await db.from("commits").delete().in("user_id", ids);
  await db.from("follows").delete().in("follower_id", ids);
  await db.from("notifications").delete().in("user_id", ids);
}

async function commit(userKey, text, opts = {}) {
  const deadline = opts.deadline ?? at(now + 7 * DAY);
  const row = {
    user_id: id[userKey],
    text,
    context: opts.context ?? null,
    deadline,
    original_deadline: opts.originalDeadline ?? deadline,
    status: opts.status ?? "active",
    parent_commit_id: opts.parent ?? null,
    created_at: opts.createdAt ?? at(now - 2 * DAY),
    shipped_at: opts.shippedAt ?? null,
    closed_at: opts.closedAt ?? null,
  };
  const { data, error } = await db.from("commits").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

async function cheer(userKey, commitId) {
  await db.from("cheers").insert({ user_id: id[userKey], commit_id: commitId });
}
async function watch(userKey, commitId) {
  await db.from("watches").insert({ user_id: id[userKey], commit_id: commitId });
}
async function follow(a, b) {
  await db.from("follows").insert({ follower_id: id[a], following_id: id[b] });
}
async function comment(userKey, commitId, text, parent = null) {
  const { data } = await db
    .from("comments")
    .insert({ user_id: id[userKey], commit_id: commitId, text, parent_comment_id: parent })
    .select("id")
    .single();
  return data?.id;
}
async function update(userKey, commitId, text, kind = "update", extra = {}) {
  await db.from("updates").insert({
    user_id: id[userKey],
    commit_id: commitId,
    text,
    kind,
    media_url: extra.media_url ?? null,
    link_url: extra.link_url ?? null,
  });
}

async function main() {
  console.log("→ Creating users…");
  await findOrCreateUsers();
  console.log("→ Clearing old seed content…");
  await wipeContent();
  console.log("→ Building the community…");

  // --- Amanda: hero commit (active, lots of social) ---
  const hero = await commit("amanda", "launch Commits at Builders Night", {
    context:
      "Excited (and a little nervous) to launch Commits at our first Builders Night. Let's go! 🚀",
    deadline: at(now + 16 * DAY + 18 * HOUR),
    createdAt: at(now - 3 * DAY),
  });

  // Amanda's other commits
  const reels = await commit("amanda", "post two Trial Reels", {
    context: "Testing a new content angle. Two reels, no excuses.",
    deadline: at(now + 1 * DAY + 8 * HOUR), // due tomorrow-ish
    createdAt: at(now - 1 * DAY),
  });
  const deck = await commit("amanda", "finish the pitch deck", {
    deadline: at(now - 8 * HOUR), // OVERDUE -> unresolved, demoes "How did it go?"
    createdAt: at(now - 4 * DAY),
  });
  await commit("amanda", "redesign the landing page", {
    status: "shipped",
    deadline: at(now - 6 * DAY),
    createdAt: at(now - 12 * DAY),
    shippedAt: at(now - 6 * DAY),
  }).then((cid) =>
    update("amanda", cid, "New landing page is live — cleaner story, faster load.", "ship", {
      link_url: "https://commits.app",
    })
  );
  await commit("amanda", "interview 3 builders for the podcast", {
    status: "shipped",
    deadline: at(now - 13 * DAY),
    createdAt: at(now - 20 * DAY),
    shippedAt: at(now - 13 * DAY),
  }).then((cid) =>
    update("amanda", cid, "Three incredible conversations in the can. Editing this week.", "ship")
  );

  // --- Other people's commits ---
  const maya10k = await commit("maya", "run my first 10K", {
    context: "Signed up for the fall race. Time to actually train.",
    deadline: at(now + 24 * DAY),
    createdAt: at(now - 2 * DAY),
  });
  const alexLanding = await commit("alex", "launch my landing page", {
    deadline: at(now + 3 * DAY + 5 * HOUR),
    createdAt: at(now - 1 * DAY),
  });
  const sarahPortfolio = await commit("sarah", "send my portfolio to five companies", {
    context: "No more perfecting. Just send it.",
    deadline: at(now + 2 * DAY + 6 * HOUR),
    createdAt: at(now - 1 * DAY),
  });
  const jordanDinner = await commit("jordan", "host my first dinner party", {
    deadline: at(now + 19 * DAY),
    createdAt: at(now - 2 * DAY),
  });
  const priyaEssay = await commit("priya", "publish the essay I've been sitting on for six months", {
    deadline: at(now + 4 * DAY + 4 * HOUR),
    createdAt: at(now - 3 * DAY),
  });
  const marcusProto = await commit("marcus", "build the prototype I've been talking about", {
    deadline: at(now + 5 * DAY + 7 * HOUR),
    createdAt: at(now - 2 * DAY),
  });

  // Sam shipped a commit that Amanda watches -> ship notification to Amanda
  const samBeta = await commit("sam", "ship the beta to my waitlist", {
    status: "shipped",
    deadline: at(now - 1 * DAY),
    createdAt: at(now - 9 * DAY),
    shippedAt: at(now - 20 * HOUR),
  });
  await watch("amanda", samBeta);
  await update("sam", samBeta, "It's out! 400 people on the waitlist just got access. 🎉", "ship");

  // --- Joins on the hero (creates linked commits -> join notifications) ---
  await commit("maya", "launch Commits at Builders Night", {
    parent: hero,
    deadline: at(now + 16 * DAY + 18 * HOUR),
    createdAt: at(now - 2 * DAY),
  });
  await commit("jordan", "launch my side project at Builders Night", {
    parent: hero,
    deadline: at(now + 16 * DAY + 18 * HOUR),
    createdAt: at(now - 1 * DAY),
  });
  await commit("alex", "demo my app at Builders Night", {
    parent: hero,
    deadline: at(now + 16 * DAY + 18 * HOUR),
    createdAt: at(now - 20 * HOUR),
  });

  // --- Cheers on the hero (notifications to Amanda) ---
  for (const k of ["maya", "jordan", "alex", "sarah", "priya", "marcus", "taylor", "sam"])
    await cheer(k, hero);

  // Cheers elsewhere
  await cheer("taylor", reels);
  await cheer("sam", reels);
  await watch("maya", deck);
  await comment("jordan", reels, "Reels era Amanda incoming 🎬");
  await cheer("amanda", maya10k);
  await cheer("taylor", maya10k);
  await cheer("sam", alexLanding);
  await cheer("amanda", priyaEssay);
  await cheer("maya", jordanDinner);
  await cheer("amanda", sarahPortfolio);
  await cheer("taylor", marcusProto);

  // --- Watches ---
  await watch("jordan", hero);
  await watch("taylor", hero);
  await watch("sam", hero);
  await watch("amanda", maya10k);
  await watch("amanda", alexLanding);

  // --- Comments (notifications to owners) ---
  const c1 = await comment("maya", hero, "So excited to see this! You got this 👏");
  await comment("amanda", hero, "Thank you Maya 🙏 See you there!", c1);
  await comment("taylor", hero, "Let's goooo 🔥");
  await comment("sam", hero, "Following this one closely.");
  await comment("amanda", maya10k, "You're going to crush it 🏃‍♀️");

  // --- Progress update on the hero (notifies watchers) ---
  await update(
    "amanda",
    hero,
    "Venue is confirmed. MVP is almost ready. Three days to go."
  );

  // --- Follows (everyone follows Amanda; Amanda follows a few back) ---
  for (const k of ["maya", "alex", "sarah", "jordan", "priya", "marcus", "taylor", "sam"])
    await follow(k, "amanda");
  await follow("amanda", "maya");
  await follow("amanda", "alex");
  await follow("amanda", "jordan");
  await follow("taylor", "maya");
  await follow("sam", "alex");

  // --- Deadline reminders for anything due within 24h ---
  const { data: dcount } = await db.rpc("generate_deadline_notifications");
  console.log(`   deadline reminders: ${dcount ?? 0}`);

  console.log("\n✓ Seed complete.");
  console.log(`   Demo login:  amanda@flossy.com  /  ${DEMO_PASSWORD}`);
  console.log("   (all seeded accounts share that password)\n");
}

main().catch((e) => {
  console.error("\n✗ Seed failed:", e.message || e);
  process.exit(1);
});
