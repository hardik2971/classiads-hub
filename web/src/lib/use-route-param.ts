"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Value of the `index`-th path segment of the browser URL. Dynamic routes are exported as a
 * single `_` placeholder page that Firebase Hosting serves for every slug, so the real value
 * must be read from the URL rather than from route params.
 */
export function useRouteParam(index: number): string | null {
  const pathname = usePathname();
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const seg = window.location.pathname.split("/").filter(Boolean)[index];
    setValue(seg ? decodeURIComponent(seg) : "");
  }, [pathname, index]);
  return value;
}
