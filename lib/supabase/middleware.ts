import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/start", "/welcome", "/auth", "/share", "/_next", "/favicon"];

/** Refreshes the Supabase session and gates authenticated routes. */
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
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    // Logged-out visitors see the marketing page at the root URL (rewrite keeps
    // the address bar at "/"); other deep links route to sign-in.
    if (path === "/") {
      url.pathname = "/welcome";
      return NextResponse.rewrite(url);
    }
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in users who still need to pick a username go to onboarding.
  if (user && !isPublic && !path.startsWith("/onboarding")) {
    if (!user.user_metadata?.username) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Already-onboarded users shouldn't sit on the onboarding screen.
  if (user && path.startsWith("/onboarding") && user.user_metadata?.username) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
