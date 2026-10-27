/**
 * One-off migration: Laravel/MySQL (XAMPP) → Firestore + Firebase Auth.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=../../secret/classiadshub-firebase.json node migrate.js
 *
 * Re-runnable: every document is written with set() on its numeric id, so a second
 * run overwrites instead of duplicating. Test-suite artefact accounts (@example.com)
 * are skipped. Passwords are imported as their existing bcrypt hashes.
 */
const mysql = require("mysql2/promise");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ credential: applicationDefault(), projectId: "classiadshub" });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = getAuth();

const BOOL = /^(is_|notify$|auto_approve)/;
const NUM = new Set(["latitude", "longitude", "rating_avg"]);
const JSONF = new Set(["query", "data", "config", "supported_currencies", "meta", "variables", "translations", "json_ld", "values", "tags", "changes", "target_user_ids"]);

function clean(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      out[k] = null;
      continue;
    }
    if (BOOL.test(k) && typeof v === "number") out[k] = v === 1;
    else if (NUM.has(k)) out[k] = Number(v);
    else if (JSONF.has(k) && typeof v === "string") {
      try {
        out[k] = JSON.parse(v);
      } catch {
        out[k] = v;
      }
    } else if (Buffer.isBuffer(v)) out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

const keywords = (t, d) => [...new Set(`${t} ${d}`.toLowerCase().split(/[^a-z0-9À-￿]+/).filter((w) => w.length > 1))].slice(0, 200);
const isTestEmail = (e) => !!e && /@example\.com$/i.test(e);
const short = (t) => (t ? String(t).split("\\").pop().toLowerCase().replace("blogpost", "blog") : null);
const phoneEmail = (p) => `p${String(p).replace(/\D/g, "")}@phone.classiadshub.app`;

async function writeAll(collection, docs, idOf = (d) => String(d.id)) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + 400)) batch.set(db.collection(collection).doc(idOf(d)), d);
    await batch.commit();
  }
  const max = docs.reduce((m, d) => (typeof d.id === "number" && d.id > m ? d.id : m), 0);
  if (max) await db.collection("counters").doc(collection).set({ value: max }, { merge: true });
  console.log(`  ${collection.padEnd(22)} ${docs.length}`);
}

(async () => {
  const sql = await mysql.createConnection({ host: "127.0.0.1", user: "root", password: "", database: "classiads", dateStrings: false });
  const q = async (s) => (await sql.query(s))[0].map(clean);
  const by = (rows, key) => rows.reduce((m, r) => (m.set(r[key], [...(m.get(r[key]) ?? []), r]), m), new Map());

  console.log("Reading MySQL…");
  const users = (await sql.query("select * from users"))[0];
  const roleRows = await q("select r.name, mr.model_id from model_has_roles mr join roles r on r.id = mr.role_id");
  const profiles = by(await q("select * from seller_profiles"), "user_id");
  const socials = by(await q("select * from social_accounts"), "user_id");
  const keptUserIds = new Set();

  // ---------- users + auth ----------
  const userDocs = [];
  const authImports = [];
  for (const raw of users) {
    const u = clean(raw);
    if (isTestEmail(u.email) || u.deleted_at) continue;
    keptUserIds.add(u.id);
    const roles = roleRows.filter((r) => r.model_id === u.id).map((r) => r.name);
    const p = profiles.get(u.id)?.[0];
    const social = Object.fromEntries((socials.get(u.id) ?? []).map((s) => [s.provider, s.provider_user_id]));
    userDocs.push({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      email_verified_at: u.email_verified_at,
      phone_verified_at: u.phone_verified_at,
      avatar_path: u.avatar_path,
      address: u.address,
      status: u.status ?? "active",
      is_verified: !!u.is_verified,
      auto_approve_ads: !!u.auto_approve_advertisement,
      preferred_language: u.preferred_language,
      preferred_currency: u.preferred_currency,
      last_login_at: u.last_login_at,
      roles: roles.length ? roles : ["customer"],
      login_type: Object.keys(social)[0] ?? (u.email ? "email" : "phone"),
      social,
      ...(p ? { seller_profile: { display_name: p.display_name, bio: p.bio, business_name: p.business_name, website: p.website, rating_avg: Number(p.rating_avg ?? 0), rating_count: p.rating_count ?? 0, member_since: p.member_since } } : {}),
      created_at: u.created_at,
      updated_at: u.updated_at,
    });
    const hash = raw.password ? String(raw.password).replace(/^\$2y\$/, "$2a$") : null;
    authImports.push({
      uid: String(u.id),
      email: u.email ?? (u.phone ? phoneEmail(u.phone) : undefined),
      emailVerified: !!u.email_verified_at,
      displayName: u.name,
      disabled: (u.status ?? "active") !== "active",
      ...(hash ? { passwordHash: Buffer.from(hash) } : {}),
    });
  }
  console.log("Writing Firestore…");
  await writeAll("users", userDocs);
  const imp = await auth.importUsers(authImports, { hash: { algorithm: "BCRYPT" } });
  console.log(`  auth users imported   ${imp.successCount} (failures: ${imp.failureCount})`);
  imp.errors.forEach((e) => console.log("   !", authImports[e.index].uid, e.error.message));

  // ---------- reference data ----------
  await writeAll("countries", await q("select * from countries"));
  await writeAll("states", await q("select * from states"));
  await writeAll("cities", await q("select * from cities"));
  await writeAll("areas", await q("select * from areas"));
  const countries = new Map((await q("select id, name from countries")).map((c) => [c.id, c.name]));
  await writeAll("currencies", (await q("select * from currencies")).map((c) => ({ ...c, country: countries.get(c.country_id) ?? null })));
  await writeAll("languages", await q("select * from languages"));
  await writeAll("categories", await q("select * from categories"));

  const options = by(await q("select * from custom_field_options"), "custom_field_id");
  const links = by(await q("select * from category_custom_field"), "custom_field_id");
  await writeAll(
    "custom_fields",
    (await q("select * from custom_fields")).map((f) => ({
      ...f,
      is_active: true,
      options: (options.get(f.id) ?? []).map((o) => ({ id: o.id, label: o.label, value: o.value, sort_order: o.sort_order ?? 0 })),
      category_ids: (links.get(f.id) ?? []).map((l) => l.category_id),
      categories: (links.get(f.id) ?? []).map((l) => ({ category_id: l.category_id, is_required: !!l.is_required, sort_order: l.sort_order ?? 0 })),
    })),
  );

  // ---------- settings ----------
  const settings = {};
  for (const s of await q("select * from settings")) {
    const v = s.type === "bool" ? s.value === "1" || s.value === "true" : s.type === "int" ? Number(s.value) : s.type === "json" ? (() => { try { return JSON.parse(s.value); } catch { return s.value; } })() : s.value;
    settings[s.group] ??= { _types: {} };
    settings[s.group][s.key] = v;
    settings[s.group]._types[s.key] = s.type;
    if (s.type === "secret") (settings[s.group]._secret ??= []).push(s.key);
  }
  settings.home ??= { show_all_categories: true, show_slider: true, show_popular_categories: true, show_featured_section: true, show_all_advertisement: true, popular_categories: [] };
  settings.general.app_name = settings.general.app_name ?? "ClassiAds_Hub";
  settings.general.frontend_url = "https://classiadshub.web.app";
  for (const [group, values] of Object.entries(settings)) await db.collection("settings").doc(group).set(values, { merge: true });
  console.log(`  settings               ${Object.keys(settings).length} groups`);

  const tr = {};
  for (const t of await q("select * from translations")) (tr[t.locale] ??= {})[t.key] = t.value;
  for (const [locale, strings] of Object.entries(tr)) await db.collection("translations").doc(locale).set({ locale, strings, updated_at: new Date() });
  console.log(`  translations           ${Object.keys(tr).length} locales`);

  // ---------- ads ----------
  const cats = new Map((await q("select id, parent_id from categories")).map((c) => [c.id, c]));
  const images = by(await q("select * from ad_images"), "ad_id");
  const values = by(await q("select * from ad_custom_field_values"), "ad_id");
  const ads = (await q("select * from ads where deleted_at is null"))
    .filter((a) => keptUserIds.has(a.user_id))
    .map((a) => {
      const { deleted_at, ...rest } = a;
      return {
        ...rest,
        parent_category_id: cats.get(a.category_id)?.parent_id ?? null,
        images: (images.get(a.id) ?? []).map((i) => ({ id: i.id, path: i.path, is_primary: !!i.is_primary, sort_order: i.sort_order ?? 0 })),
        custom_field_values: Object.fromEntries((values.get(a.id) ?? []).map((v) => {
          let val = v.value;
          try { const p = JSON.parse(val); if (Array.isArray(p)) val = p; } catch { /* scalar */ }
          return [v.custom_field_id, val];
        })),
        keywords: keywords(a.title ?? "", a.description ?? ""),
      };
    });
  await writeAll("ads", ads);
  const adIds = new Set(ads.map((a) => a.id));

  await writeAll("favorites", (await q("select * from favorites")).filter((f) => adIds.has(f.ad_id) && keptUserIds.has(f.user_id)), (f) => `${f.user_id}_${f.ad_id}`);
  await writeAll("saved_searches", (await q("select * from saved_searches")).filter((s) => keptUserIds.has(s.user_id)));
  await writeAll("follows", (await q("select * from follows")).filter((f) => keptUserIds.has(f.follower_id) && keptUserIds.has(f.following_id)), (f) => `${f.follower_id}_${f.following_id}`);

  const convos = (await q("select * from conversations")).filter((c) => keptUserIds.has(c.buyer_id) && keptUserIds.has(c.seller_id));
  convos.forEach((c) => Object.assign(c, { key: `${c.ad_id}_${c.buyer_id}`, participant_uids: [String(c.buyer_id), String(c.seller_id)] }));
  await writeAll("conversations", convos);
  const convoMap = new Map(convos.map((c) => [c.id, c]));
  await writeAll("messages", (await q("select * from messages")).filter((m) => convoMap.has(m.conversation_id)).map((m) => ({ ...m, participant_uids: convoMap.get(m.conversation_id).participant_uids })));
  await writeAll("offers", (await q("select * from offers")).filter((o) => keptUserIds.has(o.buyer_id) && keptUserIds.has(o.seller_id)));
  await writeAll("ad_sales", await q("select * from ad_sales"), (s) => String(s.ad_id));
  await writeAll("reviews", (await q("select * from reviews")).map((r) => ({ ...r, key: `${r.reviewer_id}_${r.reviewee_id}_${r.ad_id ?? 0}` })));
  await writeAll("reports", (await q("select * from reports")).map((r) => ({ ...r, reportable_type: short(r.reportable_type), key: `${r.reporter_id}_${short(r.reportable_type)}_${r.reportable_id}` })));

  const notifs = (await q("select * from notifications")).filter((n) => keptUserIds.has(Number(n.notifiable_id)));
  for (const n of notifs) await db.collection("notifications").doc(n.id).set({ uuid: n.id, user_id: Number(n.notifiable_id), type: n.type, data: n.data ?? {}, read_at: n.read_at, created_at: n.created_at });
  console.log(`  notifications          ${notifs.length}`);
  await writeAll("push_notifications", await q("select * from push_notifications"));
  await writeAll("user_devices", (await q("select * from user_devices")).filter((d) => keptUserIds.has(d.user_id)), (d) => Buffer.from(d.fcm_token).toString("base64url").slice(-200));

  // ---------- commerce ----------
  const pkgCats = by(await q("select * from package_category"), "package_id");
  await writeAll("packages", (await q("select * from packages")).map((p) => ({ ...p, type: "ad_listing", status: p.is_active ? "active" : "inactive", key_points: [], category_ids: (pkgCats.get(p.id) ?? []).map((x) => x.category_id) })));
  await writeAll("featured_ad_plans", await q("select * from featured_ad_plans"));
  await writeAll("payment_gateways", await q("select * from payment_gateways"));
  await writeAll("transactions", (await q("select * from transactions")).filter((t) => keptUserIds.has(t.user_id)));
  await writeAll("subscriptions", (await q("select * from subscriptions")).filter((s) => keptUserIds.has(s.user_id)));
  await writeAll("invoices", (await q("select * from invoices")).filter((i) => keptUserIds.has(i.user_id)));

  // ---------- content ----------
  await writeAll("featured_sections", await q("select * from featured_sections"));
  await writeAll("sliders", await q("select * from sliders"));
  await writeAll("blog_categories", await q("select * from blog_categories"));
  await writeAll("blog_posts", (await q("select * from blog_posts")).map((p) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : p.tags ? String(p.tags).split(",").map((s) => s.trim()) : [] })));
  await writeAll("pages", await q("select * from pages"));
  await writeAll("seo_meta", (await q("select * from seo_meta")).map((s) => ({ ...s, seoable_type: short(s.seoable_type) })));
  await writeAll("faqs", await q("select * from faqs"));
  await writeAll("email_templates", await q("select * from email_templates"));
  await writeAll("user_queries", await q("select * from user_queries"));
  await writeAll("verification_fields", (await q("select * from verification_fields")).map(({ field_type, ...f }) => ({ ...f, type: field_type })));
  await writeAll("verification_requests", (await q("select * from verification_requests")).filter((v) => keptUserIds.has(v.user_id)));
  await writeAll("job_listings", await q("select * from job_listings"));
  await writeAll("job_applications", await q("select * from job_applications"));

  // Staff role preserves the Laravel `staff` moderation scope.
  await writeAll("roles", [{ id: 1, name: "staff", permissions: ["dashboard", "ads", "chat", "sellers", "customers", "reports", "notifications"], created_at: new Date(), updated_at: new Date() }]);

  // Offer-item tips previously lived in settings (offer_tips.items).
  const tips = settings.offer_tips?.items;
  const tipList = Array.isArray(tips) && tips.length ? tips : ["Avoid entering your UPI PIN when receiving payments.", "Never hand over money or products upfront.", "Report users about any suspicious activity.", "Meet in a safe, public place when meeting a buyer."];
  await writeAll("tips", tipList.map((t, i) => ({ id: i + 1, description: typeof t === "string" ? t : t.description ?? t.text ?? String(t), is_active: true, sort_order: i, created_at: new Date(), updated_at: new Date() })));

  const reasons = ["Incomplete Information", "Fake Items", "Unresponsive Seller", "Pricing Discrepancies", "Poor Quality Images", "Misleading Description", "Item Not as Described"];
  await writeAll("report_reasons", reasons.map((r, i) => ({ id: i + 1, reason: r, is_active: true, sort_order: i, created_at: new Date(), updated_at: new Date() })));

  // Audit log history.
  const logs = await q("select * from audit_logs");
  for (const l of logs) await db.collection("audit_logs").doc(`mysql_${l.id}`).set({ user_id: l.user_id, action: l.action, subject_type: short(l.auditable_type), subject_id: l.auditable_id, meta: l.changes ?? {}, ip: l.ip, created_at: l.created_at });
  console.log(`  audit_logs             ${logs.length}`);

  await sql.end();
  console.log("Done.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
