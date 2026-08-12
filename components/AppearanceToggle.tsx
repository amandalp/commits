"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStyle, type ThemeStyle } from "./ThemeStyle";

const HAND_UNDERLINE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 46' preserveAspectRatio='none'%3E%3Cpath d='M3 37 C 70 31 130 41 300 35' fill='none' stroke='%231b1a16' stroke-width='2.4' stroke-linecap='round' opacity='0.85'/%3E%3C/svg%3E\")";

function Preview({ variant }: { variant: ThemeStyle }) {
  const hand = variant === "handwritten";
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="text-[10px] font-medium text-muted">I&apos;m going to</div>
      <div
        className="text-ink"
        style={
          hand
            ? {
                fontFamily: "var(--font-hand), var(--font-sans)",
                fontWeight: 700,
                fontSize: 19,
                lineHeight: "1.5em",
                backgroundImage: HAND_UNDERLINE,
                backgroundRepeat: "repeat-y",
                backgroundSize: "100% 1.5em",
                display: "inline-block",
              }
            : {
                fontFamily: "var(--font-sans)",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-0.02em",
              }
        }
      >
        ship the thing
      </div>
      <div
        className="text-accent"
        style={
          hand
            ? { fontFamily: "var(--font-hand), var(--font-sans)", fontWeight: 700, fontSize: 18 }
            : { fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }
        }
      >
        by Friday
      </div>
    </div>
  );
}

export function AppearanceToggle() {
  const { style, setStyle } = useThemeStyle();

  const options: { value: ThemeStyle; label: string; note: string }[] = [
    { value: "handwritten", label: "Handwritten", note: "Warm, personal — said it, did it." },
    { value: "clean", label: "Clean", note: "Crisp and minimal." },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const active = style === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setStyle(o.value)}
            className={cn(
              "relative rounded-2xl border-2 p-3 text-left transition",
              active
                ? "border-accent bg-accent-soft/40"
                : "border-border bg-surface hover:border-border-strong"
            )}
          >
            <Preview variant={o.value} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[15px] font-semibold text-ink">{o.label}</span>
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                  active ? "border-accent bg-accent text-white" : "border-border-strong"
                )}
              >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted">{o.note}</p>
          </button>
        );
      })}
    </div>
  );
}
