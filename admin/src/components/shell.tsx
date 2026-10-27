"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "./icon";
import { Avatar, cx, Spinner } from "./ui";

interface NavItem {
  label: string;
  icon: string;
  href?: string;
  module: string;
  children?: { label: string; href: string; module?: string }[];
}

export const NAV: NavItem[] = [
  { label: "Dashboard", icon: "home", href: "/dashboard", module: "dashboard" },
  {
    label: "Ads Listing",
    icon: "ads",
    module: "ads",
    children: [
      { label: "All Ads", href: "/ads" },
      { label: "Categories", href: "/categories", module: "categories" },
      { label: "Custom Fields", href: "/custom-fields", module: "custom_fields" },
      { label: "Jobs", href: "/jobs" },
    ],
  },
  {
    label: "Content Management",
    icon: "layout",
    module: "content",
    children: [
      { label: "Slider", href: "/content/sliders" },
      { label: "Home Screen", href: "/content/home" },
      { label: "Feature Section", href: "/content/featured-sections" },
      { label: "Offer Item Tips", href: "/content/tips" },
      { label: "Banner Ads", href: "/content/banner-ads" },
    ],
  },
  {
    label: "Chat Management",
    icon: "chat",
    module: "chat",
    children: [
      { label: "Chats", href: "/chat" },
      { label: "Chat Templates", href: "/chat/templates" },
    ],
  },
  {
    label: "Package Management",
    icon: "card",
    module: "packages",
    children: [
      { label: "Subscription Packages", href: "/packages" },
      { label: "Featured Ad Plans", href: "/packages/featured-plans" },
      { label: "User Subscriptions", href: "/packages/subscriptions" },
      { label: "Payment Transactions", href: "/packages/transactions", module: "transactions" },
      { label: "Bank Transfer", href: "/packages/bank-transfers", module: "transactions" },
    ],
  },
  {
    label: "Seller Management",
    icon: "seller",
    module: "sellers",
    children: [
      { label: "Verification Fields", href: "/sellers/verification-fields" },
      { label: "Seller Verification", href: "/sellers/verifications" },
      { label: "Seller Review", href: "/sellers/reviews" },
      { label: "Seller Review Report", href: "/sellers/review-reports" },
    ],
  },
  {
    label: "Forms & Blogs",
    icon: "file",
    module: "blogs",
    children: [
      { label: "Blogs", href: "/blogs" },
      { label: "Blog Category", href: "/blogs/categories" },
      { label: "FAQs", href: "/blogs/faqs" },
    ],
  },
  {
    label: "Customers & Roles",
    icon: "users",
    module: "customers",
    children: [
      { label: "Customers", href: "/customers" },
      { label: "Role", href: "/customers/roles", module: "roles" },
      { label: "Staff Management", href: "/customers/staff", module: "staff" },
      { label: "User Queries", href: "/customers/queries" },
    ],
  },
  {
    label: "Location",
    icon: "globe",
    module: "locations",
    children: [
      { label: "Currencies", href: "/locations/currencies" },
      { label: "Countries", href: "/locations/countries" },
      { label: "States", href: "/locations/states" },
      { label: "Cities", href: "/locations/cities" },
      { label: "Areas", href: "/locations/areas" },
    ],
  },
  {
    label: "Reports",
    icon: "flag",
    module: "reports",
    children: [
      { label: "Report Reasons", href: "/reports/reasons" },
      { label: "User Reports", href: "/reports/users" },
    ],
  },
  { label: "Notification", icon: "bell", href: "/notifications", module: "notifications" },
];

export const SETTINGS_NAV: NavItem[] = [
  { label: "Settings", icon: "settings", href: "/settings", module: "settings" },
  { label: "System Status", icon: "server", href: "/settings/system-status", module: "settings" },
];

function isActive(path: string, href: string) {
  return path === href || (href !== "/" && path.startsWith(href + "/"));
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const { can } = useAuth();
  const groupOf = (item: NavItem) => item.children?.some((c) => isActive(path, c.href)) ?? false;
  const [expanded, setExpanded] = useState<string | null>(NAV.find(groupOf)?.label ?? null);
  useEffect(() => {
    const g = NAV.find(groupOf);
    if (g) setExpanded(g.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const linkCls = (active: boolean) =>
    cx("flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] transition", active ? "bg-brand-50 font-semibold text-brand" : "text-ink hover:bg-brand-50/60 hover:text-brand");

  const renderItem = (item: NavItem) => {
    if (!can(item.module) && !(item.children ?? []).some((c) => c.module && can(c.module))) return null;
    if (!item.children)
      return (
        <a key={item.label} href={item.href} className={linkCls(isActive(path, item.href!))}>
          <Icon name={item.icon} />
          {item.label}
        </a>
      );
    const open = expanded === item.label;
    const active = groupOf(item);
    return (
      <div key={item.label}>
        <button type="button" onClick={() => setExpanded(open ? null : item.label)} className={linkCls(active)}>
          <Icon name={item.icon} />
          <span className="flex-1 text-left">{item.label}</span>
          <Icon name={open ? "chevronDown" : "chevronRight"} size={16} />
        </button>
        {open && (
          <div className="relative my-1 ml-7 border-l-2 border-line pl-3">
            {item.children
              .filter((c) => can(c.module ?? item.module))
              .map((c) => {
                const on = isActive(path, c.href);
                return (
                  <a key={c.href} href={c.href} className={cx("relative block rounded-lg px-3 py-2 text-sm transition", on ? "font-semibold text-brand" : "text-muted hover:text-brand")}>
                    {on && <span className="absolute -left-[14px] top-1 h-7 w-0.5 rounded bg-brand" />}
                    {c.label}
                  </a>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={cx("fixed inset-0 z-30 bg-ink/40 lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside className={cx("fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white shadow-[1px_0_0_#e4e4ee] transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between px-6">
          <a href="/dashboard" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ClassiAds-Hub" className="h-12 w-auto" />
          </a>
          <button onClick={onClose} className="text-ink lg:hidden" aria-label="Close menu">
            <Icon name="x" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
          {NAV.map(renderItem)}
          {SETTINGS_NAV.some((i) => can(i.module)) && <p className="px-4 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted">Settings</p>}
          {SETTINGS_NAV.map(renderItem)}
        </nav>
      </aside>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-white/95 px-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-4">
        <button onClick={onMenu} className="text-ink lg:hidden" aria-label="Open menu">
          <Icon name="menu" size={24} />
        </button>
        <span className="hidden rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-ink sm:inline">Firebase · Live</span>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://classiadshub.web.app" target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-brand sm:flex">
          <Icon name="globe" size={16} /> View site
        </a>
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-3">
            <Avatar name={user?.name} src={user?.avatar_path} size={40} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight">{user?.name}</span>
              <span className="block text-xs capitalize text-muted">{user?.roles?.filter((r) => r !== "customer").join(", ")}</span>
            </span>
            <Icon name="chevronDown" size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-line">
              <button onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/5">
                <Icon name="logout" size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, router, path]);
  useEffect(() => setOpen(false), [path]);

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center text-brand">
        <Spinner size={32} />
      </div>
    );

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="px-4 py-8 sm:px-8">{children}</main>
        <footer className="px-8 pb-6 text-right text-sm text-muted">© {new Date().getFullYear()} ClassiAds-Hub</footer>
      </div>
    </div>
  );
}
