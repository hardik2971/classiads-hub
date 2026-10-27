import Image from "next/image";
import Link from "next/link";

import { APP_NAME } from "@/lib/config";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center" aria-label={APP_NAME}>
          <Image
            src="/main-logo-webiste.png"
            alt={APP_NAME}
            width={1073}
            height={278}
            priority
            className="h-12 w-auto"
          />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
