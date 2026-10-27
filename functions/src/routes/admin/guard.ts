import type { NextFunction, Request, Response } from "express";
import { isAdmin, isStaff } from "../../lib/auth";
import { ApiError, h } from "../../lib/http";
import { C, allCached } from "../../lib/store";

/** Admin modules — used for role permissions (staff) and the admin sidebar. */
export const MODULES = [
  "dashboard",
  "ads",
  "categories",
  "custom_fields",
  "content",
  "chat",
  "packages",
  "transactions",
  "sellers",
  "blogs",
  "customers",
  "roles",
  "staff",
  "locations",
  "reports",
  "notifications",
  "settings",
] as const;

/**
 * Staff may use a module when one of their roles grants it (roles/{name}.permissions).
 * Admins and super-admins can use everything.
 */
export type Module = (typeof MODULES)[number];

/**
 * `readBy` lists other modules whose pages need this data as a lookup (e.g. the Slider page lists
 * categories and approved ads); staff with one of those modules may GET it but not change it.
 */
export const can = (module: Module, readBy: readonly Module[] = []) =>
  h(async (req: Request, _res: Response, next: NextFunction) => {
    const u = req.user;
    if (isAdmin(u)) return next();
    if (!isStaff(u)) throw new ApiError("You do not have permission to perform this action.", 403);
    const granted = await permissionsFor(u!.roles ?? []);
    const lookup = req.method === "GET" && readBy.some((m) => granted.includes(m));
    if (!granted.includes(module) && module !== "dashboard" && !lookup) throw new ApiError("You do not have permission to perform this action.", 403);
    next();
  });

const BUILT_IN = ["staff", "customer", "seller", "admin", "super-admin"];

/**
 * Role definitions that apply to a user. Staff accounts carry the "staff" marker plus their assigned
 * role; a role definition that happens to be named "staff" only applies when no other role is assigned,
 * otherwise every staff member would inherit it and a narrower custom role could never restrict access.
 */
export function effectiveRoles(roles: string[]): string[] {
  const assigned = roles.filter((r) => !BUILT_IN.includes(r));
  return assigned.length ? assigned : roles.includes("staff") ? ["staff"] : [];
}

export async function permissionsFor(roles: string[]): Promise<string[]> {
  if (roles.some((r) => r === "admin" || r === "super-admin")) return [...MODULES];
  const defs = await allCached(C.roles);
  const names = effectiveRoles(roles);
  return [...new Set(["dashboard", ...defs.filter((r) => names.includes(r.name)).flatMap((r) => r.permissions ?? [])])];
}
