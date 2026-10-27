"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { Container } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

const NAV: [string, string, string][] = [
  ["Overview", "/dashboard", "📊"],
  ["My Ads", "/dashboard/ads", "📦"],
  ["Favorites", "/dashboard/favorites", "❤️"],
  ["Chat", "/dashboard/chat", "💬"],
  ["Notifications", "/dashboard/notifications", "🔔"],
  ["Subscriptions", "/dashboard/subscriptions", "⭐"],
  ["Transactions", "/dashboard/transactions", "🧾"],
  ["Reviews", "/dashboard/reviews", "🌟"],
  ["Job Applications", "/dashboard/applications", "💼"],
  ["Verification", "/dashboard/verification", "✅"],
  ["Profile", "/dashboard/profile", "👤"],
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand" />
      </div>
    );
  }

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="overflow-hidden rounded-2xl border border-border bg-card">
            {NAV.map(([label, href, icon]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${
                    active ? "bg-brand/10 font-semibold text-brand" : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
