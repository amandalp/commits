"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { ShareCard } from "@/components/ShareCard";
import { Wordmark } from "@/components/Wordmark";
import { Mail, Sparkles } from "lucide-react";

// Computed once at module load (not during render).
const DEMO_DEADLINE = new Date(Date.now() + 16 * 864e5).toISOString();
const getOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "password" | "magic" | "google">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function withPassword() {
    setPending("password");
    setError(null);
    setMessage(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${getOrigin()}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setPending(null);
        return;
      }
      if (!data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
        setPending(null);
        setMode("signin");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(null);
        return;
      }
    }
    router.refresh();
    router.push("/");
  }

  async function magicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setPending("magic");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${getOrigin()}/auth/callback` },
    });
    setPending(null);
    if (error) setError(error.message);
    else setMessage("Magic link sent — check your email.");
  }

  async function google() {
    setPending("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getOrigin()}/auth/callback` },
    });
    if (error) {
      // On success the browser redirects to Google, so we only reach here on
      // failure. Surface the real message (e.g. provider disabled, redirect
      // URI mismatch) instead of hiding it behind a generic string.
      setError(
        /provider is not enabled/i.test(error.message)
          ? "Google sign-in isn't enabled in Supabase yet."
          : error.message
      );
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-52 rotate-[-3deg]">
            <ShareCard
              text="launch Commits at Builders Night"
              deadline={DEMO_DEADLINE}
              author={{
                id: "demo",
                name: "Amanda Peterson",
                username: "amandap",
                avatar_url: null,
              }}
            />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">
          <Wordmark />
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Say what you&apos;re going to do. Put it on the record.
        </p>
      </div>

      <div className="space-y-2.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] text-ink outline-none focus:border-accent"
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-[15px] text-ink outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-[#d1477a]">{error}</p>}
        {message && <p className="text-sm text-success-strong">{message}</p>}

        <Button
          full
          size="lg"
          onClick={withPassword}
          loading={pending === "password"}
          disabled={!email || password.length < 6}
        >
          <Sparkles className="h-[18px] w-[18px]" />
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <div className="flex items-center gap-3 py-1 text-[13px] text-faint">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          full
          size="lg"
          variant="secondary"
          onClick={magicLink}
          loading={pending === "magic"}
        >
          <Mail className="h-[18px] w-[18px]" /> Email me a magic link
        </Button>
        <Button
          full
          size="lg"
          variant="secondary"
          onClick={google}
          loading={pending === "google"}
        >
          Continue with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-[14px] text-muted">
        {mode === "signup" ? "Already have an account?" : "New to Commits?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setMessage(null);
          }}
          className="font-semibold text-accent"
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}
