import Link from "next/link";
import { HandwrittenCard } from "@/components/HandwrittenCard";
import { AuthButtons } from "@/components/AuthButtons";

const HAND = "var(--font-hand), cursive";

// Computed per request (not during render of a client component).
const DEMO_DEADLINE = new Date(Date.now() + 16 * 864e5).toISOString();

export const metadata = {
  title: "Sign in · Commits",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-9 flex flex-col items-center text-center">
        <div className="w-64 max-w-full rotate-[-2.5deg] rounded-3xl shadow-[0_22px_50px_-14px_rgba(27,26,22,0.28)]">
          <HandwrittenCard
            text="launch my side project"
            deadline={DEMO_DEADLINE}
            author={{
              id: "demo",
              name: "Priya Nair",
              username: "priyanair",
              avatar_url: "/demo/p1.jpg",
            }}
          />
        </div>
        <p style={{ fontFamily: HAND }} className="mt-8 text-5xl font-bold leading-none text-ink">
          commits.
        </p>
        <p className="mt-3 text-[15px] text-muted">Welcome back.</p>
      </div>

      <AuthButtons next="/" />

      <p className="mt-6 text-center text-[14px] text-muted">
        New to Commits?{" "}
        <Link href="/start" className="font-semibold text-accent">
          Make your first commit
        </Link>
      </p>
    </div>
  );
}
