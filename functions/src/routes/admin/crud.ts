import { Router, Request } from "express";
import { Timestamp } from "../../lib/firebase";
import { ApiError, filled, h, intParam, notFound, ok, okPage, slugify, strQ, toMinor } from "../../lib/http";
import { assertImage, deleteFile, mediaUrl, storeFile } from "../../lib/media";
import { filesFor, multipart } from "../../lib/multipart";
import { C, Doc, all, bust, col, get, getMany, insert, ref, update } from "../../lib/store";
import { fieldError, Rules, validate } from "../../lib/validate";
import { can, Module, MODULES } from "./guard";
import { db } from "../../lib/firebase";

/** JSON-safe admin view of a stored document (timestamps → ISO, stored paths → URLs). */
export function serialize(d: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v instanceof Timestamp) out[k] = v.toDate().toISOString();
    else if (v instanceof Date) out[k] = v.toISOString();
    else if (v && typeof v === "object" && !Array.isArray(v) && "_seconds" in v) out[k] = new Date(v._seconds * 1000).toISOString();
    else out[k] = v;
    if (/_path$/.test(k) && typeof v === "string") out[k.replace(/_path$/, "_url")] = mediaUrl(v);
    if (/_paths$/.test(k) && Array.isArray(v)) out[k.replace(/_paths$/, "_urls")] = v.map((x) => mediaUrl(x));
  }
  return out;
}

interface ResourceDef {
  collection: string;
  module: (typeof MODULES)[number];
  /** Other modules whose pages read this resource as a lookup (GET only). */
  readBy?: Module[];
  rules: Rules;
  /** multipart file field → [stored key, storage dir, multiple?] */
  files?: Record<string, [string, string, boolean?]>;
  search?: string[];
  filters?: string[];
  /** query param → stored field, for fields whose name clashes with a reserved param (e.g. "page"). */
  aliasFilters?: Record<string, string>;
  /** query param → array field it must be contained in (e.g. category_id → category_ids). */
  arrayFilters?: Record<string, string>;
  sort?: (a: Doc, b: Doc) => number;
  readOnly?: boolean;
  slugFrom?: string;
  unique?: string[];
  prepare?: (data: Record<string, any>, existing: Doc | null) => Promise<Record<string, any>> | Record<string, any>;
  decorate?: (rows: Doc[]) => Promise<Record<string, any>[]>;
  cacheKeys?: string[];
}

const bySort = (a: Doc, b: Doc) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || a.id - b.id;
const byName = (a: Doc, b: Doc) => String(a.name ?? "").localeCompare(String(b.name ?? ""));
const newest = (a: Doc, b: Doc) => b.id - a.id;

const T = "nullable|array"; // translations: { locale: { field: value } }

const parseJson = (v: unknown) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

export const RESOURCES: Record<string, ResourceDef> = {
  categories: {
    collection: C.categories,
    module: "categories",
    readBy: ["ads", "content", "chat", "packages", "custom_fields"],
    rules: { name: "required|string|max:150", slug: "nullable|string|max:191", parent_id: "nullable|integer", type: "nullable|string|max:50", description: "nullable|string", sort_order: "nullable|integer", is_active: "nullable|boolean", translations: T },
    files: { icon: ["icon_path", "categories"], image: ["image_path", "categories"] },
    search: ["name", "slug"],
    filters: ["parent_id"],
    sort: bySort,
    slugFrom: "name",
    unique: ["slug"],
    cacheKeys: [`all:${C.categories}`, `map:${C.categories}`],
    prepare: async (d, existing) => {
      if (d.parent_id) {
        const cats = new Map((await all(C.categories)).map((c) => [c.id, c]));
        if (!cats.has(Number(d.parent_id))) throw fieldError("parent_id", "The selected parent category does not exist.");
        // Walk up from the new parent: reaching this category means a cycle.
        for (let p = Number(d.parent_id), hops = 0; p && hops < 50; p = Number(cats.get(p)?.parent_id ?? 0), hops++) {
          if (existing && p === existing.id) throw fieldError("parent_id", "A category cannot be moved under itself or one of its subcategories.");
        }
      }
      return d;
    },
    decorate: async (rows) => {
      const [cats, fields] = await Promise.all([all(C.categories), all(C.customFields)]);
      return rows.map((r) => ({
        ...serialize(r),
        subcategories_count: cats.filter((c) => Number(c.parent_id) === r.id).length,
        custom_fields_count: fields.filter((f) => (f.category_ids ?? []).map(Number).includes(r.id)).length,
        ads_count: Number(r.ads_count ?? 0),
      }));
    },
  },
  custom_fields: {
    collection: C.customFields,
    module: "custom_fields",
    rules: {
      name: "required|string|max:150",
      code: "nullable|string|max:100",
      type: "required|in:number,textbox,textarea,dropdown,radio,checkbox,fileinput,date",
      min_length: "nullable|integer|min:0",
      max_length: "nullable|integer|min:0",
      is_required: "nullable|boolean",
      is_filterable: "nullable|boolean",
      is_active: "nullable|boolean",
      sort_order: "nullable|integer",
      options: "nullable|array",
      category_ids: "nullable|array",
      translations: T,
    },
    files: { icon: ["icon_path", "custom-fields"] },
    search: ["name", "code"],
    filters: ["type"],
    arrayFilters: { category_id: "category_ids" },
    sort: bySort,
    cacheKeys: [`all:${C.customFields}`, `map:${C.customFields}`],
    prepare: (d, existing) => {
      if ("name" in d && !d.code && !existing?.code) d.code = slugify(d.name, 60).replace(/-/g, "_");
      if ("options" in d) {
        d.options = (parseJson(d.options) as any[] ?? []).map((o: any, i: number) =>
          typeof o === "string" ? { id: i + 1, label: o, value: o, sort_order: i } : { id: o.id ?? i + 1, label: o.label ?? o.value, value: o.value ?? o.label, sort_order: o.sort_order ?? i },
        );
      }
      if ("category_ids" in d) {
        d.category_ids = (parseJson(d.category_ids) as any[] ?? []).map(Number);
        d.categories = d.category_ids.map((id: number, i: number) => ({ category_id: id, is_required: !!(d.is_required ?? existing?.is_required), sort_order: i }));
      }
      return d;
    },
    decorate: async (rows) => {
      const cats = new Map((await all(C.categories)).map((c) => [c.id, c]));
      const path = (id: number): string => {
        const c = cats.get(id);
        if (!c) return "";
        return c.parent_id ? `${path(Number(c.parent_id))} > ${c.name}` : c.name;
      };
      return rows.map((r) => ({ ...serialize(r), category_paths: (r.category_ids ?? []).map((id: number) => path(Number(id))).filter(Boolean) }));
    },
  },
  countries: {
    collection: C.countries,
    module: "locations",
    rules: { name: "required|string|max:150", iso2: "nullable|string|max:2", iso3: "nullable|string|max:3", phone_code: "nullable|string|max:10", currency_code: "nullable|string|max:3", flag_path: "nullable|string|max:255", is_active: "nullable|boolean", translations: T },
    search: ["name", "iso2"],
    sort: byName,
    cacheKeys: [`all:${C.countries}`, `map:${C.countries}`],
  },
  states: {
    collection: C.states,
    module: "locations",
    rules: { name: "required|string|max:150", country_id: "required|integer", code: "nullable|string|max:20", is_active: "nullable|boolean", translations: T },
    search: ["name"],
    filters: ["country_id"],
    sort: byName,
    cacheKeys: [`all:${C.states}`, `map:${C.states}`],
  },
  cities: {
    collection: C.cities,
    module: "locations",
    rules: { name: "required|string|max:150", country_id: "required|integer", state_id: "nullable|integer", latitude: "nullable|numeric", longitude: "nullable|numeric", is_active: "nullable|boolean", translations: T },
    search: ["name"],
    filters: ["country_id", "state_id"],
    sort: byName,
    cacheKeys: [`all:${C.cities}`, `map:${C.cities}`],
  },
  areas: {
    collection: C.areas,
    module: "locations",
    rules: { name: "required|string|max:150", country_id: "required|integer", state_id: "required|integer", city_id: "required|integer", latitude: "nullable|numeric", longitude: "nullable|numeric", is_active: "nullable|boolean", translations: T },
    search: ["name"],
    filters: ["country_id", "state_id", "city_id"],
    sort: byName,
    cacheKeys: [`all:${C.areas}`],
  },
  currencies: {
    collection: C.currencies,
    module: "locations",
    rules: { code: "required|string|size:3", name: "required|string|max:100", symbol: "required|string|max:10", symbol_position: "nullable|in:left,right", country: "nullable|string|max:150", decimal_digits: "nullable|integer|min:0|max:4", is_default: "nullable|boolean", is_active: "nullable|boolean", sort_order: "nullable|integer" },
    search: ["code", "name"],
    sort: bySort,
    unique: ["code"],
    cacheKeys: [`all:${C.currencies}`],
    prepare: (d) => {
      if (d.code) d.code = String(d.code).toUpperCase();
      return d;
    },
  },
  languages: {
    collection: C.languages,
    module: "settings",
    rules: { name: "required|string|max:100", code: "required|string|max:8", is_rtl: "nullable|boolean", is_default: "nullable|boolean", is_active: "nullable|boolean", flag_path: "nullable|string|max:255", sort_order: "nullable|integer" },
    search: ["name", "code"],
    sort: bySort,
    unique: ["code"],
    cacheKeys: [`all:${C.languages}`],
  },
  faqs: {
    collection: C.faqs,
    module: "blogs",
    rules: { question: "required|string|max:500", answer: "required|string|max:5000", is_active: "nullable|boolean", sort_order: "nullable|integer", translations: T },
    search: ["question", "answer"],
    sort: bySort,
    cacheKeys: [`all:${C.faqs}`],
  },
  report_reasons: {
    collection: C.reportReasons,
    module: "reports",
    rules: { reason: "required|string|max:255", is_active: "nullable|boolean", sort_order: "nullable|integer", translations: T },
    search: ["reason"],
    sort: bySort,
    cacheKeys: [`all:${C.reportReasons}`],
  },
  tips: {
    collection: C.tips,
    module: "content",
    rules: { description: "required|string|max:1000", is_active: "nullable|boolean", sort_order: "nullable|integer", translations: T },
    search: ["description"],
    sort: bySort,
    cacheKeys: [`all:${C.tips}`],
  },
  chat_templates: {
    collection: C.chatTemplates,
    module: "chat",
    rules: { name: "required|string|max:150", category_ids: "nullable|array", messages: "nullable|array", replies: "nullable|array", is_active: "nullable|boolean" },
    search: ["name"],
    sort: newest,
    cacheKeys: [`all:${C.chatTemplates}`],
    prepare: (d) => {
      for (const k of ["category_ids", "messages", "replies"]) if (k in d) d[k] = parseJson(d[k]) ?? [];
      if (d.category_ids) d.category_ids = d.category_ids.map(Number);
      return d;
    },
  },
  banner_ads: {
    collection: C.bannerAds,
    module: "content",
    rules: {
      platform: "required|in:web,app",
      page: "required|string|max:100",
      layout: "required|in:single,dual",
      ad_type: "required|in:category,advertisement,external",
      placement: "nullable|string|max:100",
      category_id: "nullable|integer",
      ad_id: "nullable|integer",
      external_url: "nullable|string|max:500",
      is_active: "nullable|boolean",
      sort_order: "nullable|integer",
    },
    files: { images: ["image_paths", "banners", true] },
    filters: ["platform", "layout", "ad_type"],
    aliasFilters: { banner_page: "page" }, // "page" is the pagination parameter
    sort: bySort,
    cacheKeys: [`all:${C.bannerAds}`],
  },
  verification_fields: {
    collection: C.verificationFields,
    module: "sellers",
    rules: { name: "required|string|max:150", type: "nullable|in:number,textbox,textarea,dropdown,radio,checkbox,fileinput", min_length: "nullable|integer|min:0", max_length: "nullable|integer|min:0", values: "nullable|array", is_required: "nullable|boolean", is_active: "nullable|boolean", sort_order: "nullable|integer", translations: T },
    search: ["name"],
    sort: bySort,
    cacheKeys: [`all:${C.verificationFields}`],
  },
  user_queries: {
    collection: C.userQueries,
    module: "customers",
    rules: {},
    search: ["name", "email", "subject", "message"],
    sort: newest,
    readOnly: true,
  },
  blog_categories: {
    collection: C.blogCategories,
    module: "blogs",
    rules: { name: "required|string|max:150", slug: "nullable|string|max:191", is_active: "nullable|boolean", sort_order: "nullable|integer", translations: T },
    search: ["name", "slug"],
    sort: bySort,
    slugFrom: "name",
    unique: ["slug"],
    cacheKeys: [`all:${C.blogCategories}`, `map:${C.blogCategories}`],
  },
  featured_ad_plans: {
    collection: C.featuredAdPlans,
    module: "packages",
    rules: { name: "required|string|max:150", description: "nullable|string", price: "required|numeric|min:0", currency_code: "nullable|string|size:3", duration_days: "required|integer|min:1", is_active: "nullable|boolean", sort_order: "nullable|integer" },
    search: ["name"],
    sort: bySort,
    cacheKeys: [`all:${C.featuredAdPlans}`],
    prepare: (d) => {
      if ("price" in d) d.price = toMinor(d.price) ?? 0;
      return d;
    },
  },
  email_templates: {
    collection: C.emailTemplates,
    module: "settings",
    rules: { code: "required|string|max:100", subject: "required|string|max:191", body_html: "required|string|raw", variables: "nullable|array", is_active: "nullable|boolean" },
    search: ["code", "subject"],
    sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    unique: ["code"],
  },
  roles: {
    collection: C.roles,
    module: "roles",
    readBy: ["staff"],
    rules: { name: "required|string|max:100", permissions: "nullable|array" },
    search: ["name"],
    sort: (a, b) => a.id - b.id,
    unique: ["name"],
    cacheKeys: [`all:${C.roles}`],
  },
  pages: {
    collection: C.pages,
    module: "settings",
    rules: { key: "required|string|max:64", title: "required|string|max:191", body: "nullable|string|raw", is_published: "nullable|boolean" },
    search: ["key", "title"],
    sort: (a, b) => String(a.key).localeCompare(String(b.key)),
    unique: ["key"],
    cacheKeys: [`all:${C.pages}`],
  },
  seo_meta: {
    collection: C.seoMeta,
    module: "settings",
    rules: { route_key: "nullable|string|max:100", seoable_type: "nullable|in:ad,category,blog,page", seoable_id: "nullable|integer", title: "nullable|string|max:191", description: "nullable|string|max:500", keywords: "nullable|string|max:500", og_image: "nullable|string|max:255", json_ld: "nullable|array" },
    search: ["route_key", "title"],
    sort: newest,
    cacheKeys: [`all:${C.seoMeta}`],
  },
  sliders: {
    collection: C.sliders,
    module: "content",
    rules: { title: "nullable|string|max:150", link_type: "nullable|in:none,ad,category,external", ad_id: "nullable|integer", category_id: "nullable|integer", external_url: "nullable|url|max:255", country_id: "nullable|integer", state_id: "nullable|integer", city_id: "nullable|integer", sort_order: "nullable|integer", is_active: "nullable|boolean" },
    files: { image: ["image_path", "sliders"] },
    sort: bySort,
    cacheKeys: [`all:${C.sliders}`],
    prepare: (d, existing) => {
      if (!existing && !d.link_type) d.link_type = d.ad_id ? "ad" : d.category_id ? "category" : d.external_url ? "external" : "none";
      return d;
    },
  },
  featured_sections: {
    collection: C.featuredSections,
    module: "content",
    rules: {
      title: "required|string|max:150",
      slug: "nullable|string|max:191",
      filter_type: "required|in:latest,most_viewed,most_liked,featured,category,price_low_high,price_high_low",
      category_id: "nullable|integer",
      category_ids: "nullable|array",
      style: "nullable|string|max:50",
      item_limit: "nullable|integer|min:1|max:50",
      sort_order: "nullable|integer",
      is_active: "nullable|boolean",
      translations: T,
    },
    sort: bySort,
    slugFrom: "title",
    cacheKeys: [`all:${C.featuredSections}`],
    prepare: (d) => {
      if ("category_ids" in d) d.category_ids = (parseJson(d.category_ids) as any[] ?? []).map(Number);
      if (d.category_ids?.length && !d.category_id) d.category_id = d.category_ids[0];
      return d;
    },
  },
  packages: {
    collection: C.packages,
    module: "packages",
    readBy: ["customers"],
    rules: {
      name: "required|string|max:150",
      description: "nullable|string",
      type: "nullable|in:ad_listing,featured_ads",
      price: "required|numeric|min:0",
      discount_percent: "nullable|integer|min:0|max:100",
      currency_code: "nullable|string|size:3",
      duration_days: "nullable|integer|min:1",
      ad_limit: "nullable|integer|min:0",
      is_unlimited: "nullable|boolean",
      ios_product_id: "nullable|string|max:191",
      android_product_id: "nullable|string|max:191",
      key_points: "nullable|array",
      status: "nullable|in:active,inactive,discontinued",
      is_active: "nullable|boolean",
      sort_order: "nullable|integer",
      category_ids: "nullable|array",
      translations: T,
    },
    files: { icon: ["icon_path", "packages"] },
    search: ["name"],
    filters: ["type", "status"],
    sort: bySort,
    cacheKeys: [`all:${C.packages}`],
    decorate: async (rows) => {
      const [txns, subs] = await Promise.all([all(C.transactions), all(C.subscriptions)]);
      const now = Date.now();
      return rows.map((r) => ({
        ...serialize(r),
        total_revenue: txns.filter((t) => Number(t.package_id) === r.id && t.status === "completed").reduce((s, t) => s + Number(t.total ?? 0), 0),
        active_subscribers: subs.filter((x) => Number(x.package_id) === r.id && x.status === "active" && (!x.ends_at || (x.ends_at.toMillis?.() ?? new Date(x.ends_at).getTime()) > now)).length,
      }));
    },
    prepare: (d, existing) => {
      const discount = Number(d.discount_percent ?? existing?.discount_percent ?? 0);
      if ("price" in d) d.price = toMinor(d.price) ?? 0;
      const price = Number(d.price ?? existing?.price ?? 0);
      if ("price" in d || "discount_percent" in d) d.final_price = Math.round((price * (100 - discount)) / 100);
      if ("category_ids" in d) d.category_ids = (parseJson(d.category_ids) as any[] ?? []).map(Number);
      if ("key_points" in d) d.key_points = parseJson(d.key_points) ?? [];
      if (d.status) d.is_active = d.status === "active";
      else if ("is_active" in d) d.status = d.is_active ? "active" : "inactive";
      if (!existing && !d.currency_code) d.currency_code = "USD";
      return d;
    },
  },
};

export const crudRouter = Router();

function def(req: Request): ResourceDef {
  const r = RESOURCES[String(req.params.resource)];
  if (!r) throw notFound("Resource");
  return r;
}

const guard = h(async (req, res, next) => can(def(req).module, def(req).readBy)(req, res, next));

async function applyFiles(req: Request, r: ResourceDef, data: Record<string, any>, existing: Doc | null) {
  for (const [field, [key, dir, multiple]] of Object.entries(r.files ?? {})) {
    const files = filesFor(req, field);
    if (!files.length) continue;
    for (const f of files) {
      try {
        assertImage(f, field);
      } catch (e: any) {
        throw fieldError(field, e.message);
      }
    }
    if (multiple) {
      data[key] = await Promise.all(files.map((f) => storeFile(f, dir)));
      for (const p of existing?.[key] ?? []) await deleteFile(p);
    } else {
      data[key] = await storeFile(files[0], dir);
      if (existing?.[key]) await deleteFile(existing[key]);
    }
  }
}

async function assertUnique(r: ResourceDef, data: Record<string, any>, id: number | null) {
  for (const field of r.unique ?? []) {
    if (data[field] === undefined || data[field] === null) continue;
    const clash = (await col(r.collection).where(field, "==", data[field]).limit(2).get()).docs.find((d) => Number(d.id) !== id);
    if (clash) throw fieldError(field, `The ${field.replace(/_/g, " ")} has already been taken.`);
  }
}

function normaliseBody(body: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body ?? {})) out[k] = typeof v === "string" && /^[[{]/.test(v.trim()) ? parseJson(v) : v;
  return out;
}

crudRouter.get(
  "/crud/:resource",
  guard,
  h(async (req, res) => {
    const r = def(req);
    let rows = await all(r.collection);
    for (const f of r.filters ?? []) if (filled(req, f)) rows = rows.filter((x) => String(x[f]) === strQ(req, f));
    for (const [q, field] of Object.entries(r.aliasFilters ?? {})) if (filled(req, q)) rows = rows.filter((x) => String(x[field]) === strQ(req, q));
    for (const [q, field] of Object.entries(r.arrayFilters ?? {})) if (filled(req, q)) rows = rows.filter((x) => (x[field] ?? []).map(String).includes(strQ(req, q)));
    if (filled(req, "is_active")) rows = rows.filter((x) => String(x.is_active !== false) === String(strQ(req, "is_active") === "1" || strQ(req, "is_active") === "true"));
    if (filled(req, "q") && r.search) {
      const q = strQ(req, "q").toLowerCase();
      rows = rows.filter((x) => r.search!.some((f) => String(x[f] ?? "").toLowerCase().includes(q)));
    }
    rows.sort(r.sort ?? newest);
    const out = r.decorate ? await r.decorate(rows) : rows.map(serialize);
    if (strQ(req, "all") === "1") return ok(res, out, "OK");
    okPage(res, req, out, "OK", 25, 500);
  }),
);

crudRouter.get(
  "/crud/:resource/:id(\\d+)",
  guard,
  h(async (req, res) => {
    const r = def(req);
    const row = await get(r.collection, intParam(req, "id"));
    if (!row) throw notFound();
    ok(res, (r.decorate ? await r.decorate([row]) : [serialize(row)])[0], "OK");
  }),
);

crudRouter.post(
  "/crud/:resource",
  multipart,
  guard,
  h(async (req, res) => {
    const r = def(req);
    if (r.readOnly) throw new ApiError("This resource is read-only.", 405);
    let data = validate(normaliseBody(req.body), r.rules);
    if (r.slugFrom && !data.slug && data[r.slugFrom]) data.slug = slugify(String(data[r.slugFrom]));
    if (r.prepare) data = await r.prepare(data, null);
    await assertUnique(r, data, null);
    await applyFiles(req, r, data, null);
    if (data.is_active === undefined && "is_active" in r.rules) data.is_active = true;
    if (data.is_default) await clearDefault(r.collection);
    const row = await insert(r.collection, data);
    bust(...(r.cacheKeys ?? []));
    ok(res, serialize(row), "Created.", 201);
  }),
);

async function clearDefault(collection: string) {
  const snap = await col(collection).where("is_default", "==", true).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { is_default: false }));
  if (!snap.empty) await batch.commit();
}

crudRouter.put(
  "/crud/:resource/:id(\\d+)",
  multipart,
  guard,
  h(async (req, res) => {
    const r = def(req);
    if (r.readOnly) throw new ApiError("This resource is read-only.", 405);
    const id = intParam(req, "id");
    const existing = await get(r.collection, id);
    if (!existing) throw notFound();
    const rules = Object.fromEntries(Object.entries(r.rules).map(([k, v]) => [k, `sometimes|${v.replace("required|", "")}`]));
    let data = validate(normaliseBody(req.body), rules);
    if (r.slugFrom && "slug" in data && !data.slug && (data[r.slugFrom] ?? existing[r.slugFrom])) data.slug = slugify(String(data[r.slugFrom] ?? existing[r.slugFrom]));
    if (r.prepare) data = await r.prepare(data, existing);
    await assertUnique(r, data, id);
    await applyFiles(req, r, data, existing);
    if (data.is_default) await clearDefault(r.collection);
    await update(r.collection, id, data);
    bust(...(r.cacheKeys ?? []));
    ok(res, serialize((await get(r.collection, id))!), "Updated.");
  }),
);

/** Delete one stored row (+ its uploads); categories must be empty first. */
async function destroy(r: ResourceDef, existing: Doc) {
  if (r.collection === C.categories) {
    const children = await col(C.categories).where("parent_id", "==", existing.id).limit(1).get();
    if (!children.empty) throw new ApiError(`"${existing.name}": delete or move the subcategories first.`, 422);
    const ads = await col(C.ads).where("category_id", "==", existing.id).limit(1).get();
    if (!ads.empty) throw new ApiError(`"${existing.name}" still has advertisements.`, 422);
  }
  for (const [key] of Object.values(r.files ?? {})) {
    const v = existing[key];
    if (Array.isArray(v)) for (const p of v) await deleteFile(p);
    else await deleteFile(v);
  }
  await ref(r.collection, existing.id).delete();
}

crudRouter.delete(
  "/crud/:resource/:id(\\d+)",
  guard,
  h(async (req, res) => {
    const r = def(req);
    const existing = await get(r.collection, intParam(req, "id"));
    if (!existing) throw notFound();
    await destroy(r, existing);
    bust(...(r.cacheKeys ?? []));
    ok(res, null, "Deleted.");
  }),
);

/** Persist a drag-and-drop order: { ids: [3, 1, 2] } → sort_order 0..n (unknown ids are ignored). */
crudRouter.post(
  "/crud/:resource/reorder",
  guard,
  h(async (req, res) => {
    const r = def(req);
    const ids: number[] = (parseJson(req.body?.ids) as any[] ?? []).map(Number).filter((x) => Number.isInteger(x) && x > 0);
    const existing = await getMany(r.collection, ids);
    const batch = db.batch();
    ids.forEach((id, i) => existing.has(id) && batch.update(ref(r.collection, id), { sort_order: i, updated_at: new Date() }));
    if (existing.size) await batch.commit();
    bust(...(r.cacheKeys ?? []));
    ok(res, null, "Order saved.");
  }),
);

/** Bulk toggle / delete: { ids: [...], action: "activate"|"deactivate"|"delete" } (unknown ids are ignored). */
crudRouter.post(
  "/crud/:resource/bulk",
  guard,
  h(async (req, res) => {
    const r = def(req);
    if (r.readOnly) throw new ApiError("This resource is read-only.", 405);
    const d = validate(req.body, { ids: "required|array", action: "required|in:activate,deactivate,delete" });
    const rows = [...(await getMany(r.collection, d.ids.map(Number))).values()];
    try {
      if (d.action === "delete") for (const row of rows) await destroy(r, row);
      else {
        const batch = db.batch();
        rows.forEach((row) => batch.update(ref(r.collection, row.id), { is_active: d.action === "activate", updated_at: new Date() }));
        if (rows.length) await batch.commit();
      }
    } finally {
      bust(...(r.cacheKeys ?? []));
    }
    ok(res, { affected: rows.length }, "Bulk update applied.");
  }),
);
