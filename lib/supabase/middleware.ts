import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Paths that need an identity. Everything else is public.
 *
 * Reading Commits is public: the feed, individual commitments, profiles,
 * updates and share links all render for signed-out visitors, the way X or
 * Reddit do. Authentication belongs at the moment of intent, not at the door,
 * so the only routes listed here are the ones that *act* as you: publishing,
 * resolving, your own notifications and settings.
 */
const PRIVATE_PREFIXES = ["/activity", "/settings", "/profile", "/me", "/onboarding"];

/** Owner-only sub-routes of an otherwise public commitment page. */
const PRIVATE_COMMIT_ACTION = /^\/commit\/[^/]+\/(ship|not-yet|resolve)$/;

/**
 * Routes the half-finished-signup redirect must never catch: the auth flow
 * itself, the pages that explain the product, and anything a crawler fetches.
 */
const ONBOARDING_EXEMPT = [
  "/auth",
  "/onboarding",
  "/login",
  "/start",
  "/welcome",
  "/share",
  "/api",
  "/_next",
  "/favicon",
  "/opengraph-image",
  "/twitter-image",
];

function requiresAuth(path: string): boolean {
  // Guests compose at /start, which is commit-first and asks for an account
  // only once the card is written.
  if (path === "/commit/new") return true;
  if (PRIVATE_COMMIT_ACTION.test(path)) return true;
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path.startsWith(p));

/** Refreshes the Supabase session and gates the handful of private routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user) {
    if (!requiresAuth(path)) return response;
    const url = request.nextUrl.clone();
    if (path === "/commit/new") {
      // Writing a commitment doesn't need an account until it's ready to
      // publish, so send them through the commit-first flow instead of a wall.
      url.pathname = "/start";
      url.search = "";
    } else {
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    }
    return NextResponse.redirect(url);
  }

  // Signed-in users who still need to pick a username go to onboarding.
  if (
    !user.user_metadata?.username &&
    !startsWithAny(path, ONBOARDING_EXEMPT)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Already-onboarded users shouldn't sit on the onboarding screen.
  if (path.startsWith("/onboarding") && user.user_metadata?.username) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
