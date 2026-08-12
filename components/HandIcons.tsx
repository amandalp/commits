/**
 * Loosely hand-drawn action icons for the handwritten theme. Drawn as a single
 * continuous marker stroke with round caps and a little overshoot where the
 * line crosses back over itself — so they read like quick sketches next to the
 * script type. Color is inherited via currentColor, like lucide icons.
 */

export function HandHeart({
  className,
  filled = false,
  strokeWidth = 2.1,
}: {
  className?: string;
  filled?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.5 20.3c-1-1.1-7.2-5.4-8.2-10.4C3.7 6.5 6 4.1 8.5 4.5c1.9.3 3 1.9 3.6 3.1.6-1.4 1.9-3 4-3 2.6 0 4.5 2.4 3.9 5.4-1 5-7.1 9.2-8.1 10.5" />
    </svg>
  );
}

export function HandComment({
  className,
  strokeWidth = 2.1,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.9 18.9c.8-.9 1.3-1.9 1.2-2.7-1.2-1.2-1.9-2.8-1.9-4.4C4.1 7.5 7.7 4.6 12.1 4.7c4.4 0 7.7 3 7.6 7.1-.1 4-3.7 6.8-8 6.7-1.1 0-2.1-.2-3-.5-1.4.8-3.1 1.3-4.5 1.3" />
    </svg>
  );
}
