"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthButtons } from "./AuthButtons";
import { Sheet } from "./Sheet";
import { savePendingIntent, type GateIntent } from "@/lib/intent";

/**
 * Copy for the moment of intent. A prompt should explain what authenticating
 * *gets you*, not announce a restriction. "Join to cheer Amanda on" lands
 * where "Sign in to continue" doesn't.
 */
function prompt(intent: GateIntent): { title: string; body: string } {
  const who = "who" in intent ? intent.who?.split(" ")[0] : undefined;
  switch (intent.kind) {
    case "cheer":
      return {
        title: who ? `Join to cheer ${who} on` : "Join to cheer this on",
        body: "Your name shows up with everyone else rooting for this.",
      };
    case "watch":
      return {
        title: "Join to see how this turns out",
        body: "We'll tell you when there's an update, and when it ships.",
      };
    case "join":
      return {
        title: who ? `Join to commit alongside ${who}` : "Join to commit alongside them",
        body: "Make it your own, with your own deadline.",
      };
    case "comment":
      return {
        title: "Join the conversation",
        body: "Say something they'll actually see.",
      };
    case "like":
      return {
        title: "Join the conversation",
        body: "Back up what someone said, with your name on it.",
      };
    case "follow":
      return {
        title: who ? `Join to follow ${who}` : "Join to follow them",
        body: "Their commitments show up in your feed.",
      };
  }
}

type Gate = {
  /** True when nobody is signed in. */
  isGuest: boolean;
  /**
   * Call before any action that needs an identity. Returns true when the
   * viewer may proceed; otherwise opens the contextual prompt and returns
   * false, having stored the intent so it replays after signup.
   */
  require: (intent: GateIntent) => boolean;
};

/**
 * Default for trees rendered without a provider. Every such surface is
 * already behind authentication, so nothing is gated.
 */
const Ctx = createContext<Gate>({ isGuest: false, require: () => true });

export const useAuthGate = () => useContext(Ctx);

export function AuthGateProvider({
  isGuest,
  children,
}: {
  isGuest: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [intent, setIntent] = useState<GateIntent | null>(null);

  const require = useCallback(
    (next: GateIntent) => {
      if (!isGuest) return true;
      setIntent(next);
      return false;
    },
    [isGuest]
  );

  const value = useMemo(() => ({ isGuest, require }), [isGuest, require]);
  const copy = intent ? prompt(intent) : null;

  return (
    <Ctx.Provider value={value}>
      {children}
      <Sheet
        open={intent !== null}
        onClose={() => setIntent(null)}
        title={copy?.title}
        subtitle={copy?.body}
      >
        <AuthButtons
          next={pathname}
          onBeforeAuth={() =>
            intent && savePendingIntent({ ...intent, returnTo: pathname })
          }
        />
        <p className="mt-5 text-center text-[13.5px] text-muted">
          No account yet? Any of these makes one.
        </p>
      </Sheet>
    </Ctx.Provider>
  );
}
