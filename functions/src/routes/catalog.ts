import { Router } from "express";
import { ApiError, boolQ, filled, h, intParam, intQ, ms, notFound, ok, okPage, strQ } from "../lib/http";
import {
  blogCatRes,
  blogPostRes,
  categoryRes,
  cityRes,
  countryRes,
  currencyRes,
  customFieldRes,
  languageRes,
  packageRes,
  pageRes,
  planRes,
  sliderRes,
  stateRes,
  adsRes,
} from "../lib/resources";
import { publicSettings, setting } from "../lib/settings";
import { C, Doc, allCached, col, first, get, getMany, inc, insert, lookup, ref, where } from "../lib/store";
import { optionalAuth } from "../lib/auth";
import { validate } from "../lib/validate";
import { mediaUrl } from "../lib/media";
import { publishedAds } from "./ads";

export const catalogRouter = Router();

const active = (d: Doc) => d.is_active !== false && d.is_active !== 0;
const bySort = (a: Doc, b: Doc) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || String(a.name ?? "").localeCompare(String(b.name ?? ""));
const byName = (a: Doc, b: Doc) => String(a.name ?? "").localeCompare(String(b.name ?? ""));

export async function activeCategories(): Promise<Doc[]> {
  return (await allCached(C.categories)).filter(active).sort(bySort);
}

/**
 * Custom fields for a category, including those assigned to its ancestors: fields are usually attached at
 * the top level ("Cars & Vehicles") while ads are posted in a subcategory ("Cars").
 */
export async function categoryFields(categoryId: number): Promise<Doc[]> {
  const [fields, cats] = await Promise.all([allCached(C.customFields), lookup(C.categories)]);
  const chain = new Set<number>();
  for (let id: number | null = categoryId, hops = 0; id && hops < 20 && !chain.has(id); hops++) {
    chain.add(id);
    id = cats.get(id)?.parent_id ? Number(cats.get(id)!.parent_id) : null;
  }
  return fields
    .filter((f) => (f.category_ids ?? []).map(Number).some((id: number) => chain.has(id)) && f.is_active !== false)
    .sort((a, b) => {
      const sa = (a.categories ?? []).find((c: any) => Number(c.category_id) === categoryId)?.sort_order ?? a.sort_order ?? 0;
      const sb = (b.categories ?? []).find((c: any) => Number(c.category_id) === categoryId)?.sort_order ?? b.sort_order ?? 0;
      return sa - sb;
    });
}

// ---------- health ----------

catalogRouter.get("/health", (_req, res) => ok(res, { service: "classiads-api", version: "v1", time: new Date().toISOString() }, "OK"));
catalogRouter.get(
  "/health/ready",
  h(async (_req, res) => {
    let firestore = true;
    try {
      await col(C.settings).limit(1).get();
    } catch {
      firestore = false;
    }
    ok(res, { status: firestore ? "ready" : "degraded", checks: { firestore: { ok: firestore }, storage: { ok: true } } }, firestore ? "Ready." : "Degraded.", firestore ? 200 : 503);
  }),
);

// ---------- categories ----------

catalogRouter.get(
  "/categories",
  h(async (req, res) => {
    let cats = await activeCategories();
    if (filled(req, "parent_id")) cats = cats.filter((c) => Number(c.parent_id) === intQ(req, "parent_id"));
    else if (boolQ(req, "roots_only")) cats = cats.filter((c) => !c.parent_id);
    ok(res, cats.map((c) => categoryRes(c)), "Categories.");
  }),
);

catalogRouter.get(
  "/categories/tree",
  h(async (_req, res) => {
    const cats = await activeCategories();
    const roots = cats.filter((c) => !c.parent_id);
    ok(res, roots.map((r) => categoryRes(r, { children: cats.filter((c) => Number(c.parent_id) === r.id) })), "Category tree.");
  }),
);

catalogRouter.get(
  "/categories/:id(\\d+)/custom-fields",
  h(async (req, res) => {
    const id = intParam(req, "id");
    if (!(await get(C.categories, id))) throw notFound("Category");
    ok(res, (await categoryFields(id)).map((f) => customFieldRes(f, id)), "Custom fields.");
  }),
);

catalogRouter.get(
  "/categories/:slug",
  h(async (req, res) => {
    const cats = await activeCategories();
    const cat = cats.find((c) => c.slug === req.params.slug);
    if (!cat) throw notFound("Category");
    ok(res, categoryRes(cat, { children: cats.filter((c) => Number(c.parent_id) === cat.id), customFields: await categoryFields(cat.id) }), "Category.");
  }),
);

// ---------- locations ----------

catalogRouter.get(
  "/locations/countries",
  h(async (_req, res) => ok(res, (await allCached(C.countries)).filter(active).sort(byName).map(countryRes), "Countries.")),
);

catalogRouter.get(
  "/locations/states",
  h(async (req, res) => {
    if (!filled(req, "country_id")) throw new ApiError("The country id field is required.", 422, { country_id: ["The country id field is required."] });
    const cid = intQ(req, "country_id");
    ok(res, (await allCached(C.states)).filter((s) => active(s) && Number(s.country_id) === cid).sort(byName).map(stateRes), "States.");
  }),
);

catalogRouter.get(
  "/locations/cities",
  h(async (req, res) => {
    let cities = (await allCached(C.cities)).filter(active);
    if (filled(req, "state_id")) cities = cities.filter((c) => Number(c.state_id) === intQ(req, "state_id"));
    if (filled(req, "country_id")) cities = cities.filter((c) => Number(c.country_id) === intQ(req, "country_id"));
    ok(res, cities.sort(byName).map(cityRes), "Cities.");
  }),
);

catalogRouter.get(
  "/locations/areas",
  h(async (req, res) => {
    let areas = (await allCached(C.areas)).filter(active);
    if (filled(req, "city_id")) areas = areas.filter((a) => Number(a.city_id) === intQ(req, "city_id"));
    ok(res, areas.sort(byName).map((a) => ({ id: a.id, city_id: a.city_id, name: a.name, latitude: a.latitude ?? null, longitude: a.longitude ?? null })), "Areas.");
  }),
);

// ---------- config / i18n ----------

const activeLanguages = async () => (await allCached(C.languages)).filter(active).sort(bySort);
const activeCurrencies = async () => (await allCached(C.currencies)).filter(active).sort(bySort);

catalogRouter.get("/languages", h(async (_req, res) => ok(res, (await activeLanguages()).map(languageRes), "Languages.")));
catalogRouter.get("/currencies", h(async (_req, res) => ok(res, (await activeCurrencies()).map(currencyRes), "Currencies.")));

catalogRouter.get(
  "/translations/:locale",
  h(async (req, res) => {
    const locale = String(req.params.locale);
    if (!/^[A-Za-z_-]{2,8}$/.test(locale)) throw notFound();
    const def = (await activeLanguages()).find((l) => l.is_default)?.code ?? "en";
    const base = (await ref(C.translations, def).get()).data()?.strings ?? {};
    const over = locale !== def ? (await ref(C.translations, locale).get()).data()?.strings ?? {} : {};
    ok(res, { locale, fallback: def, translations: { ...base, ...over } }, "Translations.");
  }),
);

catalogRouter.get(
  "/config",
  h(async (_req, res) => {
    ok(res, { settings: await publicSettings(), languages: (await activeLanguages()).map(languageRes), currencies: (await activeCurrencies()).map(currencyRes) }, "App config.");
  }),
);

// ---------- home ----------

async function sliderPayload() {
  const sliders = (await allCached(C.sliders)).filter(active).sort(bySort);
  const [ads, cats] = await Promise.all([getMany(C.ads, sliders.map((s) => s.ad_id)), lookup(C.categories)]);
  return sliders.map((s) => sliderRes(s, ads, cats));
}

export async function resolveSectionAds(section: Doc, viewerId?: number) {
  let list = await publishedAds();
  switch (section.filter_type) {
    case "most_viewed":
      list = list.sort((a, b) => Number(b.views_count ?? 0) - Number(a.views_count ?? 0));
      break;
    case "most_liked":
      list = list.sort((a, b) => Number(b.favorites_count ?? 0) - Number(a.favorites_count ?? 0));
      break;
    case "featured":
      list = list.filter((a) => a.is_featured).sort((a, b) => ms(b.published_at) - ms(a.published_at));
      break;
    case "category": {
      const ids = (section.category_ids ?? [section.category_id]).map(Number);
      list = list.filter((a) => ids.includes(Number(a.category_id)) || ids.includes(Number(a.parent_category_id))).sort((a, b) => ms(b.published_at) - ms(a.published_at));
      break;
    }
    case "price_low_high":
      list = list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
      break;
    case "price_high_low":
      list = list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
      break;
    default:
      list = list.sort((a, b) => ms(b.published_at) - ms(a.published_at));
  }
  return adsRes(list.slice(0, Number(section.item_limit ?? 10)), viewerId);
}

async function sectionsPayload(viewerId?: number) {
  const sections = (await allCached(C.featuredSections)).filter(active).sort(bySort);
  return Promise.all(
    sections.map(async (s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug ?? null,
      filter_type: s.filter_type,
      style: s.style ?? null,
      category_id: s.category_id ?? null,
      ads: await resolveSectionAds(s, viewerId),
    })),
  );
}

catalogRouter.get("/sliders", h(async (_req, res) => ok(res, await sliderPayload(), "Sliders.")));
catalogRouter.get("/featured-sections", optionalAuth, h(async (req, res) => ok(res, await sectionsPayload(req.user?.id), "Featured sections.")));

catalogRouter.get(
  "/home",
  optionalAuth,
  h(async (req, res) => {
    const cats = await activeCategories();
    const popularIds: number[] = ((await setting<number[]>("home", "popular_categories", [])) ?? []).map(Number);
    const catMap = new Map(cats.map((c) => [c.id, c]));
    ok(
      res,
      {
        sliders: (await setting("home", "show_slider", true)) ? await sliderPayload() : [],
        categories: cats.filter((c) => !c.parent_id).map((c) => categoryRes(c)),
        popular_categories: popularIds.map((id) => catMap.get(id)).filter(Boolean).map((c) => categoryRes(c!)),
        featured_sections: (await setting("home", "show_featured_section", true)) ? await sectionsPayload(req.user?.id) : [],
        sections_visibility: {
          all_categories: await setting("home", "show_all_categories", true),
          slider: await setting("home", "show_slider", true),
          popular_categories: await setting("home", "show_popular_categories", true),
          featured_section: await setting("home", "show_featured_section", true),
          all_advertisement: await setting("home", "show_all_advertisement", true),
        },
      },
      "Home.",
    );
  }),
);

catalogRouter.get(
  "/tips",
  h(async (_req, res) => ok(res, (await allCached(C.tips)).filter(active).sort(bySort).map((t) => ({ id: t.id, description: t.description, sort_order: t.sort_order ?? 0 })), "Tips.")),
);

catalogRouter.get(
  "/banner-ads",
  h(async (req, res) => {
    let list = (await allCached(C.bannerAds)).filter(active);
    if (filled(req, "platform")) list = list.filter((b) => b.platform === strQ(req, "platform"));
    if (filled(req, "page")) list = list.filter((b) => b.page === strQ(req, "page"));
    ok(
      res,
      list.sort(bySort).map((b) => ({
        id: b.id,
        platform: b.platform,
        page: b.page,
        layout: b.layout,
        placement: b.placement ?? null,
        ad_type: b.ad_type,
        category_id: b.category_id ?? null,
        ad_id: b.ad_id ?? null,
        external_url: b.external_url ?? null,
        image_urls: (b.image_paths ?? []).map((p: string) => mediaUrl(p)),
        sort_order: b.sort_order ?? 0,
      })),
      "Banner ads.",
    );
  }),
);

catalogRouter.get(
  "/faqs",
  h(async (_req, res) => ok(res, (await allCached(C.faqs)).filter(active).sort(bySort).map((f) => ({ id: f.id, question: f.question, answer: f.answer })), "FAQs.")),
);

catalogRouter.get(
  "/report-reasons",
  h(async (_req, res) => ok(res, (await allCached(C.reportReasons)).filter(active).sort(bySort).map((r) => ({ id: r.id, reason: r.reason })), "Report reasons.")),
);

catalogRouter.get(
  "/chat-templates",
  h(async (req, res) => {
    let list = (await allCached(C.chatTemplates)).filter(active);
    if (filled(req, "category_id")) {
      const cid = intQ(req, "category_id");
      list = list.filter((t) => !t.category_ids?.length || t.category_ids.map(Number).includes(cid));
    }
    ok(res, list.map((t) => ({ id: t.id, name: t.name, messages: t.messages ?? [], replies: t.replies ?? [] })), "Chat templates.");
  }),
);

catalogRouter.get(
  "/verification-fields",
  h(async (_req, res) => ok(res, (await allCached(C.verificationFields)).filter(active).sort(bySort), "Verification fields.")),
);

catalogRouter.post(
  "/contact",
  h(async (req, res) => {
    const d = validate(req.body, { name: "required|string|max:150", email: "required|email|max:191", subject: "required|string|max:191", message: "required|string|max:5000" });
    await insert(C.userQueries, d);
    ok(res, null, "Thanks! We'll get back to you soon.", 201);
  }),
);

// ---------- packages / billing catalogue ----------

catalogRouter.get(
  "/packages",
  h(async (req, res) => {
    let pkgs = (await allCached(C.packages)).filter(active).sort(bySort);
    if (filled(req, "category_id")) {
      const cid = intQ(req, "category_id");
      pkgs = pkgs.filter((p) => (p.category_ids ?? []).map(Number).includes(cid));
    }
    if (filled(req, "type")) pkgs = pkgs.filter((p) => (p.type ?? "ad_listing") === strQ(req, "type"));
    const cats = await lookup(C.categories);
    ok(res, pkgs.map((p) => packageRes(p, cats)), "Packages.");
  }),
);

catalogRouter.get(
  "/packages/:id(\\d+)",
  h(async (req, res) => {
    const p = await get(C.packages, intParam(req, "id"));
    if (!p || !active(p)) throw notFound("Package");
    ok(res, packageRes(p, await lookup(C.categories)), "Package.");
  }),
);

catalogRouter.get(
  "/featured-plans",
  h(async (_req, res) => ok(res, (await allCached(C.featuredAdPlans)).filter(active).sort(bySort).map(planRes), "Featured ad plans.")),
);

catalogRouter.get(
  "/payment-gateways",
  h(async (_req, res) => {
    const gws = (await allCached(C.paymentGateways)).filter(active).sort(bySort);
    ok(res, gws.map((g) => ({ code: g.code, name: g.name, is_manual: !!g.is_manual, mode: g.mode, instructions: g.is_manual ? g.config?.instructions ?? null : undefined })), "Payment gateways.");
  }),
);

// ---------- blog / pages / seo ----------

const isPublished = (p: Doc) => p.status === "published" && (!p.published_at || ms(p.published_at) <= Date.now());

catalogRouter.get(
  "/blog",
  h(async (req, res) => {
    let posts = (await where(C.blogPosts, "status", "==", "published")).filter(isPublished);
    const cats = await lookup(C.blogCategories);
    if (filled(req, "category")) {
      const cat = [...cats.values()].find((c) => c.slug === strQ(req, "category"));
      posts = posts.filter((p) => cat && Number(p.blog_category_id) === cat.id);
    }
    if (filled(req, "q")) {
      const q = strQ(req, "q").toLowerCase();
      posts = posts.filter((p) => String(p.title).toLowerCase().includes(q));
    }
    posts.sort((a, b) => ms(b.published_at) - ms(a.published_at));
    const authors = await getMany(C.users, posts.map((p) => p.author_id));
    okPage(
      res,
      req,
      posts.map((p) => blogPostRes(p, { full: boolQ(req, "full"), category: cats.get(Number(p.blog_category_id)) ?? null, author: authors.get(Number(p.author_id)) ?? null })),
      "Blog posts.",
      12,
    );
  }),
);

catalogRouter.get(
  "/blog/categories",
  h(async (_req, res) => {
    const posts = (await where(C.blogPosts, "status", "==", "published")).filter(isPublished);
    const cats = (await allCached(C.blogCategories)).filter(active).sort(bySort);
    ok(res, cats.map((c) => blogCatRes(c, posts.filter((p) => Number(p.blog_category_id) === c.id).length)), "Blog categories.");
  }),
);

catalogRouter.get(
  "/blog/:slug",
  h(async (req, res) => {
    const post = await first(C.blogPosts, "slug", req.params.slug);
    if (!post || !isPublished(post)) throw notFound("Blog post");
    await ref(C.blogPosts, post.id).update({ views_count: inc() });
    const [cat, author] = await Promise.all([get(C.blogCategories, post.blog_category_id), get(C.users, post.author_id)]);
    ok(res, blogPostRes({ ...post, views_count: Number(post.views_count ?? 0) + 1 }, { full: true, category: cat, author }), "Blog post.");
  }),
);

catalogRouter.post(
  "/blog/:id(\\d+)/feedback",
  h(async (req, res) => {
    const useful = req.body?.useful === true || req.body?.useful === "1" || req.body?.useful === 1;
    await ref(C.blogPosts, intParam(req, "id")).update({ [useful ? "useful_count" : "not_useful_count"]: inc() });
    ok(res, null, "Thanks for your feedback.");
  }),
);

catalogRouter.get(
  "/pages",
  h(async (_req, res) => {
    const pages = (await allCached(C.pages)).filter((p) => p.is_published !== false);
    ok(res, pages.map((p) => ({ key: p.key, title: p.title, updated_at: pageRes(p).updated_at })), "Pages.");
  }),
);

catalogRouter.get(
  "/pages/:key",
  h(async (req, res) => {
    const page = (await allCached(C.pages)).find((p) => p.key === req.params.key && p.is_published !== false);
    if (!page) throw notFound("Page");
    ok(res, pageRes(page), "Page.");
  }),
);

async function seoDefaults(meta: Doc | null, model?: Doc | null) {
  const site = await setting("general", "app_name", "ClassiAds_Hub");
  const title = meta?.title ?? model?.title ?? model?.name ?? site;
  const desc = meta?.description ?? model?.excerpt ?? model?.description ?? (await setting("general", "app_tagline", ""));
  return {
    title: String(title).slice(0, 160),
    description: String(desc ?? "").replace(/<[^>]*>/g, "").slice(0, 280),
    keywords: meta?.keywords ?? null,
    og_image: meta?.og_image ?? null,
    json_ld: meta?.json_ld ?? null,
  };
}

catalogRouter.get(
  "/seo",
  h(async (req, res) => {
    const metas = await allCached(C.seoMeta);
    if (filled(req, "route")) {
      return ok(res, await seoDefaults(metas.find((m) => m.route_key === strQ(req, "route")) ?? null), "SEO.");
    }
    const type = strQ(req, "type");
    const coll = ({ ad: C.ads, category: C.categories, blog: C.blogPosts } as Record<string, string>)[type];
    const model = coll ? await first(coll, "slug", strQ(req, "slug")) : null;
    if (!model) return ok(res, await seoDefaults(metas.find((m) => m.route_key === "home") ?? null), "SEO (default).");
    ok(res, await seoDefaults(metas.find((m) => m.seoable_type === type && Number(m.seoable_id) === model.id) ?? null, model), "SEO.");
  }),
);
