import { Router } from "express";
import { me } from "../../lib/auth";
import { h, intParam, notFound, ok, randomStr, slugify } from "../../lib/http";
import { assertImage, deleteFile, storeFile } from "../../lib/media";
import { fileFor, multipart } from "../../lib/multipart";
import { C, first, get, insert, ref, update } from "../../lib/store";
import { fieldError, validate } from "../../lib/validate";
import { serialize } from "./crud";
import { can } from "./guard";

export const blogAdminRouter = Router();

const RULES = {
  title: "required|string|max:191",
  slug: "nullable|string|max:191",
  body: "required|string|raw",
  excerpt: "nullable|string|max:500",
  blog_category_id: "nullable|integer",
  status: "nullable|in:draft,published",
  tags: "nullable|array",
  meta_title: "nullable|string|max:191",
  meta_description: "nullable|string|max:500",
  meta_keywords: "nullable|string|max:500",
  schema: "nullable|string|raw",
  translations: "nullable|array",
};

function normalise(body: Record<string, any>) {
  const out = { ...(body ?? {}) };
  for (const k of ["tags", "translations"]) {
    if (typeof out[k] === "string") {
      try {
        out[k] = JSON.parse(out[k]);
      } catch {
        out[k] = String(out[k]).split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }
  return out;
}

async function uniqueSlug(base: string, id: number | null) {
  let slug = slugify(base, 120);
  const clash = await first(C.blogPosts, "slug", slug);
  if (clash && clash.id !== id) slug = `${slug}-${randomStr(4)}`;
  return slug;
}

async function cover(req: any, existingPath?: string | null) {
  const f = fileFor(req, "cover_image") ?? fileFor(req, "image");
  if (!f) return undefined;
  try {
    assertImage(f, "cover_image");
  } catch (e: any) {
    throw fieldError("cover_image", e.message);
  }
  const path = await storeFile(f, "blog");
  if (existingPath) await deleteFile(existingPath);
  return path;
}

blogAdminRouter.post(
  "/blog",
  multipart,
  can("blogs"),
  h(async (req, res) => {
    const d = validate(normalise(req.body), RULES);
    d.slug = await uniqueSlug(d.slug || d.title, null);
    const path = await cover(req);
    if (path) d.cover_image_path = path;
    d.status = d.status ?? "draft";
    if (d.status === "published") d.published_at = new Date();
    if (!d.excerpt) d.excerpt = String(d.body).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    const post = await insert(C.blogPosts, { ...d, author_id: me(req).id, views_count: 0, useful_count: 0, not_useful_count: 0 });
    ok(res, serialize(post), "Post created.", 201);
  }),
);

blogAdminRouter.put(
  "/blog/:id(\\d+)",
  multipart,
  can("blogs"),
  h(async (req, res) => {
    const id = intParam(req, "id");
    const post = await get(C.blogPosts, id);
    if (!post) throw notFound("Blog post");
    const rules = Object.fromEntries(Object.entries(RULES).map(([k, v]) => [k, `sometimes|${v.replace("required|", "")}`]));
    const d = validate(normalise(req.body), rules);
    if (d.slug !== undefined || d.title) d.slug = await uniqueSlug(d.slug || d.title || post.title, id);
    const path = await cover(req, post.cover_image_path);
    if (path) d.cover_image_path = path;
    if (d.status === "published" && !post.published_at) d.published_at = new Date();
    // The excerpt is derived from the body unless one is supplied explicitly.
    if (d.body && !d.excerpt) d.excerpt = String(d.body).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    await update(C.blogPosts, id, d);
    ok(res, serialize((await get(C.blogPosts, id))!), "Post updated.");
  }),
);

blogAdminRouter.delete(
  "/blog/:id(\\d+)",
  can("blogs"),
  h(async (req, res) => {
    const post = await get(C.blogPosts, intParam(req, "id"));
    if (!post) throw notFound("Blog post");
    await deleteFile(post.cover_image_path);
    await ref(C.blogPosts, post.id).delete();
    ok(res, null, "Post deleted.");
  }),
);
