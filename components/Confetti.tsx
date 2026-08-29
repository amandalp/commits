"use client";

import { useMemo } from "react";

const COLORS = ["#6d5ae6", "#2f9e63", "#c9772f", "#d1477a", "#3b82c4", "#f0c419"];

// Deterministic pseudo-random in [0,1). Pure, so it's safe during render.
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Lightweight celebratory confetti burst (CSS only). */
export function Confetti({ count = 44 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: rnd(i + 1) * 100,
        delay: rnd(i + 2) * 0.5,
        duration: 1.8 + rnd(i + 3) * 1.4,
        color: COLORS[i % COLORS.length],
        size: 6 + rnd(i + 4) * 6,
        rotate: rnd(i + 5) * 360,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-5%",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
