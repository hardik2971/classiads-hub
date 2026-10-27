import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Badge({
  children,
  color = "default",
  className,
}: {
  children: React.ReactNode;
  color?: "default" | "brand" | "accent" | "green" | "red";
  className?: string;
}) {
  const colors = {
    default: "bg-black/[0.06] text-foreground",
    brand: "bg-brand/10 text-brand",
    accent: "bg-accent/15 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = "📭",
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

/** Loading spinner while fetching, or a not-found state once the fetch settled. */
export function PageState({ loading, title }: { loading: boolean; title: string }) {
  return (
    <Container className="py-16">
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
        </div>
      ) : (
        <EmptyState title={title} subtitle="It may have been removed or the link is incorrect." icon="🔎" />
      )}
    </Container>
  );
}
