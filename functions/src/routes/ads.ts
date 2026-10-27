import { Router, Request } from "express";
import { hasRole, isAdmin, isStaff, me, optionalAuth, requireAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { ApiError, addDays, filled, forbidden, h, intParam, intQ, ms, notFound, ok, okPage, randomStr, slugify, strQ, toMinor } from "../lib/http";
import { assertImage, deleteFile, mediaUrl, storeFile } from "../lib/media";
import { filesFor, multipart } from "../lib/multipart";
import { adsRes, adContext, adRes } from "../lib/resources";
import { setting } from "../lib/settings";
import { C, Doc, allCached, cached, col, docs, first, get, getOrFail, inc, insert, lookup, ref, update, bust } from "../lib/store";
import { fieldError, validate } from "../lib/validate";
import { consumeQuota, resolveSubscriptionForPosting } from "./billing";
import { categoryFields } from "./catalog";

export const adsRouter = Router();

// ---------- query helpers ----------

/** Approved + unexpired ads (short instance cache; listings tolerate a few seconds of staleness). */
export async function publishedAds(): Promise<Doc[]> {
  return cached(
    "ads:published",
    async () => {
      const snap = await col(C.ads).where("status", "==", "approved").get();
      const t = Date.now();
      return docs(snap).filter((a) => !a.expires_at || ms(a.expires_at) > t);
    },
    10_000,
  );
}

export function bustAds() {
  bust("ads:published");
}

/** Category id plus all descendant ids (browsing a parent shows its children's ads). */
async function categoryScope(id: number): Promise<Set<number>> {
  const cats = [...(await lookup(C.categories)).values()];
  const out = new Set<number>([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = cats.filter((c) => frontier.includes(Number(c.parent_id))).map((c) => c.id);
    next.forEach((n) => out.add(n));
    frontier = next;
  }
  return out;
}

export async function applyFilters(list: Doc[], f: Record<string, any>): Promise<Doc[]> {
  let out = list;
  if (f.category_slug) {
    const cat = [...(await lookup(C.categories)).values()].find((c) => c.slug === f.category_slug);
    if (!cat) return [];
    f = { ...f, category_id: cat.id };
  }
  if (f.category_id) {
    const scope = await categoryScope(Number(f.category_id));
    out = out.filter((a) => scope.has(Number(a.category_id)));
  }
  for (const k of ["country_id", "state_id", "city_id", "area_id", "user_id"]) {
    if (f[k]) out = out.filter((a) => Number(a[k]) === Number(f[k]));
  }
  if (f.price_min !== undefined && f.price_min !== "") out = out.filter((a) => a.price != null && a.price >= Math.round(Number(f.price_min) * 100));
  if (f.price_max !== undefined && f.price_max !== "") out = out.filter((a) => a.price != null && a.price <= Math.round(Number(f.price_max) * 100));
  if (f.condition) out = out.filter((a) => a.condition === f.condition);
  if (f.featured && String(f.featured) !== "0" && String(f.featured) !== "false") out = out.filter((a) => a.is_featured);
  if (f.q) {
    const terms = String(f.q).toLowerCase().split(/\s+/).filter(Boolean);
    out = out.filter((a) => {
      const hay = `${a.title ?? ""} ${a.description ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (f.cf && typeof f.cf === "object") {
    const fields = await allCached(C.customFields);
    for (const [code, value] of Object.entries(f.cf)) {
      const field = fields.find((x) => x.code === code);
      if (!field || value === "" || value === undefined) continue;
      out = out.filter((a) => {
        const v = a.custom_field_values?.[field.id];
        return Array.isArray(v) ? v.map(String).includes(String(value)) : String(v) === String(value);
      });
    }
  }
  return out;
}

export function sortAds(list: Doc[], sort?: string): Doc[] {
  const arr = [...list];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    case "price_desc":
      return arr.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    case "oldest":
      return arr.sort((a, b) => ms(a.published_at) - ms(b.published_at));
    case "most_viewed":
      return arr.sort((a, b) => Number(b.views_count ?? 0) - Number(a.views_count ?? 0));
    case "most_liked":
      return arr.sort((a, b) => Number(b.favorites_count ?? 0) - Number(a.favorites_count ?? 0));
    default:
      return arr.sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured) || ms(b.published_at) - ms(a.published_at));
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title, 80);
  for (;;) {
    const slug = `${base}-${randomStr(6)}`;
    if (!(await first(C.ads, "slug", slug))) return slug;
  }
}

function authorizeOwner(req: Request, ad: Doc) {
  const u = me(req);
  if (u.id !== Number(ad.user_id) && !isAdmin(u)) throw forbidden();
}

/** Validate + normalise category custom-field input (keyed by field code) → { fieldId: value }. */
export async function syncFields(categoryId: number, input: Record<string, any>, existing: Record<string, any> = {}): Promise<Record<string, any>> {
  const fields = await categoryFields(categoryId);
  const errors: Record<string, string[]> = {};
  const out: Record<string, any> = {};
  for (const f of fields) {
    const link = (f.categories ?? []).find((c: any) => Number(c.category_id) === categoryId);
    const required = !!(link?.is_required ?? f.is_required);
    const key = `custom_fields.${f.code}`;
    const has = Object.prototype.hasOwnProperty.call(input, f.code);
    const value = has ? input[f.code] : existing[f.id];
    const empty = value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length);
    if (empty) {
      if (required) errors[key] = [`The ${f.name} field is required.`];
      continue;
    }
    if (["dropdown", "radio", "checkbox"].includes(f.type)) {
      const allowed = (f.options ?? []).map((o: any) => String(o.value));
      const values = Array.isArray(value) ? value : [value];
      if (allowed.length && values.some((v: any) => !allowed.includes(String(v)))) {
        errors[key] = [`Invalid option for ${f.name}.`];
        continue;
      }
    }
    if (f.type === "number" && !Number.isFinite(Number(value))) {
      errors[key] = [`The ${f.name} must be a number.`];
      continue;
    }
    if (f.min_length && String(value).length < Number(f.min_length)) {
      errors[key] = [`The ${f.name} must be at least ${f.min_length} characters.`];
      continue;
    }
    if (f.max_length && String(value).length > Number(f.max_length)) {
      errors[key] = [`The ${f.name} must not be greater than ${f.max_length} characters.`];
      continue;
    }
    out[f.id] = Array.isArray(value) ? value.map(String) : f.type === "number" ? Number(value) : String(value);
  }
  if (Object.keys(errors).length) throw new ApiError(Object.values(errors)[0][0], 422, errors);
  return out;
}

const AD_RULES = {
  category_id: "required|integer",
  title: "required|string|min:3|max:191",
  description: "required|string|min:10",
  price: "nullable|numeric|min:0|max:999999999",
  currency_code: "nullable|string|size:3",
  price_type: "nullable|in:fixed,negotiable,free,contact",
  condition: "nullable|in:new,used,refurbished",
  phone: "nullable|string|max:32",
  video_url: "nullable|url|max:255",
  country_id: "nullable|integer",
  state_id: "nullable|integer",
  city_id: "nullable|integer",
  area_id: "nullable|integer",
  address: "nullable|string|max:255",
  latitude: "nullable|numeric|min:-90|max:90",
  longitude: "nullable|numeric|min:-180|max:180",
  custom_fields: "nullable|array",
  status: "nullable|in:draft,pending",
};

async function assertRefs(d: Record<string, any>) {
  const checks: [string, string][] = [
    ["category_id", C.categories],
    ["country_id", C.countries],
    ["state_id", C.states],
    ["city_id", C.cities],
  ];
  for (const [k, coll] of checks) {
    if (d[k] && !(await lookup(coll)).has(Number(d[k]))) throw fieldError(k, `The selected ${k.replace(/_id$/, "").replace(/_/g, " ")} is invalid.`);
  }
}

function parseCustomFields(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as Record<string, any>;
}

function keywords(title: string, description: string): string[] {
  return [...new Set(`${title} ${description}`.toLowerCase().split(/[^a-z0-9À-￿]+/).filter((w) => w.length > 1))].slice(0, 200);
}

// ---------- public ----------

adsRouter.get(
  "/ads",
  optionalAuth,
  h(async (req, res) => {
    const f = { ...req.query } as Record<string, any>;
    const list = sortAds(await applyFilters(await publishedAds(), f), strQ(req, "sort"));
    const per = Math.max(1, Math.min(intQ(req, "per_page", 20), 50));
    const page = Math.max(1, intQ(req, "page", 1));
    const slice = list.slice((page - 1) * per, page * per);
    const data = await adsRes(slice, req.user?.id);
    ok(res, data, "Ads.", 200, {
      pagination: { current_page: page, per_page: per, total: list.length, last_page: Math.max(1, Math.ceil(list.length / per)), from: slice.length ? (page - 1) * per + 1 : null, to: slice.length ? (page - 1) * per + slice.length : null },
    });
  }),
);

adsRouter.get(
  "/ads/nearby",
  optionalAuth,
  h(async (req, res) => {
    const d = validate(req.query as any, { latitude: "required|numeric|min:-90|max:90", longitude: "required|numeric|min:-180|max:180", radius: "nullable|numeric|min:1|max:500" });
    const radius = Number(d.radius ?? (await setting("ads", "nearby_radius_km", 25)));
    const withDist = (await publishedAds())
      .filter((a) => a.latitude != null && a.longitude != null)
      .map((a) => ({ a, dist: haversine(d.latitude, d.longitude, Number(a.latitude), Number(a.longitude)) }))
      .filter((x) => x.dist <= radius)
      .sort((x, y) => x.dist - y.dist);
    const per = Math.max(1, Math.min(intQ(req, "per_page", 20), 50));
    const page = Math.max(1, intQ(req, "page", 1));
    const slice = withDist.slice((page - 1) * per, page * per);
    const ctx = await adContext(slice.map((x) => x.a), req.user?.id);
    ok(res, slice.map((x) => adRes(x.a, ctx, { distance: x.dist })), "Nearby ads.", 200, {
      pagination: { current_page: page, per_page: per, total: withDist.length, last_page: Math.max(1, Math.ceil(withDist.length / per)), from: slice.length ? (page - 1) * per + 1 : null, to: slice.length ? (page - 1) * per + slice.length : null },
    });
  }),
);

adsRouter.get(
  "/ads/:slug/related",
  h(async (req, res) => {
    const ad = await first(C.ads, "slug", req.params.slug);
    if (!ad) throw notFound("Ad");
    const related = (await publishedAds())
      .filter((a) => Number(a.category_id) === Number(ad.category_id) && a.id !== ad.id)
      .sort((a, b) => ms(b.published_at) - ms(a.published_at))
      .slice(0, 10);
    ok(res, await adsRes(related), "Related ads.");
  }),
);

adsRouter.get(
  "/ads/:slug",
  optionalAuth,
  h(async (req, res) => {
    const slug = req.params.slug;
    const ad = (await first(C.ads, "slug", slug)) ?? (/^\d+$/.test(slug) ? await get(C.ads, slug) : null);
    if (!ad) throw notFound("Ad");
    if (ad.status !== "approved") {
      const u = req.user;
      if (!(u && (u.id === Number(ad.user_id) || isStaff(u)))) throw notFound("Ad");
    } else {
      await ref(C.ads, ad.id).update({ views_count: inc() });
      ad.views_count = Number(ad.views_count ?? 0) + 1;
    }
    const ctx = await adContext([ad], req.user?.id, true);
    const data: any = adRes(ad, ctx, { fields: true });
    if (data.category) data.category.custom_fields = (await categoryFields(Number(ad.category_id))).map((f) => ({ id: f.id, name: f.name, code: f.code, type: f.type }));
    ok(res, data, "Ad.");
  }),
);

// ---------- owner ----------

adsRouter.get(
  "/my/ads",
  requireAuth,
  h(async (req, res) => {
    let list = docs(await col(C.ads).where("user_id", "==", me(req).id).get());
    if (filled(req, "status")) list = list.filter((a) => a.status === strQ(req, "status"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const per = Math.max(1, Math.min(intQ(req, "per_page", 20), 50));
    const page = Math.max(1, intQ(req, "page", 1));
    const slice = list.slice((page - 1) * per, page * per);
    ok(res, await adsRes(slice, me(req).id), "My ads.", 200, {
      pagination: { current_page: page, per_page: per, total: list.length, last_page: Math.max(1, Math.ceil(list.length / per)), from: slice.length ? (page - 1) * per + 1 : null, to: slice.length ? (page - 1) * per + slice.length : null },
    });
  }),
);

adsRouter.post(
  "/ads",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const user = me(req);
    const d = validate(req.body, AD_RULES);
    await assertRefs(d);
    const category = (await lookup(C.categories)).get(Number(d.category_id))!;

    const requireApproval = !!(await setting("ads", "require_approval", true)) && !user.auto_approve_ads && !isStaff(user);
    const isDraft = d.status === "draft";
    const subscription = await resolveSubscriptionForPosting(user, category.id);
    const values = await syncFields(category.id, parseCustomFields(d.custom_fields));

    const status = isDraft ? "draft" : requireApproval ? "pending" : "approved";
    const now = new Date();
    const ad = await insert(C.ads, {
      user_id: user.id,
      category_id: category.id,
      parent_category_id: category.parent_id ?? null,
      title: d.title,
      slug: await uniqueSlug(d.title),
      description: d.description,
      price: d.price !== undefined ? toMinor(d.price) : null,
      currency_code: d.currency_code ?? (await setting("general", "default_currency", "USD")),
      price_type: d.price_type ?? "fixed",
      condition: d.condition ?? null,
      phone: d.phone ?? null,
      video_url: d.video_url ?? null,
      country_id: d.country_id ?? null,
      state_id: d.state_id ?? null,
      city_id: d.city_id ?? null,
      area_id: d.area_id ?? null,
      address: d.address ?? null,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      status,
      is_featured: false,
      featured_until: null,
      views_count: 0,
      favorites_count: 0,
      approved_at: status === "approved" ? now : null,
      published_at: status === "approved" ? now : null,
      expires_at: addDays(Number(await setting("ads", "default_expiry_days", 30))).toDate(),
      images: [],
      custom_field_values: values,
      keywords: keywords(d.title, d.description),
    });
    if (!isDraft) await consumeQuota(subscription);
    await ref(C.categories, category.id).set({ ads_count: inc() }, { merge: true });

    // Images may arrive in the same multipart request.
    const files = filesFor(req, "images");
    if (files.length) await addImages(ad, files);

    if (!hasRole(user, "seller")) {
      await update(C.users, user.id, { roles: [...new Set([...(user.roles ?? []), "seller"])], "seller_profile.member_since": user.seller_profile?.member_since ?? now });
    }
    bustAds();
    const fresh = (await get(C.ads, ad.id))!;
    ok(res, (await adsRes([fresh], user.id, { fields: true }))[0], status === "pending" ? "Ad submitted for approval." : "Ad created.", 201);
  }),
);

adsRouter.put(
  "/ads/:id(\\d+)",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    const rules = Object.fromEntries(Object.entries(AD_RULES).map(([k, v]) => [k, `sometimes|${v.replace("required|", "")}`]));
    const d = validate(req.body, rules);
    await assertRefs(d);
    const categoryId = Number(d.category_id ?? ad.category_id);
    const category = (await lookup(C.categories)).get(categoryId);

    const patch: Record<string, any> = {};
    for (const k of ["title", "description", "currency_code", "price_type", "condition", "phone", "video_url", "country_id", "state_id", "city_id", "area_id", "address", "latitude", "longitude"]) {
      if (k in d) patch[k] = d[k];
    }
    if ("price" in d) patch.price = toMinor(d.price);
    patch.category_id = categoryId;
    patch.parent_category_id = category?.parent_id ?? null;
    if ("custom_fields" in d || categoryId !== Number(ad.category_id)) {
      patch.custom_field_values = await syncFields(categoryId, parseCustomFields(d.custom_fields), "custom_fields" in d ? {} : ad.custom_field_values ?? {});
    }
    if (patch.title || patch.description) patch.keywords = keywords(patch.title ?? ad.title, patch.description ?? ad.description);
    if (ad.status === "approved" && (await setting("ads", "require_approval", true)) && !isStaff(me(req)) && !me(req).auto_approve_ads) patch.status = "pending";
    if (d.status === "pending" && ad.status === "draft") patch.status = (await setting("ads", "require_approval", true)) ? "pending" : "approved";
    await update(C.ads, ad.id, patch);

    const files = filesFor(req, "images");
    if (files.length) await addImages({ ...ad, ...patch }, files);
    bustAds();
    const fresh = (await get(C.ads, ad.id))!;
    ok(res, (await adsRes([fresh], me(req).id, { fields: true }))[0], "Ad updated.");
  }),
);

export async function deleteAd(ad: Doc) {
  for (const img of ad.images ?? []) await deleteFile(img.path);
  const favs = await col(C.favorites).where("ad_id", "==", ad.id).get();
  const batch = db.batch();
  favs.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref(C.ads, ad.id));
  batch.set(ref(C.categories, ad.category_id), { ads_count: inc(-1) }, { merge: true });
  await batch.commit();
  bustAds();
}

adsRouter.delete(
  "/ads/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    await deleteAd(ad);
    ok(res, null, "Ad deleted.");
  }),
);

adsRouter.post(
  "/ads/:id(\\d+)/sold",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    await update(C.ads, ad.id, { status: "sold", sold_at: new Date() });
    bustAds();
    ok(res, (await adsRes([{ ...ad, status: "sold" }], me(req).id))[0], "Marked as sold.");
  }),
);

adsRouter.post(
  "/ads/:id(\\d+)/renew",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    const days = Number(await setting("ads", "default_expiry_days", 30));
    const requireApproval = !!(await setting("ads", "require_approval", true)) && !me(req).auto_approve_ads;
    const patch = {
      expires_at: addDays(days).toDate(),
      status: requireApproval ? "pending" : "approved",
      published_at: requireApproval ? ad.published_at ?? null : new Date(),
    };
    await update(C.ads, ad.id, patch);
    bustAds();
    ok(res, (await adsRes([{ ...ad, ...patch }], me(req).id))[0], "Ad renewed.");
  }),
);

// ---------- images ----------

async function addImages(ad: Doc, files: { field: string; filename: string; mimeType: string; buffer: Buffer }[]) {
  const max = Number(await setting("ads", "max_images_per_ad", 10));
  const current: any[] = ad.images ?? [];
  if (current.length + files.length > max) throw new ApiError(`Maximum ${max} images per ad.`, 422);
  for (const f of files) {
    try {
      assertImage(f, "images");
    } catch (e: any) {
      throw fieldError("images", e.message);
    }
  }
  const created = [];
  let nextImg = Math.max(0, ...current.map((i) => Number(i.id) || 0)) + 1;
  for (let i = 0; i < files.length; i++) {
    const path = await storeFile(files[i], `ads/${ad.id}`);
    created.push({ id: nextImg++, path, is_primary: current.length === 0 && i === 0, sort_order: current.length + i });
  }
  await update(C.ads, ad.id, { images: [...current, ...created] });
  return created;
}

adsRouter.post(
  "/ads/:id(\\d+)/images",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    const files = filesFor(req, "images");
    if (!files.length) throw fieldError("images", "The images field is required.");
    const created = await addImages(ad, files);
    bustAds();
    ok(res, created.map((c) => ({ id: c.id, url: mediaUrl(c.path), is_primary: c.is_primary, sort_order: c.sort_order })), "Images uploaded.", 201);
  }),
);

adsRouter.post(
  "/ads/:id(\\d+)/images/:imageId(\\d+)/primary",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    const imageId = intParam(req, "imageId");
    await update(C.ads, ad.id, { images: (ad.images ?? []).map((i: any) => ({ ...i, is_primary: Number(i.id) === imageId })) });
    bustAds();
    ok(res, null, "Primary image set.");
  }),
);

adsRouter.delete(
  "/ads/:id(\\d+)/images/:imageId(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    authorizeOwner(req, ad);
    const imageId = intParam(req, "imageId");
    const img = (ad.images ?? []).find((i: any) => Number(i.id) === imageId);
    if (!img) throw notFound("Image");
    await deleteFile(img.path);
    let rest = (ad.images ?? []).filter((i: any) => Number(i.id) !== imageId);
    if (img.is_primary && rest.length) rest = rest.map((i: any, idx: number) => ({ ...i, is_primary: idx === 0 }));
    await update(C.ads, ad.id, { images: rest });
    bustAds();
    ok(res, null, "Image deleted.");
  }),
);

// ---------- favorites ----------

adsRouter.get(
  "/favorites",
  requireAuth,
  h(async (req, res) => {
    const favs = docs(await col(C.favorites).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const ads = (await Promise.all(favs.map((f) => get(C.ads, f.ad_id)))).filter(Boolean) as Doc[];
    const ctx = await adContext(ads, me(req).id);
    okPage(res, req, ads.map((a) => adRes(a, ctx)), "Favorites.");
  }),
);

adsRouter.post(
  "/ads/:id(\\d+)/favorite",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    const uid = me(req).id;
    const favRef = col(C.favorites).doc(`${uid}_${ad.id}`);
    const favorited = await db.runTransaction(async (tx) => {
      const s = await tx.get(favRef);
      if (s.exists) {
        tx.delete(favRef);
        tx.update(ref(C.ads, ad.id), { favorites_count: Math.max(0, Number(ad.favorites_count ?? 0) - 1) });
        return false;
      }
      tx.set(favRef, { id: `${uid}_${ad.id}`, user_id: uid, ad_id: ad.id, created_at: new Date() });
      tx.update(ref(C.ads, ad.id), { favorites_count: inc() });
      return true;
    });
    bustAds();
    ok(res, { ad_id: ad.id, favorited }, favorited ? "Added to favorites." : "Removed from favorites.");
  }),
);

// ---------- saved searches ----------

adsRouter.get(
  "/saved-searches",
  requireAuth,
  h(async (req, res) => {
    const list = docs(await col(C.savedSearches).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    ok(res, list, "Saved searches.");
  }),
);

adsRouter.post(
  "/saved-searches",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { name: "nullable|string|max:150", query: "required|array", notify: "nullable|boolean" });
    const row = await insert(C.savedSearches, { user_id: me(req).id, name: d.name ?? null, query: d.query, notify: d.notify ?? false, last_run_at: null });
    ok(res, row, "Search saved.", 201);
  }),
);

adsRouter.delete(
  "/saved-searches/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const s = await getOrFail(C.savedSearches, intParam(req, "id"), "Saved search");
    if (Number(s.user_id) !== me(req).id) throw notFound("Saved search");
    await ref(C.savedSearches, s.id).delete();
    ok(res, null, "Saved search removed.");
  }),
);

adsRouter.post(
  "/saved-searches/:id(\\d+)/run",
  requireAuth,
  h(async (req, res) => {
    const s = await getOrFail(C.savedSearches, intParam(req, "id"), "Saved search");
    if (Number(s.user_id) !== me(req).id) throw notFound("Saved search");
    await update(C.savedSearches, s.id, { last_run_at: new Date() });
    const f = s.query ?? {};
    const list = sortAds(await applyFilters(await publishedAds(), f), f.sort);
    const ctx = await adContext(list.slice(0, 50), me(req).id);
    okPage(res, req, list.slice(0, 50).map((a) => adRes(a, ctx)), "Saved search results.");
  }),
);


