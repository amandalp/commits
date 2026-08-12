import { avatarColor, initials, cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  person,
  size = "md",
  className,
  ring,
}: {
  person: Pick<Person, "name" | "avatar_url" | "id">;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const base = cn(
    "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold text-white select-none",
    SIZES[size],
    ring && "ring-2 ring-surface",
    className
  );

  if (person.avatar_url) {
    return (
      <span className={base}>
        <img
          src={person.avatar_url}
          alt={person.name}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={base}
      style={{ backgroundColor: avatarColor(person.id || person.name) }}
      aria-label={person.name}
    >
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({
  people,
  size = "xs",
  max = 3,
}: {
  people: Pick<Person, "name" | "avatar_url" | "id">[];
  size?: keyof typeof SIZES;
  max?: number;
}) {
  const shown = people.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size={size} ring />
      ))}
    </div>
  );
}
