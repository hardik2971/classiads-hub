"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_NAME } from "@/lib/config";
import { clientApi } from "@/lib/api.client";
import type { Category } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Avatar } from "@/components/ui/avatar";

interface Language {
  id: number;
  name: string;
  code: string;
  flag_path: string | null;
}

const FLAG: Record<string, string> = {
  en: "🇬🇧", ar: "🇸🇦", hi: "🇮🇳", es: "🇪🇸", fr: "🇫🇷",
  de: "🇩🇪", pt: "🇵🇹", ru: "🇷🇺", zh: "🇨🇳", ja: "🇯🇵",
};

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [catFilterLabel, setCatFilterLabel] = useState("All Categories");
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState("");
  const [userMenu, setUserMenu] = useState(false);

  const [langs, setLangs] = useState<Language[]>([]);
  const [activeLang, setActiveLang] = useState("en");
  const [langOpen, setLangOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    clientApi<Language[]>("/languages", { token: null })
      .then((r) => setLangs(r.data ?? []))
      .catch(() => {});
    clientApi<Category[]>("/categories", { query: { roots_only: true }, token: null })
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {});
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (catFilter) params.set("category_slug", catFilter);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-card">
      {/* === Top row === */}
      <div className="border-b border-border shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0" aria-label={APP_NAME}>
            <Image
              src="/main-logo-webiste.png"
              alt={APP_NAME}
              width={1073}
              height={278}
              priority
              className="h-12 w-auto"
            />
          </Link>

          {/* All Categories + search input + submit pill */}
          <form
            onSubmit={submitSearch}
            className="hidden flex-1 items-center md:flex"
          >
            <div className="flex h-11 w-full max-w-2xl items-center rounded-xl border border-border bg-card">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCatOpen((v) => !v);
                    setCatQuery("");
                  }}
                  className="flex h-11 items-center gap-2 rounded-l-xl border-r border-border px-4 text-sm font-medium hover:bg-black/[0.03]"
                >
                  {catFilterLabel}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-muted">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </button>
                {catOpen && (
                  <>
                    {/* Click-outside guard */}
                    <button
                      type="button"
                      aria-hidden
                      onClick={() => setCatOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-border bg-card shadow-lg">
                      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted">
                          <path d="M21.71 20.29l-3.4-3.39A9 9 0 1 0 17 18.31l3.39 3.4a1 1 0 0 0 1.41 0 1 1 0 0 0-.09-1.42zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z" />
                        </svg>
                        <input
                          autoFocus
                          value={catQuery}
                          onChange={(e) => setCatQuery(e.target.value)}
                          placeholder="Search category…"
                          className="h-7 w-full bg-transparent text-sm outline-none"
                        />
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        <CatOption
                          selected={catFilter === ""}
                          onClick={() => {
                            setCatFilter("");
                            setCatFilterLabel("All Categories");
                            setCatOpen(false);
                          }}
                        >
                          All Categories
                        </CatOption>
                        {categories
                          .filter((c) => c.name.toLowerCase().includes(catQuery.trim().toLowerCase()))
                          .map((c) => (
                            <CatOption
                              key={c.id}
                              selected={catFilter === c.slug}
                              onClick={() => {
                                setCatFilter(c.slug);
                                setCatFilterLabel(c.name);
                                setCatOpen(false);
                              }}
                            >
                              {c.name}
                            </CatOption>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex h-11 flex-1 items-center px-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4 text-muted">
                  <path d="M21.71 20.29l-3.4-3.39A9 9 0 1 0 17 18.31l3.39 3.4a1 1 0 0 0 1.41 0 1 1 0 0 0-.09-1.42zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z" />
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search any advertisement…"
                  className="h-full w-full bg-transparent text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                aria-label="Search"
                className="grid h-11 w-12 place-items-center rounded-r-xl bg-accent text-accent-foreground hover:brightness-95"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M21.71 20.29l-3.4-3.39A9 9 0 1 0 17 18.31l3.39 3.4a1 1 0 0 0 1.41 0 1 1 0 0 0-.09-1.42zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z" />
                </svg>
              </button>
            </div>
          </form>

          <Link
            href="/nearby"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-brand lg:flex"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-brand">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
            Add Location
          </Link>

          {isAuthenticated ? (
            <div className="relative shrink-0">
              <button
                onClick={() => setUserMenu((v) => !v)}
                onBlur={() => setTimeout(() => setUserMenu(false), 150)}
                aria-label="Account menu"
                className="rounded-full"
              >
                <Avatar name={user?.name} src={user?.avatar_path} className="h-10 w-10" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <div className="px-3 py-2 text-sm font-semibold">{user?.name}</div>
                  <div className="my-1 h-px bg-border" />
                  {[
                    ["Dashboard", "/dashboard"],
                    ["My Ads", "/dashboard/ads"],
                    ["Favorites", "/dashboard/favorites"],
                    ["Chat", "/dashboard/chat"],
                    ["Subscriptions", "/dashboard/subscriptions"],
                  ].map(([label, href]) => (
                    <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-black/[0.04]">
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={logout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden shrink-0 items-center gap-1 text-sm font-medium md:flex">
              <Link href="/login" className="px-1 hover:text-brand">Login</Link>
              <span className="text-muted">|</span>
              <Link href="/register" className="px-1 hover:text-brand">Register</Link>
            </div>
          )}

          <Link
            href="/post-ad"
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground hover:brightness-95 sm:inline-flex"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
            </svg>
            Ad Listing
          </Link>

          {/* Language selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setLangOpen((v) => !v)}
              onBlur={() => setTimeout(() => setLangOpen(false), 150)}
              className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm hover:bg-black/[0.03]"
              aria-label="Language"
            >
              <span className="text-base leading-none">{FLAG[activeLang] ?? "🌐"}</span>
              <span className="font-medium lowercase">{activeLang}</span>
              <span className="text-xs">▾</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-border bg-card p-1 shadow-lg">
                {(langs.length ? langs : [{ id: 0, name: "English", code: "en", flag_path: null }]).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setActiveLang(l.code);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                  >
                    <span>{FLAG[l.code] ?? "🌐"}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Second row: category nav === */}
      <div className="border-b border-border bg-card">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {categories.slice(0, 7).map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-black/[0.04] hover:text-brand"
            >
              {c.name}
              <span className="text-xs text-muted">▾</span>
            </Link>
          ))}
          <Link
            href="/search"
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-black/[0.04] hover:text-brand"
          >
            Other
            <span className="text-xs text-muted">▾</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function DropdownItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
    >
      {children}
    </button>
  );
}

function CatOption({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-black/[0.04] ${
        selected ? "font-semibold text-brand" : "text-foreground"
      }`}
    >
      <span className="line-clamp-2">{children}</span>
      {selected && (
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-2 h-4 w-4 shrink-0 text-brand">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z" />
        </svg>
      )}
    </button>
  );
}
