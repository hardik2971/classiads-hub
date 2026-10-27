"use client";

import { AuthProvider } from "@/lib/auth";
import { UiProvider } from "./ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UiProvider>{children}</UiProvider>
    </AuthProvider>
  );
}
