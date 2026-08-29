"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

const getOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * The shared authentication surface: Continue with Google, Continue with email
 * (magic link), and a tucked-away password fallback for existing members.
 * Reused by the login page and the commit-first `/start` flow.
 *
 * `onBeforeAuth` fires immediately before any redirect/network auth call so a
 * caller (e.g. /start) can persist a draft that must survive the round-trip.
 */
export function AuthButtons({
  next = "/",
  onBeforeAuth,
}: {
  next?: string;
  onBeforeAuth?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [emailMode, setEmailMode] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<null | "password" | "magic" | "google">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    setPending("google");
    setError(null);
    onBeforeAuth?.();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      // On success the browser redirects to Google, so we only reach here on
      // failure. Surface the real message instead of a generic string.
      setError(
        /provider is not enabled/i.test(error.message)
          ? "Google sign-in isn't enabled in Supabase yet."
          : error.message
      );
      setPending(null);
    }
  }

  async function magicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setPending("magic");
    setError(null);
    onBeforeAuth?.();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setPending(null);
    if (error) setError(error.message);
    else setMessage("Magic link sent. Check your email.");
  }

  async function withPassword() {
    setPending("password");
    setError(null);
    setMessage(null);
    onBeforeAuth?.();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
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
    router.push(next);
  }

  return (
    <div className="space-y-2.5">
      <Button full size="lg" variant="secondary" onClick={google} loading={pending === "google"}>
        Continue with Google
      </Button>

      {!emailMode ? (
        <Button
          full
          size="lg"
          variant="secondary"
          onClick={() => {
            setEmailMode(true);
            setError(null);
            setMessage(null);
          }}
        >
          <Mail className="h-[18px] w-[18px]" /> Continue with email
        </Button>
      ) : (
        <div className="space-y-2.5 rounded-2xl border border-border bg-surface-muted p-3 animate-rise">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent"
          />

          {usePassword && (
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent animate-rise"
            />
          )}

          {error && <p className="text-sm text-[#d1477a]">{error}</p>}
          {message && <p className="text-sm text-success-strong">{message}</p>}

          {!usePassword ? (
            <>
              <Button full size="lg" onClick={magicLink} loading={pending === "magic"} disabled={!email}>
                <Mail className="h-[18px] w-[18px]" /> Email me a magic link
              </Button>
              <button
                type="button"
                onClick={() => {
                  setUsePassword(true);
                  setError(null);
                  setMessage(null);
                }}
                className="w-full text-center text-[13px] text-muted hover:text-ink"
              >
                Use a password instead
              </button>
            </>
          ) : (
            <>
              <Button
                full
                size="lg"
                onClick={withPassword}
                loading={pending === "password"}
                disabled={!email || password.length < 6}
              >
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
              <div className="flex items-center justify-between text-[13px] text-muted">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-medium text-accent"
                >
                  {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsePassword(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="hover:text-ink"
                >
                  Use a magic link
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
