"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type ThemeStyle = "handwritten" | "clean";

type Ctx = {
  style: ThemeStyle;
  setStyle: (s: ThemeStyle) => void;
  hand: boolean;
};

const ThemeStyleContext = createContext<Ctx>({
  style: "handwritten",
  setStyle: () => {},
  hand: true,
});

export function ThemeStyleProvider({
  initial,
  children,
}: {
  initial: ThemeStyle;
  children: React.ReactNode;
}) {
  const [style, setStyleState] = useState<ThemeStyle>(initial);

  const setStyle = useCallback((s: ThemeStyle) => {
    setStyleState(s);
    // Persist for a year and flip the root attribute instantly (no reload,
    // no flash — CSS keys off [data-style] and copy off this context).
    document.cookie = `commits_theme=${s === "clean" ? "clean" : "hand"}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.setAttribute("data-style", s);
  }, []);

  return (
    <ThemeStyleContext.Provider value={{ style, setStyle, hand: style === "handwritten" }}>
      {children}
    </ThemeStyleContext.Provider>
  );
}

export function useThemeStyle() {
  return useContext(ThemeStyleContext);
}
