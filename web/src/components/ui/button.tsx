import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-foreground hover:brightness-110",
  accent: "bg-accent text-accent-foreground hover:brightness-95",
  outline: "border border-border bg-card text-foreground hover:bg-black/[0.03]",
  ghost: "text-foreground hover:bg-black/[0.05]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
