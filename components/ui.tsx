import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "success" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};

const VARIANTS = {
  primary:
    "bg-ink text-white hover:bg-ink-soft active:scale-[0.98] disabled:opacity-50",
  secondary:
    "bg-cream-deep text-ink hover:bg-[#e6e2d8] active:scale-[0.98] disabled:opacity-50",
  success:
    "bg-success text-white hover:bg-success-strong active:scale-[0.98] disabled:opacity-50",
  ghost: "text-ink-soft hover:bg-cream-deep active:scale-[0.98]",
  danger: "bg-[#d1477a] text-white hover:brightness-95 active:scale-[0.98]",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-full gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-full gap-2",
  lg: "h-[52px] px-6 text-base rounded-2xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  full,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-muted", className)} />;
}

export function StatusBadge({
  kind,
  className,
}: {
  kind: "shipped" | "due-soon" | "overdue" | "closed" | "active";
  className?: string;
}) {
  const map = {
    shipped: { label: "SHIPPED", cls: "bg-success-soft text-success-strong" },
    "due-soon": { label: "DUE SOON", cls: "bg-warn-soft text-warn" },
    overdue: { label: "OVERDUE", cls: "bg-warn-soft text-warn" },
    closed: { label: "CLOSED", cls: "bg-cream-deep text-muted" },
    active: { label: "ACTIVE", cls: "bg-accent-soft text-accent-strong" },
  } as const;
  const { label, cls } = map[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em]",
        cls,
        className
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-deep text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
