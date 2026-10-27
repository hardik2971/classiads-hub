import { Router } from "express";
import { auth, bucket, db } from "../../lib/firebase";
import { hasRole, isAdmin, me, phoneAuthEmail, requireAuth, requireRole } from "../../lib/auth";
import { ApiError, boolQ, fail, filled, forbidden, h, intParam, intQ, iso, money, ms, notFound, ok, okPage, strQ } from "../../lib/http";
import { mediaUrl, storeFile } from "../../lib/media";
import { fileFor, multipart } from "../../lib/multipart";
import { audit, notifyMany, notify } from "../../lib/notify";
import { adsRes, reportRes, reviewRes, subscriptionRes, userRes, verificationRes, jobRes } from "../../lib/resources";
import { allSettings, saveSettings } from "../../lib/settings";
import { C, Doc, all, bust, col, docs, get, getMany, getOrFail, insert, lookup, ref, update } from "../../lib/store";
import { fieldError, validate } from "../../lib/validate";
import { bustAds, deleteAd } from "../ads";
import { authUid } from "../auth";
import { failTxn, fulfil, refund, txnWithRelations } from "../billing";
import { conversationMessages, conversationsPayload, recomputeSellerRating } from "../social";
import { blogAdminRouter } from "./blog";
import { crudRouter, serialize } from "./crud";
import { can, MODULES, permissionsFor } from "./guard";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin", "super-admin", "staff"));

adminRouter.get("/ping", (_req, res) => ok(res, { admin: true }, "Admin OK"));

adminRouter.get(
  "/me",
  h(async (req, res) => {
    const u = me(req);
    ok(res, { user: userRes(u), permissions: await permissionsFor(u.roles ?? []), modules: MODULES }, "OK");
  }),
);

adminRouter.use(crudRouter);
adminRouter.use(blogAdminRouter);

// ---------- dashboard ----------

adminRouter.get(
  "/dashboard",
  can("dashboard"),
  h(async (req, res) => {
    const year = intQ(req, "year", new Date().getUTCFullYear());
    const [ads, users, subs, txns, favCount, reviewCount, categories, reports, convos, sales] = await Promise.all([
      all(C.ads),
      all(C.users),
      all(C.subscriptions),
      all(C.transactions),
      col(C.favorites).count().get(),
      col(C.reviews).count().get(),
      lookup(C.categories),
      all(C.reports),
      all(C.conversations),
      all(C.adSales),
    ]);
    const now = Date.now();
    const isExpired = (a: Doc) => a.status === "expired" || (a.status === "approved" && a.expires_at && ms(a.expires_at) <= now);
    const completed = txns.filter((t) => t.status === "completed");
    const revenue = completed.reduce((s, t) => s + Number(t.total ?? 0), 0);

    const monthly = Array.from({ length: 12 }, (_, m) => ({ month: m + 1, subscription: 0, featured_ad: 0 }));
    for (const t of completed) {
      const d = new Date(ms(t.paid_at ?? t.created_at));
      if (d.getUTCFullYear() !== year) continue;
      const row = monthly[d.getUTCMonth()];
      if (t.type === "subscription") row.subscription += Number(t.total ?? 0);
      else row.featured_ad += Number(t.total ?? 0);
    }

    const byStatus: Record<string, number> = {};
    for (const a of ads) {
      const s = isExpired(a) ? "expired" : a.status ?? "unknown";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const rootOf = (id: number): Doc | undefined => {
      let c = categories.get(id);
      while (c?.parent_id) c = categories.get(Number(c.parent_id));
      return c;
    };
    const tally = (list: Doc[]) => {
      const m = new Map<string, number>();
      for (const a of list) {
        const r = rootOf(Number(a.category_id));
        if (r) m.set(r.name, (m.get(r.name) ?? 0) + 1);
      }
      return [...m.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count);
    };

    const adCounts = new Map<number, number>();
    const soldCounts = new Map<number, number>();
    for (const a of ads) {
      adCounts.set(Number(a.user_id), (adCounts.get(Number(a.user_id)) ?? 0) + 1);
      if (a.status === "sold") soldCounts.set(Number(a.user_id), (soldCounts.get(Number(a.user_id)) ?? 0) + 1);
    }
    const userMap = new Map(users.map((u) => [u.id, u]));
    const recentAds = [...ads].sort((a, b) => ms(b.created_at) - ms(a.created_at)).slice(0, 10);
    const mostViewed = ads.filter((a) => a.status === "approved").sort((a, b) => Number(b.views_count ?? 0) - Number(a.views_count ?? 0)).slice(0, 10);
    const recentReports = [...reports].sort((a, b) => ms(b.created_at) - ms(a.created_at)).slice(0, 10);
    const reportAdIds = recentReports.filter((r) => r.reportable_type === "ad").map((r) => r.reportable_id);
    const reportAds = await getMany(C.ads, reportAdIds);
    const recentChats = [...convos].sort((a, b) => ms(b.last_message_at ?? b.created_at) - ms(a.last_message_at ?? a.created_at)).slice(0, 10);
    const chatAds = await getMany(C.ads, recentChats.map((c) => c.ad_id));

    ok(
      res,
      {
        kpis: {
          total_ads: ads.length,
          featured_ads: ads.filter((a) => a.is_featured).length,
          active_ads: ads.filter((a) => a.status === "approved" && !isExpired(a)).length,
          expired_ads: ads.filter(isExpired).length,
          sold_ads: ads.filter((a) => a.status === "sold").length,
          pending_ads: ads.filter((a) => a.status === "pending").length,
          total_users: users.filter((u) => !u.deleted_at).length,
          total_customers: users.filter((u) => !u.deleted_at && (u.roles ?? []).some((r: string) => r === "customer" || r === "seller")).length,
          subscriptions: subs.length,
          active_subscriptions: subs.filter((s) => s.status === "active").length,
          favorite_ads: favCount.data().count,
          total_reviews: reviewCount.data().count,
          total_categories: categories.size,
          total_revenue: revenue,
          total_revenue_display: money(revenue, "USD"),
        },
        revenue: { year, monthly },
        ads_by_status: byStatus,
        top_categories: tally(ads).slice(0, 5),
        sold_by_category: tally(ads.filter((a) => a.status === "sold")),
        customer_stats: {
          active: users.filter((u) => !u.deleted_at && (u.status ?? "active") === "active").length,
          inactive: users.filter((u) => !u.deleted_at && (u.status ?? "active") !== "active").length,
        },
        recent_ads: await adsRes(recentAds),
        most_viewed: await adsRes(mostViewed),
        recent_reports: recentReports.map((r) => ({
          id: r.id,
          reason: r.reason,
          status: r.status,
          reporter: userRes(userMap.get(Number(r.reporter_id)) ?? null, { roles: false }),
          ad: r.reportable_type === "ad" && reportAds.get(Number(r.reportable_id)) ? { id: r.reportable_id, title: reportAds.get(Number(r.reportable_id))!.title, slug: reportAds.get(Number(r.reportable_id))!.slug, status: reportAds.get(Number(r.reportable_id))!.status, image: mediaUrl(reportAds.get(Number(r.reportable_id))!.images?.[0]?.path), owner: userRes(userMap.get(Number(reportAds.get(Number(r.reportable_id))!.user_id)) ?? null, { roles: false }) } : null,
          created_at: iso(r.created_at),
        })),
        recent_chats: recentChats.map((c) => ({
          id: c.id,
          ad: chatAds.get(Number(c.ad_id)) ? { id: c.ad_id, title: chatAds.get(Number(c.ad_id))!.title, image: mediaUrl(chatAds.get(Number(c.ad_id))!.images?.[0]?.path) } : null,
          buyer: userRes(userMap.get(Number(c.buyer_id)) ?? null, { roles: false }),
          unread: Number(c.seller_unread ?? 0) + Number(c.buyer_unread ?? 0),
          last_message_at: iso(c.last_message_at ?? c.created_at),
        })),
        top_customers: [...adCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([uid, count]) => ({ user: userRes(userMap.get(uid) ?? null, { roles: false }), ads: count, sold: soldCounts.get(uid) ?? 0 })),
        sales_count: sales.length,
      },
      "Dashboard.",
    );
  }),
);

// ---------- ads moderation ----------

adminRouter.get(
  "/ads",
  can("ads", ["content", "notifications"]),
  h(async (req, res) => {
    let list = await all(C.ads);
    const tab = strQ(req, "tab");
    if (tab === "active") list = list.filter((a) => a.status === "approved");
    else if (tab === "requested") list = list.filter((a) => a.status === "pending");
    else if (tab === "admin") {
      const staff = new Set((await all(C.users)).filter((u) => hasRole(u, "admin", "super-admin", "staff")).map((u) => u.id));
      list = list.filter((a) => staff.has(Number(a.user_id)));
    } else if (tab === "favorite") list = list.filter((a) => Number(a.favorites_count ?? 0) > 0);
    if (filled(req, "status")) list = list.filter((a) => a.status === strQ(req, "status"));
    else if (!tab && !boolQ(req, "all") && filled(req, "legacy")) list = list.filter((a) => a.status === "pending");
    if (filled(req, "featured")) list = list.filter((a) => !!a.is_featured === boolQ(req, "featured"));
    for (const k of ["category_id", "country_id", "state_id", "city_id", "user_id"]) if (filled(req, k)) list = list.filter((a) => Number(a[k]) === intQ(req, k));
    if (filled(req, "q")) {
      const q = strQ(req, "q").toLowerCase();
      list = list.filter((a) => `${a.title} ${a.description ?? ""}`.toLowerCase().includes(q));
    }
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const per = Math.max(1, Math.min(intQ(req, "per_page", 20), 100));
    const page = Math.max(1, intQ(req, "page", 1));
    const slice = list.slice((page - 1) * per, page * per);
    ok(res, await adsRes(slice, undefined, { fields: true }), "Ads for moderation.", 200, {
      pagination: { current_page: page, per_page: per, total: list.length, last_page: Math.max(1, Math.ceil(list.length / per)), from: slice.length ? (page - 1) * per + 1 : null, to: slice.length ? (page - 1) * per + slice.length : null },
    });
  }),
);

async function setAdStatus(id: number, status: string, reason: string | null, actor: number) {
  const ad = await getOrFail(C.ads, id, "Ad");
  const patch: Record<string, unknown> = { status, rejection_reason: status === "rejected" ? reason : null };
  if (status === "approved") {
    patch.approved_at = new Date();
    patch.published_at = ad.published_at ?? new Date();
  }
  if (status === "sold") patch.sold_at = new Date();
  await update(C.ads, id, patch);
  await audit(actor, `ad.${status}`, { type: "ad", id }, reason ? { reason } : {});
  if (status === "approved" && ad.status !== "approved") await notify(Number(ad.user_id), "ad.approved", "Ad approved", `"${ad.title}" is now live.`, { ad_id: id });
  if (status === "rejected") await notify(Number(ad.user_id), "ad.rejected", "Ad rejected", `"${ad.title}" was rejected: ${reason ?? ""}`, { ad_id: id });
  return { ...ad, ...patch } as Doc;
}

adminRouter.post(
  "/ads/:id(\\d+)/approve",
  can("ads"),
  h(async (req, res) => {
    const ad = await setAdStatus(intParam(req, "id"), "approved", null, me(req).id);
    bustAds();
    ok(res, (await adsRes([ad]))[0], "Ad approved.");
  }),
);

adminRouter.post(
  "/ads/:id(\\d+)/reject",
  can("ads"),
  h(async (req, res) => {
    const d = validate(req.body, { reason: "required|string|max:255" });
    const ad = await setAdStatus(intParam(req, "id"), "rejected", d.reason, me(req).id);
    bustAds();
    ok(res, (await adsRes([ad]))[0], "Ad rejected.");
  }),
);

adminRouter.post(
  "/ads/:id(\\d+)/status",
  can("ads"),
  h(async (req, res) => {
    const d = validate(req.body, { status: "required|in:pending,approved,rejected,sold,expired,inactive,draft", reason: "nullable|string|max:255" });
    if (d.status === "rejected" && !d.reason) throw fieldError("reason", "The reason field is required.");
    const ad = await setAdStatus(intParam(req, "id"), d.status, d.reason ?? null, me(req).id);
    bustAds();
    ok(res, (await adsRes([ad]))[0], "Status updated.");
  }),
);

adminRouter.post(
  "/ads/bulk-status",
  can("ads"),
  h(async (req, res) => {
    const d = validate(req.body, { ids: "required|array", status: "required|in:pending,approved,rejected,sold,expired,inactive", reason: "nullable|string|max:255" });
    for (const id of d.ids.map(Number)) await setAdStatus(id, d.status, d.reason ?? (d.status === "rejected" ? "Rejected by admin" : null), me(req).id);
    bustAds();
    ok(res, { updated: d.ids.length }, "Ads updated.");
  }),
);

adminRouter.post(
  "/ads/:id(\\d+)/feature",
  can("ads"),
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    const featured = !ad.is_featured;
    const days = intQ(req, "days", Number(req.body?.days ?? 30)) || 30;
    const patch = { is_featured: featured, featured_until: featured ? new Date(Date.now() + days * 86400000) : null };
    await update(C.ads, ad.id, patch);
    bustAds();
    ok(res, (await adsRes([{ ...ad, ...patch }]))[0], featured ? "Ad featured." : "Feature removed.");
  }),
);

adminRouter.delete(
  "/ads/:id(\\d+)",
  can("ads"),
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    await deleteAd(ad);
    await audit(me(req).id, "ad.deleted", { type: "ad", id: ad.id });
    ok(res, null, "Ad removed.");
  }),
);

// ---------- customers ----------

adminRouter.get(
  "/users",
  can("customers", ["notifications"]),
  h(async (req, res) => {
    let users = (await all(C.users)).filter((u) => !u.deleted_at);
    if (filled(req, "role")) users = users.filter((u) => (u.roles ?? []).includes(strQ(req, "role")));
    if (boolQ(req, "customers")) users = users.filter((u) => !hasRole(u, "admin", "super-admin", "staff"));
    if (filled(req, "status")) users = users.filter((u) => (u.status ?? "active") === strQ(req, "status"));
    if (filled(req, "q")) {
      const q = strQ(req, "q").toLowerCase();
      users = users.filter((u) => `${u.name ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q));
    }
    users.sort((a, b) => b.id - a.id);
    const ads = await all(C.ads);
    const counts = new Map<number, number>();
    ads.forEach((a) => counts.set(Number(a.user_id), (counts.get(Number(a.user_id)) ?? 0) + 1));
    okPage(
      res,
      req,
      users.map((u) => userRes(u, { seller: true, extra: { ads_count: counts.get(u.id) ?? 0, address: u.address ?? null, login_type: u.login_type ?? (u.phone && !u.email ? "phone" : "email"), auto_approve_ads: !!u.auto_approve_ads, country_code: u.country_code ?? null } })),
      "Users.",
      20,
      100,
    );
  }),
);

adminRouter.get(
  "/users/:id(\\d+)",
  can("customers"),
  h(async (req, res) => {
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    const count = await col(C.ads).where("user_id", "==", u.id).count().get();
    ok(res, userRes(u, { seller: true, extra: { ads_count: count.data().count, address: u.address ?? null, auto_approve_ads: !!u.auto_approve_ads } }), "User.");
  }),
);

adminRouter.post(
  "/users/:id(\\d+)/status",
  can("customers"),
  h(async (req, res) => {
    const d = validate(req.body, { status: "required|in:active,suspended,banned" });
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    if (hasRole(u, "super-admin")) throw forbidden("Cannot modify a super-admin.");
    await update(C.users, u.id, { status: d.status });
    if (d.status !== "active") await auth.revokeRefreshTokens(authUid(u)).catch(() => undefined);
    await auth.updateUser(authUid(u), { disabled: d.status !== "active" }).catch(() => undefined);
    await audit(me(req).id, "user.status", { type: "user", id: u.id }, { status: d.status });
    ok(res, userRes({ ...u, status: d.status }), "User status updated.");
  }),
);

adminRouter.post(
  "/users/:id(\\d+)/auto-approve",
  can("customers"),
  h(async (req, res) => {
    const d = validate(req.body, { enabled: "required|boolean" });
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    await update(C.users, u.id, { auto_approve_ads: d.enabled });
    ok(res, null, d.enabled ? "Auto-approve enabled." : "Auto-approve disabled.");
  }),
);

/** Grant a package to a customer without payment (admin ⊕ action). */
adminRouter.post(
  "/users/:id(\\d+)/packages",
  can("customers"),
  h(async (req, res) => {
    const d = validate(req.body, { package_id: "required|integer" });
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    const pkg = await getOrFail(C.packages, d.package_id, "Package");
    const t = await insert(C.transactions, { user_id: u.id, type: "subscription", package_id: pkg.id, gateway: "admin", amount: 0, tax_amount: 0, total: 0, currency_code: pkg.currency_code, status: "pending" });
    await insert(C.subscriptions, { user_id: u.id, package_id: pkg.id, transaction_id: t.id, status: "pending", ad_limit: pkg.is_unlimited ? null : pkg.ad_limit ?? null, is_unlimited: !!pkg.is_unlimited, ads_used: 0 });
    await fulfil(t);
    ok(res, null, "Package assigned.", 201);
  }),
);

/** Cancel a customer's active subscriptions (admin ⊖ action). */
adminRouter.delete(
  "/users/:id(\\d+)/packages",
  can("customers"),
  h(async (req, res) => {
    const subs = docs(await col(C.subscriptions).where("user_id", "==", intParam(req, "id")).where("status", "==", "active").get());
    await Promise.all(subs.map((s) => update(C.subscriptions, s.id, { status: "cancelled" })));
    ok(res, { cancelled: subs.length }, "Packages removed.");
  }),
);

// ---------- staff ----------

adminRouter.get(
  "/staff",
  can("staff"),
  h(async (req, res) => {
    const staff = (await all(C.users)).filter((u) => !u.deleted_at && hasRole(u, "staff", "admin", "super-admin"));
    okPage(res, req, staff.sort((a, b) => a.id - b.id).map((u) => userRes(u)), "Staff.", 25, 200);
  }),
);

adminRouter.post(
  "/staff",
  can("staff"),
  h(async (req, res) => {
    const d = validate(req.body, { name: "required|string|max:150", email: "required|email|max:191", password: "required|string|min:8|raw", role: "required|string|max:100", status: "nullable|in:active,suspended" });
    const dup = (await col(C.users).where("email", "==", d.email).limit(1).get()).docs[0];
    if (dup) throw fieldError("email", "The email has already been taken.");
    const roles = d.role === "admin" ? ["admin"] : ["staff", d.role];
    if (d.role === "admin" && !isAdmin(me(req))) throw forbidden();
    const u = await insert(C.users, { name: d.name, email: d.email, phone: null, status: d.status ?? "active", roles, is_verified: true, email_verified_at: new Date(), login_type: "email" });
    try {
      await auth.createUser({ uid: String(u.id), email: d.email, password: d.password, displayName: d.name, emailVerified: true });
    } catch (e: any) {
      await ref(C.users, u.id).delete();
      throw new ApiError(e?.message ?? "Could not create staff account.", 422);
    }
    ok(res, userRes(u), "Staff created.", 201);
  }),
);

adminRouter.put(
  "/staff/:id(\\d+)",
  can("staff"),
  h(async (req, res) => {
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    if (hasRole(u, "super-admin") && !hasRole(me(req), "super-admin")) throw forbidden("Cannot modify a super-admin.");
    const d = validate(req.body, { name: "sometimes|string|max:150", email: "sometimes|email|max:191", password: "sometimes|nullable|string|min:8|raw", role: "sometimes|string|max:100", status: "sometimes|in:active,suspended" });
    const patch: Record<string, any> = {};
    if (d.name) patch.name = d.name;
    if (d.email) patch.email = d.email;
    if (d.status) patch.status = d.status;
    if (d.role && !hasRole(u, "super-admin")) patch.roles = d.role === "admin" ? ["admin"] : ["staff", d.role];
    await update(C.users, u.id, patch);
    await auth
      .updateUser(authUid(u), { ...(d.email ? { email: d.email } : {}), ...(d.password ? { password: d.password } : {}), ...(d.name ? { displayName: d.name } : {}), ...(d.status ? { disabled: d.status !== "active" } : {}) })
      .catch(async () => {
        if (d.password) await auth.createUser({ uid: authUid(u), email: d.email ?? u.email ?? phoneAuthEmail(u.phone ?? String(u.id)), password: d.password });
      });
    ok(res, userRes({ ...u, ...patch }), "Staff updated.");
  }),
);

adminRouter.delete(
  "/staff/:id(\\d+)",
  can("staff"),
  h(async (req, res) => {
    const u = await getOrFail(C.users, intParam(req, "id"), "User");
    if (hasRole(u, "super-admin") || u.id === me(req).id) throw forbidden("This account cannot be removed.");
    // Accounts that only ever were staff (created here) are deleted outright; customers/sellers that were
    // also granted staff access keep their marketplace account and just lose the admin roles.
    const customerRoles = (u.roles ?? []).filter((r: string) => r === "customer" || r === "seller");
    const ads = await col(C.ads).where("user_id", "==", u.id).limit(1).get();
    if (!customerRoles.length && ads.empty) {
      await auth.deleteUser(authUid(u)).catch(() => undefined);
      await ref(C.users, u.id).delete();
    } else {
      await update(C.users, u.id, { roles: customerRoles.length ? customerRoles : ["customer"] });
      await auth.revokeRefreshTokens(authUid(u)).catch(() => undefined);
    }
    await audit(me(req).id, "staff.removed", { type: "user", id: u.id });
    ok(res, null, "Staff removed.");
  }),
);

// ---------- chats ----------

adminRouter.get(
  "/chat/products",
  can("chat"),
  h(async (req, res) => {
    const convos = await all(C.conversations);
    const byAd = new Map<number, Doc[]>();
    convos.forEach((c) => byAd.set(Number(c.ad_id), [...(byAd.get(Number(c.ad_id)) ?? []), c]));
    const ads = await getMany(C.ads, [...byAd.keys()]);
    const users = await getMany(C.users, [...ads.values()].map((a) => a.user_id));
    let rows = [...byAd.entries()].map(([adId, list]) => {
      const ad = ads.get(adId);
      const last = list.reduce((m, c) => Math.max(m, ms(c.last_message_at ?? c.created_at)), 0);
      return {
        ad_id: adId,
        title: ad?.title ?? "Deleted ad",
        price_display: ad ? (ad.price_type === "free" ? "Free" : money(ad.price, ad.currency_code)) : null,
        image: mediaUrl(ad?.images?.[0]?.path),
        seller: userRes(users.get(Number(ad?.user_id)) ?? null, { roles: false }),
        conversations: list.length,
        last_message_at: last ? new Date(last).toISOString() : null,
      };
    });
    if (filled(req, "q")) rows = rows.filter((r) => r.title.toLowerCase().includes(strQ(req, "q").toLowerCase()));
    rows.sort((a, b) => ms(b.last_message_at) - ms(a.last_message_at));
    okPage(res, req, rows, "Products.", 50, 200);
  }),
);

adminRouter.get(
  "/conversations",
  can("chat"),
  h(async (req, res) => {
    let list = await all(C.conversations);
    if (filled(req, "ad_id")) list = list.filter((c) => Number(c.ad_id) === intQ(req, "ad_id"));
    list.sort((a, b) => ms(b.last_message_at ?? b.created_at) - ms(a.last_message_at ?? a.created_at));
    okPage(res, req, await conversationsPayload(list, undefined), "Conversations.", 50, 200);
  }),
);

adminRouter.get(
  "/conversations/:id(\\d+)",
  can("chat"),
  h(async (req, res) => {
    const c = await getOrFail(C.conversations, intParam(req, "id"), "Conversation");
    ok(res, { conversation: (await conversationsPayload([c], undefined))[0], messages: await conversationMessages(c, Number(c.seller_id), false) }, "Conversation.");
  }),
);

adminRouter.delete(
  "/conversations/:id(\\d+)",
  can("chat"),
  h(async (req, res) => {
    const id = intParam(req, "id");
    const msgs = await col(C.messages).where("conversation_id", "==", id).get();
    const batch = db.batch();
    msgs.docs.forEach((m) => batch.delete(m.ref));
    batch.delete(ref(C.conversations, id));
    await batch.commit();
    ok(res, null, "Conversation deleted.");
  }),
);

// ---------- reviews ----------

adminRouter.get(
  "/reviews",
  can("sellers"),
  h(async (req, res) => {
    let list = await all(C.reviews);
    if (filled(req, "type")) list = list.filter((r) => r.type === strQ(req, "type"));
    if (filled(req, "approved")) list = list.filter((r) => (r.is_approved !== false) === boolQ(req, "approved"));
    if (boolQ(req, "reported")) list = list.filter((r) => !!r.report_status);
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const [users, ads] = await Promise.all([getMany(C.users, list.flatMap((r) => [r.reviewer_id, r.reviewee_id])), getMany(C.ads, list.map((r) => r.ad_id))]);
    okPage(res, req, list.map((r) => reviewRes(r, users, ads)), "Reviews.");
  }),
);

adminRouter.post(
  "/reviews/:id(\\d+)/approval",
  can("sellers"),
  h(async (req, res) => {
    const d = validate(req.body, { is_approved: "required|boolean" });
    const r = await getOrFail(C.reviews, intParam(req, "id"), "Review");
    await update(C.reviews, r.id, { is_approved: d.is_approved });
    if (r.type === "seller_review") await recomputeSellerRating(Number(r.reviewee_id));
    ok(res, null, "Review updated.");
  }),
);

/** Resolve a reported review: approve the report (review removed) or reject it with a reason. */
adminRouter.post(
  "/reviews/:id(\\d+)/report",
  can("sellers"),
  h(async (req, res) => {
    const d = validate(req.body, { decision: "required|in:approved,rejected", reason: "nullable|string|max:500" });
    const r = await getOrFail(C.reviews, intParam(req, "id"), "Review");
    if (d.decision === "approved") {
      await update(C.reviews, r.id, { report_status: "approved", is_approved: false });
    } else {
      if (!d.reason) throw fieldError("reason", "The reason field is required.");
      await update(C.reviews, r.id, { report_status: "rejected", report_rejection_reason: d.reason });
    }
    if (r.type === "seller_review") await recomputeSellerRating(Number(r.reviewee_id));
    ok(res, null, "Report resolved.");
  }),
);

adminRouter.delete(
  "/reviews/:id(\\d+)",
  can("sellers"),
  h(async (req, res) => {
    const r = await getOrFail(C.reviews, intParam(req, "id"), "Review");
    await ref(C.reviews, r.id).delete();
    if (r.type === "seller_review") await recomputeSellerRating(Number(r.reviewee_id));
    ok(res, null, "Review deleted.");
  }),
);

// ---------- user reports ----------

adminRouter.get(
  "/reports",
  can("reports"),
  h(async (req, res) => {
    let list = await all(C.reports);
    if (filled(req, "status")) list = list.filter((r) => r.status === strQ(req, "status"));
    if (filled(req, "type")) list = list.filter((r) => r.reportable_type === strQ(req, "type").toLowerCase());
    if (filled(req, "user_id")) list = list.filter((r) => Number(r.reporter_id) === intQ(req, "user_id"));
    if (filled(req, "ad_id")) list = list.filter((r) => r.reportable_type === "ad" && Number(r.reportable_id) === intQ(req, "ad_id"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const adIds = list.filter((r) => r.reportable_type === "ad").map((r) => r.reportable_id);
    const [users, ads] = await Promise.all([getMany(C.users, list.map((r) => r.reporter_id)), getMany(C.ads, adIds)]);
    const owners = await getMany(C.users, [...ads.values()].map((a) => a.user_id));
    okPage(
      res,
      req,
      list.map((r) => {
        const ad = r.reportable_type === "ad" ? ads.get(Number(r.reportable_id)) : undefined;
        return reportRes(r, users, ad ? { id: ad.id, title: ad.title, slug: ad.slug, status: ad.status, is_active: ad.status === "approved", image: mediaUrl(ad.images?.[0]?.path), owner: userRes(owners.get(Number(ad.user_id)) ?? null, { roles: false }) } : null);
      }),
      "Reports.",
    );
  }),
);

adminRouter.post(
  "/reports/:id(\\d+)/status",
  can("reports"),
  h(async (req, res) => {
    const d = validate(req.body, { status: "required|in:open,reviewing,resolved,dismissed" });
    const r = await getOrFail(C.reports, intParam(req, "id"), "Report");
    const done = ["resolved", "dismissed"].includes(d.status);
    await update(C.reports, r.id, { status: d.status, resolved_by: done ? me(req).id : null, resolved_at: done ? new Date() : null });
    ok(res, null, "Report updated.");
  }),
);

// ---------- seller verification ----------

adminRouter.get(
  "/verifications",
  can("sellers"),
  h(async (req, res) => {
    let list = await all(C.verificationRequests);
    if (filled(req, "status")) list = list.filter((v) => v.status === strQ(req, "status"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const users = await getMany(C.users, list.map((v) => v.user_id));
    okPage(res, req, list.map((v) => verificationRes(v, users.get(Number(v.user_id)) ?? null)), "Verification requests.");
  }),
);

for (const action of ["approve", "reject"] as const) {
  adminRouter.post(
    `/verifications/:id(\\d+)/${action}`,
    can("sellers"),
    h(async (req, res) => {
      const v = await getOrFail(C.verificationRequests, intParam(req, "id"), "Verification request");
      const reason = action === "reject" ? validate(req.body, { reason: "required|string|max:255" }).reason : null;
      await update(C.verificationRequests, v.id, { status: action === "approve" ? "approved" : "rejected", reviewed_by: me(req).id, reviewed_at: new Date(), rejection_reason: reason });
      if (action === "approve") {
        await update(C.users, v.user_id, { is_verified: true });
        await notify(Number(v.user_id), "verification.approved", "You are verified!", "Your account has been verified. The verified badge is now on your profile.");
      } else {
        await notify(Number(v.user_id), "verification.rejected", "Verification rejected", `Your verification was rejected: ${reason}`);
      }
      await audit(me(req).id, `verification.${action === "approve" ? "approved" : "rejected"}`, { type: "verification_request", id: v.id }, reason ? { reason } : {});
      ok(res, verificationRes({ ...v, status: action === "approve" ? "approved" : "rejected", rejection_reason: reason }), action === "approve" ? "Verification approved." : "Verification rejected.");
    }),
  );
}

// ---------- jobs ----------

adminRouter.get(
  "/jobs",
  can("ads"),
  h(async (req, res) => {
    let list = await all(C.jobListings);
    if (filled(req, "status")) list = list.filter((j) => j.status === strQ(req, "status"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const [cities, categories, users] = await Promise.all([lookup(C.cities), lookup(C.categories), getMany(C.users, list.map((j) => j.user_id))]);
    okPage(res, req, list.map((j) => jobRes(j, { cities, categories, users })), "Jobs.");
  }),
);

adminRouter.post(
  "/jobs/:id(\\d+)/status",
  can("ads"),
  h(async (req, res) => {
    const d = validate(req.body, { status: "required|in:draft,open,closed" });
    const job = await getOrFail(C.jobListings, intParam(req, "id"), "Job");
    await update(C.jobListings, job.id, { status: d.status });
    ok(res, null, "Job updated.");
  }),
);

adminRouter.delete(
  "/jobs/:id(\\d+)",
  can("ads"),
  h(async (req, res) => {
    await ref(C.jobListings, intParam(req, "id")).delete();
    ok(res, null, "Job deleted.");
  }),
);

// ---------- push notifications ----------

adminRouter.get(
  "/push-notifications",
  can("notifications"),
  h(async (req, res) => {
    const list = (await all(C.pushNotifications)).sort((a, b) => b.id - a.id);
    okPage(res, req, list.map(serialize), "Push notification history.");
  }),
);

adminRouter.post(
  "/push-notifications",
  multipart,
  can("notifications"),
  h(async (req, res) => {
    const d = validate(req.body, {
      title: "required|string|max:191",
      body: "required|string|max:2000",
      target: "required|in:all,role,user,selected",
      target_role: "required_if:target,role|nullable|string|max:50",
      target_user_id: "required_if:target,user|nullable|integer",
      user_ids: "required_if:target,selected|nullable|array",
      item_type: "nullable|string|max:100",
      item_id: "nullable|integer",
      image_url: "nullable|string|max:500",
    });
    const users = (await all(C.users)).filter((u) => !u.deleted_at);
    const recipients =
      d.target === "user"
        ? users.filter((u) => u.id === d.target_user_id)
        : d.target === "selected"
          ? users.filter((u) => d.user_ids.map(Number).includes(u.id))
          : d.target === "role"
            ? users.filter((u) => (u.roles ?? []).includes(d.target_role))
            : users.filter((u) => (u.status ?? "active") === "active");
    let image = d.image_url ?? null;
    const upload = fileFor(req, "image");
    if (upload) image = mediaUrl(await storeFile(upload, "brand/notifications"));
    if (!image && d.item_type === "ad" && d.item_id) {
      const ad = await get(C.ads, d.item_id);
      image = mediaUrl(ad?.images?.[0]?.path);
    }
    const payload: Record<string, unknown> = {};
    if (d.item_type) payload.item_type = d.item_type;
    if (d.item_id) payload.item_id = d.item_id;
    const count = await notifyMany(recipients.map((u) => u.id), "admin.broadcast", d.title, d.body, payload, image);
    const row = await insert(C.pushNotifications, {
      title: d.title,
      body: d.body,
      target: d.target,
      target_role: d.target_role ?? null,
      target_user_id: d.target_user_id ?? null,
      target_user_ids: d.target === "selected" ? d.user_ids.map(Number) : null,
      item_type: d.item_type ?? null,
      item_id: d.item_id ?? null,
      image_url: image,
      sent_by: me(req).id,
      recipients_count: count,
    });
    ok(res, { id: row.id, recipients_count: count }, `Sent to ${count} recipient(s).`, 201);
  }),
);

adminRouter.delete(
  "/push-notifications/:id(\\d+)",
  can("notifications"),
  h(async (req, res) => {
    await ref(C.pushNotifications, intParam(req, "id")).delete();
    ok(res, null, "Deleted.");
  }),
);

// ---------- subscriptions / transactions ----------

adminRouter.get(
  "/subscriptions",
  can("packages"),
  h(async (req, res) => {
    let list = await all(C.subscriptions);
    if (filled(req, "status")) list = list.filter((s) => (s.status === "active" && ms(s.ends_at) && ms(s.ends_at) < Date.now() ? "expired" : s.status) === strQ(req, "status"));
    if (filled(req, "user_id")) list = list.filter((s) => Number(s.user_id) === intQ(req, "user_id"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const [pkgs, users] = await Promise.all([getMany(C.packages, list.map((s) => s.package_id)), getMany(C.users, list.map((s) => s.user_id))]);
    okPage(
      res,
      req,
      list.map((s) => {
        const r = subscriptionRes(s, pkgs.get(Number(s.package_id)) ?? null, users.get(Number(s.user_id)) ?? null);
        return { ...r, status: s.status === "active" && !r.is_live ? "expired" : s.status };
      }),
      "Subscriptions.",
    );
  }),
);

adminRouter.post(
  "/subscriptions/:id(\\d+)/cancel",
  can("packages"),
  h(async (req, res) => {
    const sub = await getOrFail(C.subscriptions, intParam(req, "id"), "Subscription");
    await update(C.subscriptions, sub.id, { status: "cancelled" });
    ok(res, null, "Subscription cancelled.");
  }),
);

adminRouter.get(
  "/transactions",
  can("transactions"),
  h(async (req, res) => {
    let list = await all(C.transactions);
    if (filled(req, "status")) list = list.filter((t) => t.status === strQ(req, "status"));
    if (filled(req, "type")) list = list.filter((t) => t.type === strQ(req, "type"));
    if (filled(req, "gateway")) list = list.filter((t) => t.gateway === strQ(req, "gateway"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    okPage(res, req, await Promise.all(list.map((t) => txnWithRelations(t, undefined, true))), "Transactions.");
  }),
);

adminRouter.post(
  "/transactions/:id(\\d+)/confirm",
  can("transactions"),
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (t.status === "completed") return ok(res, await txnWithRelations(t), "Already completed.");
    if (t.status !== "pending") return fail(res, "Transaction is not payable.", 422);
    const done = await fulfil(t);
    await audit(me(req).id, "transaction.confirmed", { type: "transaction", id: t.id });
    ok(res, await txnWithRelations(done), "Payment confirmed.");
  }),
);

adminRouter.post(
  "/transactions/:id(\\d+)/reject",
  can("transactions"),
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (t.status !== "pending") return fail(res, "Only pending transactions can be rejected.", 422);
    const done = await failTxn(t);
    const sub = docs(await col(C.subscriptions).where("transaction_id", "==", t.id).get())[0];
    if (sub) await update(C.subscriptions, sub.id, { status: "cancelled" });
    await notify(Number(t.user_id), "payment.failed", "Payment rejected", "Your bank transfer could not be verified.", { transaction_id: t.id });
    ok(res, await txnWithRelations(done), "Payment rejected.");
  }),
);

adminRouter.post(
  "/transactions/:id(\\d+)/refund",
  can("transactions"),
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (t.status !== "completed") return fail(res, "Only completed transactions can be refunded.", 422);
    ok(res, await txnWithRelations(await refund(t)), "Transaction refunded.");
  }),
);

// ---------- payment gateways ----------

adminRouter.get(
  "/payment-gateways",
  can("settings", ["transactions"]),
  h(async (_req, res) => ok(res, (await all(C.paymentGateways)).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)).map(serialize), "Payment gateways.")),
);

adminRouter.put(
  "/payment-gateways/:id(\\d+)",
  can("settings"),
  h(async (req, res) => {
    const d = validate(req.body, { name: "sometimes|string|max:100", is_active: "sometimes|boolean", mode: "sometimes|in:sandbox,live", config: "sometimes|nullable|array", supported_currencies: "sometimes|nullable|array", is_manual: "sometimes|boolean", sort_order: "sometimes|integer" });
    const id = (await getOrFail(C.paymentGateways, intParam(req, "id"), "Payment gateway")).id;
    await update(C.paymentGateways, id, d);
    bust(`all:${C.paymentGateways}`);
    ok(res, serialize((await get(C.paymentGateways, id))!), "Gateway updated.");
  }),
);

// ---------- settings ----------

/** The "home" group (Home Screen sections + popular categories) is managed from Content Management. */
const settingsGroupGuard = h(async (req, res, next) => {
  const group = String((req.method === "GET" ? req.query.group : req.body?.group) ?? "");
  return can(group === "home" ? "content" : "settings")(req, res, next);
});

adminRouter.get(
  "/settings",
  settingsGroupGuard,
  h(async (req, res) => {
    const s = await allSettings();
    if (filled(req, "group")) return ok(res, { [strQ(req, "group")]: s[strQ(req, "group")] ?? {} }, "Settings.");
    ok(res, s, "Settings.");
  }),
);

adminRouter.put(
  "/settings",
  settingsGroupGuard,
  h(async (req, res) => {
    const d = validate(req.body, { group: "required|string|max:64", settings: "required|array", secret: "nullable|array" });
    await saveSettings(d.group, d.settings, d.secret ?? []);
    await audit(me(req).id, "settings.updated", { type: "settings", id: d.group }, { keys: Object.keys(d.settings) });
    ok(res, null, "Settings updated.");
  }),
);

// ---------- file manager (Firebase Storage) ----------

adminRouter.get(
  "/files",
  can("settings"),
  h(async (req, res) => {
    const prefix = strQ(req, "prefix").replace(/^\/+/, "");
    const [files, , apiRes] = await bucket().getFiles({ prefix, delimiter: "/", autoPaginate: false, maxResults: 500 });
    const folders: string[] = ((apiRes as any)?.prefixes ?? []).map((x: string) => x);
    ok(
      res,
      {
        prefix,
        folders,
        files: files
          .filter((f) => !f.name.endsWith("/"))
          .map((f) => ({ path: f.name, name: f.name.split("/").pop(), size: Number(f.metadata.size ?? 0), content_type: f.metadata.contentType ?? null, updated: f.metadata.updated ?? null, url: ["kyc", "receipts", "resumes"].includes(f.name.split("/")[0]) ? null : mediaUrl(f.name) })),
      },
      "Files.",
    );
  }),
);

adminRouter.delete(
  "/files",
  can("settings"),
  h(async (req, res) => {
    const path = strQ(req, "path");
    if (!path || path.includes("..")) throw notFound("File");
    await bucket().file(path).delete();
    await audit(me(req).id, "file.deleted", { type: "file", id: path });
    ok(res, null, "File deleted.");
  }),
);

// ---------- translations ----------

adminRouter.get(
  "/translations/:locale",
  can("settings"),
  h(async (req, res) => ok(res, (await col(C.translations).doc(String(req.params.locale)).get()).data()?.strings ?? {}, "Translations.")),
);

adminRouter.put(
  "/translations/:locale",
  can("settings"),
  h(async (req, res) => {
    const d = validate(req.body, { strings: "required|array" });
    await col(C.translations).doc(String(req.params.locale)).set({ locale: req.params.locale, strings: d.strings, updated_at: new Date() });
    ok(res, null, "Translations saved.");
  }),
);

// ---------- system ----------

adminRouter.get(
  "/system-status",
  can("settings"),
  h(async (_req, res) => {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};
    try {
      await col(C.settings).limit(1).get();
      checks.firestore = { ok: true };
    } catch (e: any) {
      checks.firestore = { ok: false, detail: e.message };
    }
    try {
      await bucket().getMetadata();
      checks.storage = { ok: true };
    } catch (e: any) {
      checks.storage = { ok: false, detail: e.message };
    }
    try {
      await auth.listUsers(1);
      checks.auth = { ok: true };
    } catch (e: any) {
      checks.auth = { ok: false, detail: e.message };
    }
    const counts: Record<string, number> = {};
    for (const c of [C.users, C.ads, C.categories, C.conversations, C.transactions]) counts[c] = (await col(c).count().get()).data().count;
    ok(res, { checks, counts, runtime: { node: process.version, region: process.env.FUNCTION_REGION ?? "us-central1", project: process.env.GCLOUD_PROJECT ?? null } }, "System status.");
  }),
);

adminRouter.get(
  "/audit-logs",
  can("settings"),
  h(async (req, res) => {
    const snap = await col(C.auditLogs).orderBy("created_at", "desc").limit(500).get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }));
    const users = await getMany(C.users, rows.map((r: any) => r.user_id));
    okPage(res, req, rows.map((r: any) => ({ ...r, user: userRes(users.get(Number(r.user_id)) ?? null, { roles: false }) })), "Audit logs.", 30, 100);
  }),
);

adminRouter.post(
  "/ai/generate",
  can("blogs"),
  h(async (req, res) => {
    const d = validate(req.body, { prompt: "required|string|max:2000", type: "nullable|in:title,description,blog" });
    const s = await allSettings();
    const provider = s.ai?.provider ?? "stub";
    if (provider === "disabled") return fail(res, "AI content generation is disabled.", 422);
    const key = s.ai?.gemini_api_key;
    if (provider === "gemini" && key) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Write a ${d.type ?? "description"} for a classifieds marketplace: ${d.prompt}` }] }] }),
      });
      const j: any = await r.json().catch(() => ({}));
      const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      if (text) return ok(res, { provider: "gemini", content: text }, "Content generated.");
    }
    const p = d.prompt;
    const content = d.type === "title" ? `Great deal: ${p.slice(0, 50)}` : d.type === "blog" ? `## ${p.slice(0, 60)}\n\nThis is AI-assisted draft content generated from your prompt. Add a Gemini API key in Settings → Gemini AI for full generation.` : `AI-assisted description based on: "${p.slice(0, 120)}". Add a Gemini API key in Settings → Gemini AI for production-grade content.`;
    ok(res, { provider: "stub", content }, "Content generated.");
  }),
);

/** Remove all demo content created by the seed (Settings → Dummy Data). */
adminRouter.post(
  "/dummy-data/:action",
  requireRole("admin", "super-admin"),
  h(async (req, res) => {
    if (req.params.action !== "remove") throw notFound();
    const ads = docs(await col(C.ads).where("is_demo", "==", true).get());
    for (const a of ads) await deleteAd(a);
    ok(res, { removed: ads.length }, "Demo data removed.");
  }),
);

adminRouter.get(
  "/blog/:id(\\d+)",
  can("blogs"),
  h(async (req, res) => {
    const p = await getOrFail(C.blogPosts, intParam(req, "id"), "Blog post");
    ok(res, { ...serialize(p), cover_image: mediaUrl(p.cover_image_path) }, "Blog post.");
  }),
);

// Blog posts have rich admin needs (multipart cover + SEO); kept explicit.
adminRouter.get(
  "/blog",
  can("blogs"),
  h(async (req, res) => {
    let list = await all(C.blogPosts);
    if (filled(req, "status")) list = list.filter((p) => p.status === strQ(req, "status"));
    if (filled(req, "blog_category_id")) list = list.filter((p) => Number(p.blog_category_id) === intQ(req, "blog_category_id"));
    if (filled(req, "q")) list = list.filter((p) => String(p.title).toLowerCase().includes(strQ(req, "q").toLowerCase()));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const cats = await lookup(C.blogCategories);
    okPage(res, req, list.map((p) => ({ ...serialize(p), cover_image: mediaUrl(p.cover_image_path), category: cats.get(Number(p.blog_category_id))?.name ?? null })), "Blog posts.");
  }),
);

