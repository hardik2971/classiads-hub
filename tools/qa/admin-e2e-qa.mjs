/**
 * Admin panel end-to-end QA: drives the real admin UI (Playwright) against the live Firebase backend,
 * creating "QA-ADMIN" entries in every module, verifying persistence through the API and Firestore,
 * editing / toggling / reordering / deleting them, and checking public side effects.
 *   node admin-e2e-qa.mjs [module ...]     (no args = all modules)
 */
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { call, signIn, PNG } from "./qa-lib.mjs";
import { db, auth as fbAuth, purgeUser } from "./qa-fs.mjs";

const UI = process.env.QA_UI ?? "http://localhost:4100";
const SHOTS = "./shots/admin-agent";
await mkdir(SHOTS, { recursive: true });
const IMG = { name: "qa-admin.png", mimeType: "image/png", buffer: PNG };
const IMG2 = { name: "qa-admin-2.png", mimeType: "image/png", buffer: PNG };
const stamp = Date.now().toString(36).slice(-5);
const Q = (s) => `QA-ADMIN ${s} ${stamp}`;

const results = [];
const created = []; // { module, what, id, cleaned }
let T = await signIn("admin@classiads.test");
setInterval(async () => (T = await signIn("admin@classiads.test")), 40 * 60 * 1000).unref();
const A = (method, path, opts = {}) => call(method, path, { token: T, ...opts });
const okd = (r, msg = "") => {
  if (r.status >= 300 || r.success !== true) throw new Error(`HTTP ${r.status} ${r.message ?? ""} ${msg} ${r.errors ? JSON.stringify(r.errors) : ""}`);
  return r.data;
};
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const fsDoc = async (col, id) => (await db.collection(col).doc(String(id)).get()).data() ?? null;
const ADDBTN = /^\s*Add\s*$/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Public reference tables are cached per function instance for 30s. */
async function eventually(fn, what, tries = 8, gap = 5000) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const v = await fn();
      if (v) return v;
    } catch (e) {
      last = e;
    }
    await sleep(gap);
  }
  throw new Error(`${what} never became true ${last ? last.message : ""}`);
}

// ---------------- browser ----------------
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
let current = "login";
let problems = [];
let allowHttp = []; // regexes of expected API failures in the current module
page.on("console", (m) => m.type() === "error" && !/favicon|Download the React DevTools|tile\.openstreetmap|Failed to load resource: the server responded with a status of 4(22|03)/.test(m.text()) && problems.push(`console: ${m.text().slice(0, 220)}`));
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 220)}`));
page.on("response", (r) => {
  const u = r.url();
  if (u.includes("/api/v1") && r.status() >= 400) {
    const s = `HTTP ${r.status()} ${r.request().method()} ${u.replace(/^.*\/api\/v1/, "")}`;
    if (!allowHttp.some((re) => re.test(s))) problems.push(s);
  }
});
page.on("dialog", (d) => d.accept());

async function login(p, email, password = "password") {
  await p.goto(`${UI}/login`);
  await p.fill('input[autocomplete="username"]', email);
  await p.fill('input[type="password"]', password);
  await p.click('button[type="submit"]');
  await p.waitForURL(/\/dashboard/, { timeout: 30000 });
  await p.waitForLoadState("networkidle").catch(() => undefined);
}
async function go(path, p = page) {
  await p.goto(`${UI}${path}`);
  await p.waitForLoadState("networkidle").catch(() => undefined);
  await p.waitForTimeout(400);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The control inside a <label> whose span.label reads `text` (optional trailing "*"). */
function field(scope, text, which = "input:not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select") {
  return scope.locator("label").filter({ has: page.locator("span.label", { hasText: new RegExp(`^\\s*${esc(text)}\\s*\\*?\\s*$`) }) }).locator(which).first();
}
const fileIn = (scope, text) => field(scope, text, "input[type=file]");
async function toast(text, timeout = 20000) {
  const t = page.locator("div.fixed.right-4.top-4 > div", { hasText: text });
  await t.first().waitFor({ timeout });
  return (await t.first().textContent()).trim();
}
async function errorToast() {
  const t = page.locator("div.fixed.right-4.top-4 > div.bg-danger");
  return (await t.count()) ? (await t.first().textContent()).trim() : null;
}
const modal = () => page.locator("div.fixed.inset-0.z-50 > div").last();
async function confirmYes(label = /Yes, delete|Suspend|Remove|Confirm|Approve|Reject|Yes/) {
  const m = modal();
  await m.waitFor();
  await m.getByRole("button", { name: label }).last().click();
}
/** Wait until no optimistic switch is still saving. */
const settled = () => page.waitForFunction(() => !document.querySelector("[role=switch][aria-busy=true]"), null, { timeout: 20000 });
const row = (text, scope = page) => scope.locator("tbody tr", { hasText: text });
async function search(text, scope = page) {
  const s = scope.locator('input[placeholder="Search..."]').first();
  await s.fill(text);
  await page.waitForTimeout(900);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}
async function shot(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }).catch(() => undefined);
}

async function check(name, fn) {
  if (process.env.QA_ONLY && !new RegExp(process.env.QA_ONLY, "i").test(name)) return;
  const t = Date.now();
  current = name;
  problems = [];
  allowHttp = [];
  try {
    const detail = await fn();
    if (problems.length) throw new Error(`UI problems: ${problems.join(" | ")}`);
    results.push({ name, ok: true, ms: Date.now() - t, detail: detail ?? "" });
    console.log(`PASS  ${name}  ${detail ?? ""}`);
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t, detail: e.message.slice(0, 600) });
    console.log(`FAIL  ${name}  ${e.message.slice(0, 600)}`);
    await shot(`FAIL-${name.replace(/[^a-z0-9]+/gi, "_")}`);
  }
}
const track = (module, what, id) => {
  const e = { module, what, id, cleaned: false };
  created.push(e);
  return e;
};
const findCrud = async (resource, pred) => (okd(await A("GET", `/admin/crud/${resource}`, { query: { all: 1 } })) ?? []).find(pred);

/**
 * Generic CrudPage flow: create via form → verify list + API + Firestore → edit → toggle → delete.
 * `fill(scope, phase)` fills the form ("create" | "edit"). `key` is the display field used for lookups.
 */
async function crudFlow({ module, path, resource, collection, key, name, editName, fill, layout = "modal", verify, toggle = true, createBtn }) {
  await go(path);
  let scope;
  if (layout === "side") scope = page.locator("section").filter({ has: page.locator("h2", { hasText: /^(Add|Edit) / }) }).first();
  else {
    await page.locator("main").getByRole("button", { name: createBtn ?? /^(Create|Add)/ }).last().click();
    scope = modal();
    await scope.waitFor();
  }
  await fill(scope, "create");
  await scope.getByRole("button", { name: layout === "side" ? "Submit" : "Save" }).click();
  await toast(/created/i);
  const rec = await eventually(() => findCrud(resource, (r) => r[key] === name), `${resource} "${name}" in API`, 3, 1500);
  const tr = track(module, `${resource} "${name}"`, rec.id);
  const stored = await fsDoc(collection, rec.id);
  assert(stored && stored[key] === name, `Firestore ${collection}/${rec.id} missing`);
  if (verify) await verify(rec, stored, "create");
  await search(name);
  await row(name).first().waitFor({ timeout: 10000 });

  // edit
  await row(name).first().getByTitle("Edit").click();
  if (layout !== "side") {
    scope = modal();
    await scope.waitFor();
  }
  await fill(scope, "edit");
  await scope.getByRole("button", { name: layout === "side" ? "Update" : "Update" }).click();
  await toast(/updated/i);
  const after = await fsDoc(collection, rec.id);
  assert(after[key] === editName, `edit not persisted: ${after[key]}`);
  if (verify) await verify(rec, after, "edit");

  // toggle active
  if (toggle) {
    await search(editName);
    const sw = row(editName).first().getByRole("switch");
    await sw.click();
    await eventually(async () => (await fsDoc(collection, rec.id)).is_active === false, "toggle off persisted", 10, 1000);
    await sw.click();
    await eventually(async () => (await fsDoc(collection, rec.id)).is_active === true, "toggle on persisted", 10, 1000);
  }
  await shot(`${module}`);

  // delete
  await search(editName);
  await row(editName).first().getByTitle("Delete").click();
  await confirmYes();
  await toast(/deleted/i);
  assert(!(await fsDoc(collection, rec.id)), "not deleted from Firestore");
  tr.cleaned = true;
  return `#${rec.id} create/edit/${toggle ? "toggle/" : ""}delete`;
}

// ===================================================================================
const MODULES = {};
const mod = (name, fn) => (MODULES[name] = fn);

mod("simple-crud", async () => {
  await check("Report reasons (side form, translations)", () =>
    crudFlow({
      module: "report-reasons", path: "/reports/reasons", resource: "report_reasons", collection: "report_reasons", key: "reason", layout: "side", toggle: false,
      name: Q("reason"), editName: Q("reason edited"),
      fill: async (s, ph) => {
        await field(s, "Reason (EN)").fill(ph === "create" ? Q("reason") : Q("reason edited"));
        const tabs = s.locator("button", { hasText: /^(Hindi|Arabic|Gujarati|Spanish|French)/ });
        if (ph === "create" && (await tabs.count())) {
          const tab = tabs.first();
          const code = await tab.textContent();
          await tab.click();
          await s.locator("textarea").first().fill("QA translated reason");
          await s.locator("button", { hasText: "English" }).click();
          return code;
        }
      },
      verify: async (rec, st, ph) => {
        if (ph === "create") assert(st.translations && Object.values(st.translations).some((x) => x.reason === "QA translated reason"), `translation not stored: ${JSON.stringify(st.translations)}`);
        const pub = okd(await call("GET", "/report-reasons"));
        await eventually(async () => okd(await call("GET", "/report-reasons")).some((r) => r.id === rec.id), "public /report-reasons shows it", 8);
        void pub;
      },
    }),
  );
  await check("Tips (modal, toggle, reorder)", async () => {
    const name = Q("tip"), edit = Q("tip edited");
    const r = await crudFlow({
      module: "tips", path: "/content/tips", resource: "tips", collection: "tips", key: "description", name, editName: edit, createBtn: "Add Tip",
      fill: async (s, ph) => field(s, "Description (EN)").fill(ph === "create" ? name : edit),
      verify: async (rec, st, ph) => {
        if (ph === "edit") await eventually(async () => okd(await call("GET", "/tips")).some((t) => t.id === rec.id && t.description === edit), "public /tips has edit", 8);
      },
    });
    return r;
  });
  await check("Tips reorder (drag rows → sort_order persisted)", async () => {
    const before = okd(await A("GET", "/admin/crud/tips", { query: { all: 1 } }));
    assert(before.length >= 2, "need ≥2 tips");
    await go("/content/tips");
    const rows = page.locator("tbody tr");
    await rows.nth(1).dragTo(rows.nth(0));
    await toast("Order saved.");
    const after = okd(await A("GET", "/admin/crud/tips", { query: { all: 1 } }));
    assert(after[0].id === before[1].id, `order not changed: ${after.map((x) => x.id)} vs ${before.map((x) => x.id)}`);
    // restore
    okd(await A("POST", "/admin/crud/tips/reorder", { body: { ids: before.map((x) => x.id) } }));
    for (const b of before) if (b.sort_order !== undefined) await db.collection("tips").doc(String(b.id)).update({ sort_order: b.sort_order });
    return `${before[1].id} moved to top, restored`;
  });
  await check("Blog categories (modal + slug)", () =>
    crudFlow({
      module: "blog-categories", path: "/blogs/categories", resource: "blog_categories", collection: "blog_categories", key: "name", name: Q("blogcat"), editName: Q("blogcat edited"), createBtn: "Add Blog Category",
      fill: async (s, ph) => field(s, "Name (EN)").fill(ph === "create" ? Q("blogcat") : Q("blogcat edited")),
      verify: async (rec, st, ph) => assert(st.slug && st.slug.startsWith("qa-admin-blogcat"), `slug ${st.slug} (${ph})`),
    }),
  );
  await check("FAQs (stacked, reorderable)", () =>
    crudFlow({
      module: "faqs", path: "/blogs/faqs", resource: "faqs", collection: "faqs", key: "question", name: Q("faq?"), editName: Q("faq edited?"),
      fill: async (s, ph) => {
        await field(s, "Question (EN)").fill(ph === "create" ? Q("faq?") : Q("faq edited?"));
        await field(s, "Answer (EN)").fill("QA answer " + ph);
      },
      verify: async (rec, st, ph) => {
        assert(st.answer === "QA answer " + ph, "answer");
        if (ph === "create") await eventually(async () => okd(await call("GET", "/faqs")).some((f) => f.id === rec.id), "public /faqs", 8);
      },
    }),
  );
  await check("Chat templates (lists + category scope)", () =>
    crudFlow({
      module: "chat-templates", path: "/chat/templates", resource: "chat_templates", collection: "chat_templates", key: "name", name: Q("tpl"), editName: Q("tpl edited"),
      fill: async (s, ph) => {
        await field(s, "Name").fill(ph === "create" ? Q("tpl") : Q("tpl edited"));
        if (ph === "create") {
          await s.locator("button", { hasText: ADDBTN }).first().click();
          await s.locator('input[placeholder="e.g. Is this still available?"]').fill("QA is it available?");
          await s.locator("button", { hasText: ADDBTN }).nth(1).click();
          await s.locator('input[placeholder="e.g. Yes, it is available."]').fill("QA yes");
          await s.locator("input[type=checkbox]").first().check();
        }
      },
      verify: async (rec, st, ph) => {
        assert(st.messages?.[0] === "QA is it available?" && st.replies?.[0] === "QA yes", `lists ${JSON.stringify([st.messages, st.replies])}`);
        assert(Array.isArray(st.category_ids) && st.category_ids.length === 1, `category_ids ${JSON.stringify(st.category_ids)}`);
      },
    }),
  );
  await check("Featured ad plans (price in minor units)", () =>
    crudFlow({
      module: "featured-plans", path: "/packages/featured-plans", resource: "featured_ad_plans", collection: "featured_ad_plans", key: "name", name: Q("plan"), editName: Q("plan edited"),
      fill: async (s, ph) => {
        await field(s, "Name").fill(ph === "create" ? Q("plan") : Q("plan edited"));
        await field(s, "Price").fill(ph === "create" ? "12.5" : "15");
        await field(s, "Duration (Days)").fill("9");
      },
      verify: async (rec, st, ph) => assert(st.price === (ph === "create" ? 1250 : 1500) && st.duration_days === 9, `price ${st.price} dur ${st.duration_days}`),
    }),
  );
  await check("Verification fields (dropdown values)", () =>
    crudFlow({
      module: "verification-fields", path: "/sellers/verification-fields", resource: "verification_fields", collection: "verification_fields", key: "name", name: Q("vf"), editName: Q("vf edited"),
      fill: async (s, ph) => {
        await field(s, "Field Name (EN)").fill(ph === "create" ? Q("vf") : Q("vf edited"));
        if (ph === "create") {
          await field(s, "Field Type").selectOption("dropdown");
          await s.locator("button", { hasText: ADDBTN }).click();
          await s.locator('input[placeholder="Enter value"]').last().fill("Opt A");
          await s.locator("button", { hasText: ADDBTN }).click();
          await s.locator('input[placeholder="Enter value"]').last().fill("Opt B");
        }
      },
      verify: async (rec, st) => assert(st.type === "dropdown" && JSON.stringify(st.values) === '["Opt A","Opt B"]', `values ${JSON.stringify(st.values)}`),
    }),
  );
  await check("Roles (permissions)", () =>
    crudFlow({
      module: "roles", path: "/customers/roles", resource: "roles", collection: "roles", key: "name", name: `qa-admin-role-${stamp}`, editName: `qa-admin-role2-${stamp}`, toggle: false, createBtn: "Create New Role",
      fill: async (s, ph) => {
        await field(s, "Role name").fill(ph === "create" ? `qa-admin-role-${stamp}` : `qa-admin-role2-${stamp}`);
        if (ph === "create") await s.getByRole("checkbox", { name: "Categories", exact: true }).check();
      },
      verify: async (rec, st) => assert(st.permissions.includes("categories") && st.permissions.includes("dashboard"), `perms ${st.permissions}`),
    }),
  );
  await check("Currencies (uppercase code, unique)", () =>
    crudFlow({
      module: "currencies", path: "/locations/currencies", resource: "currencies", collection: "currencies", key: "name", name: Q("cur"), editName: Q("cur edited"),
      fill: async (s, ph) => {
        if (ph === "create") {
          await field(s, "ISO Code").fill("qzz");
          await field(s, "Symbol").fill("Q$");
        }
        await field(s, "Name").fill(ph === "create" ? Q("cur") : Q("cur edited"));
      },
      verify: async (rec, st) => assert(st.code === "QZZ" && st.is_default !== true, `code ${st.code}`),
    }),
  );
});

mod("catalog", async () => {
  const ctx = {};
  await check("Categories: create with icon (form) → list/API/Firestore/public", async () => {
    await go("/categories/form");
    await field(page, "Name (EN)").fill(Q("cat"));
    await field(page, "Description (EN)").fill("QA category description");
    await fileIn(page, "Icon").setInputFiles(IMG);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/categories$/, { timeout: 30000 });
    const rec = await findCrud("categories", (c) => c.name === Q("cat"));
    assert(rec, "not in API");
    ctx.parent = rec;
    track("categories", `category "${rec.name}"`, rec.id);
    const st = await fsDoc("categories", rec.id);
    assert(st.icon_path?.startsWith("categories/") && st.slug.startsWith("qa-admin-cat"), `icon/slug ${st.icon_path} ${st.slug}`);
    const head = await fetch(rec.icon_url);
    assert(head.ok, `icon URL not public (${head.status})`);
    await search(Q("cat"));
    await row(Q("cat")).first().waitFor();
    await eventually(async () => okd(await call("GET", "/categories")).some((c) => c.id === rec.id), "public /categories lists it");
    return `#${rec.id} icon public`;
  });
  await check("Categories: subcategory + parent picker excludes self + edit", async () => {
    await go(`/categories/form?parent_id=${ctx.parent.id}`);
    await field(page, "Name (EN)").fill(Q("subcat"));
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/categories$/, { timeout: 30000 });
    const sub = await findCrud("categories", (c) => c.name === Q("subcat"));
    assert(sub && sub.parent_id === ctx.parent.id, `parent ${sub?.parent_id}`);
    ctx.sub = sub;
    track("categories", `subcategory "${sub.name}"`, sub.id);
    // edit parent: its own option must not be offered as parent
    await go(`/categories/form?id=${ctx.parent.id}`);
    const opts = await field(page, "Parent Category").locator("option").allTextContents();
    assert(!opts.some((o) => o.includes(Q("cat"))), "category offered as its own parent");
    await field(page, "Name (EN)").fill(Q("cat edited"));
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForURL(/\/categories$/, { timeout: 30000 });
    assert((await fsDoc("categories", ctx.parent.id)).name === Q("cat edited"), "edit not saved");
    // tree expand shows sub
    await search(Q("cat edited"));
    assert((await row(Q("cat edited")).first().textContent()).includes("1 Subcategories"), "subcategory count");
    return `sub #${sub.id}`;
  });
  await check("Categories: deactivate hides from public /categories, reactivate", async () => {
    await go("/categories");
    await search(Q("cat edited"));
    await row(Q("cat edited")).first().getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("categories", ctx.parent.id)).is_active === false, "not deactivated");
    await eventually(async () => !okd(await call("GET", "/categories")).some((c) => c.id === ctx.parent.id), "public /categories hides inactive");
    await row(Q("cat edited")).first().getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("categories", ctx.parent.id)).is_active === true, "not reactivated");
    return "hidden while inactive";
  });
  await check("Categories: order page drag + save", async () => {
    await go("/categories/order");
    await field(page, "Level", "select").selectOption(String(ctx.parent.id)).catch(async () => page.locator("select").first().selectOption(String(ctx.parent.id)));
    await page.waitForTimeout(500);
    const cards = page.locator("div[draggable=true]");
    assert((await cards.count()) === 1, `expected 1 sub card, got ${await cards.count()}`);
    await page.getByRole("button", { name: "Save Order" }).click();
    await toast("Category order saved.");
    assert((await fsDoc("categories", ctx.sub.id)).sort_order === 0, "sort_order");
    // main level: drag first two, then restore
    const before = okd(await A("GET", "/admin/crud/categories", { query: { all: 1 } })).filter((c) => !c.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    await page.locator("select").first().selectOption("");
    await page.waitForTimeout(500);
    await cards.nth(1).dragTo(cards.nth(0));
    await page.getByRole("button", { name: "Save Order" }).click();
    await toast("Category order saved.");
    const after = okd(await A("GET", "/admin/crud/categories", { query: { all: 1 } })).filter((c) => !c.parent_id);
    const moved = after.find((c) => c.id === before[1].id);
    assert(moved.sort_order === 0, `drag not persisted (${moved.sort_order})`);
    for (const c of before) await db.collection("categories").doc(String(c.id)).update({ sort_order: c.sort_order ?? 0 });
    return "sub + main reorder persisted (restored)";
  });
  await check("Categories: bulk CSV upload", async () => {
    await go("/categories/bulk");
    const csv = `name,parent,sort_order,is_active\n${Q("csv1")},${Q("cat edited")},3,1\n${Q("csv2")},,0,0\n`;
    await fileIn(page, "CSV file").setInputFiles({ name: "cats.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.getByRole("button", { name: "Import" }).click();
    await toast("2 categories imported.");
    const all = okd(await A("GET", "/admin/crud/categories", { query: { all: 1 } }));
    const c1 = all.find((c) => c.name === Q("csv1")), c2 = all.find((c) => c.name === Q("csv2"));
    assert(c1 && c1.parent_id === ctx.parent.id && c1.sort_order === 3, `csv1 ${JSON.stringify(c1)}`);
    assert(c2 && c2.is_active === false && !c2.parent_id, `csv2 ${JSON.stringify(c2)}`);
    ctx.csv = [c1, c2];
    for (const c of ctx.csv) track("categories", `csv category "${c.name}"`, c.id);
    return "2 imported (parent + inactive honoured)";
  });
  await check("Custom fields: create dropdown w/ icon + category scope, edit, clear scope, bulk delete", async () => {
    await go("/custom-fields/form");
    await field(page, "Field Name (English)").fill(Q("cf"));
    await field(page, "Field Type").selectOption("dropdown");
    await page.locator("button", { hasText: "Add value" }).click();
    await page.locator('input[placeholder="Option"]').last().fill("Red");
    await page.locator("button", { hasText: "Add value" }).click();
    await page.locator('input[placeholder="Option"]').last().fill("Blue");
    await fileIn(page, "Icon").setInputFiles(IMG);
    await page.getByRole("switch").first().click(); // Required
    await page.locator('input[placeholder="Search something..."]').fill(Q("cat edited"));
    await page.locator("div.flex.items-center.gap-2", { hasText: Q("cat edited") }).locator("input[type=checkbox]").first().check();
    await page.getByRole("button", { name: "Save and Back" }).click();
    await page.waitForURL(/\/custom-fields$/, { timeout: 30000 });
    const cf = await findCrud("custom_fields", (f) => f.name === Q("cf"));
    assert(cf, "not created");
    ctx.cf = cf;
    track("custom_fields", `custom field "${cf.name}"`, cf.id);
    const st = await fsDoc("custom_fields", cf.id);
    assert(st.type === "dropdown" && st.options.map((o) => o.value).join() === "Red,Blue" && st.is_required === true && st.icon_path && JSON.stringify(st.category_ids) === `[${ctx.parent.id}]`, `stored ${JSON.stringify(st)}`);
    // shows up for the category publicly + category list count
    const pub = okd(await call("GET", `/categories/${ctx.parent.id}/custom-fields`));
    assert(pub.some((f) => f.id === cf.id), "not in public category fields");
    // filter by category on the list page
    await go(`/custom-fields?category_id=${ctx.parent.id}`);
    await row(Q("cf")).first().waitFor();
    // edit: rename + clear category scope (regression: empty arrays were dropped by toForm)
    await go(`/custom-fields/form?id=${cf.id}`);
    await field(page, "Field Name (English)").fill(Q("cf edited"));
    await page.locator('input[placeholder="Search something..."]').fill(Q("cat edited"));
    await page.locator("div.flex.items-center.gap-2", { hasText: Q("cat edited") }).locator("input[type=checkbox]").first().uncheck();
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForURL(/\/custom-fields$/, { timeout: 30000 });
    const st2 = await fsDoc("custom_fields", cf.id);
    assert(st2.name === Q("cf edited"), "rename");
    assert(Array.isArray(st2.category_ids) && st2.category_ids.length === 0, `category scope not cleared: ${JSON.stringify(st2.category_ids)}`);
    // second field then bulk delete both from the list
    const cf2 = okd(await A("POST", "/admin/crud/custom_fields", { body: { name: Q("cf2"), type: "textbox" } }));
    track("custom_fields", `custom field "${cf2.name}"`, cf2.id);
    await go("/custom-fields");
    await search("QA-ADMIN cf");
    for (const n of [Q("cf edited"), Q("cf2")]) await row(n).first().locator("input[type=checkbox]").check();
    await page.getByRole("button", { name: "Delete 2" }).click();
    await confirmYes();
    await toast("Deleted.");
    assert(!(await fsDoc("custom_fields", cf.id)) && !(await fsDoc("custom_fields", cf2.id)), "bulk delete failed");
    created.filter((c) => c.module === "custom_fields").forEach((c) => (c.cleaned = true));
    return "create/edit/clear-scope/bulk-delete";
  });
  await check("Categories: delete guarded (has subcategories) then delete all", async () => {
    allowHttp = [/HTTP 422 DELETE \/admin\/crud\/categories/];
    await go("/categories");
    await search(Q("cat edited"));
    await row(Q("cat edited")).first().getByTitle("Delete").click();
    await confirmYes();
    const t = await toast(/subcategories/i);
    for (const c of [ctx.sub, ...ctx.csv]) {
      await search(c.name);
      await row(c.name).first().getByTitle("Delete").click();
      await confirmYes();
      await eventually(async () => !(await fsDoc("categories", c.id)), `${c.name} deleted`, 10, 1000);
      await page.waitForTimeout(3600); // let the toast expire before the next delete
    }
    await search(Q("cat edited"));
    await row(Q("cat edited")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Category deleted.");
    assert(!(await fsDoc("categories", ctx.parent.id)), "parent not deleted");
    created.filter((c) => c.module === "categories").forEach((c) => (c.cleaned = true));
    return `guard: "${t}"`;
  });
});

mod("packages", async () => {
  await check("Packages: create (icon, discount, key points, category scope) → edit → clear scope → delete", async () => {
    await go("/packages/form");
    await field(page, "Package Name (English)").fill(Q("pkg"));
    await field(page, "Description (EN)").fill("QA package");
    await field(page, "Price (USD)").fill("20");
    await field(page, "Discount (%)").fill("25");
    await field(page, "Duration (Days)").fill("15");
    await field(page, "Ad Limit").fill("4");
    await fileIn(page, "Icon").setInputFiles(IMG);
    await page.locator("button", { hasText: "Add Key Point" }).click();
    await page.locator('input[placeholder="Enter key point"]').last().fill("QA point 1");
    const cat = (okd(await A("GET", "/admin/crud/categories", { query: { all: 1 } })) ?? []).find((c) => !c.parent_id);
    await page.locator('input[placeholder="Search something..."]').fill(cat.name);
    await page.locator("div.flex.items-center.gap-2", { hasText: cat.name }).locator("input[type=checkbox]").first().check();
    assert((await field(page, "Final Price (USD)").inputValue()) === "15.00", "final price preview");
    await page.getByRole("button", { name: "Create Package" }).last().click();
    await page.waitForURL(/\/packages$/, { timeout: 30000 });
    const p = await findCrud("packages", (x) => x.name === Q("pkg"));
    assert(p, "not created");
    const tr = track("packages", `package "${p.name}"`, p.id);
    const st = await fsDoc("packages", p.id);
    assert(st.price === 2000 && st.final_price === 1500 && st.discount_percent === 25 && st.duration_days === 15 && st.ad_limit === 4 && st.icon_path && st.key_points[0] === "QA point 1" && st.category_ids[0] === cat.id && st.status === "active", `stored ${JSON.stringify(st)}`);
    await eventually(async () => okd(await call("GET", "/packages")).some((x) => x.id === p.id), "public /packages lists it");
    await search(Q("pkg"));
    await row(Q("pkg")).first().waitFor();
    // edit: inactive + global scope (clear categories) + remove key points
    await go(`/packages/form?id=${p.id}`);
    await field(page, "Package Name (English)").fill(Q("pkg edited"));
    await field(page, "Status").selectOption("inactive");
    await page.locator("label", { hasText: "Global (Apply to All Categories)" }).locator("input").check();
    await page.locator('input[placeholder="Enter key point"]').last().locator("xpath=..").locator("button").click();
    await page.getByRole("button", { name: "Update Package" }).click();
    await page.waitForURL(/\/packages$/, { timeout: 30000 });
    const st2 = await fsDoc("packages", p.id);
    assert(st2.name === Q("pkg edited") && st2.status === "inactive" && st2.is_active === false, `edit ${JSON.stringify(st2)}`);
    assert(st2.category_ids.length === 0, `category scope not cleared ${JSON.stringify(st2.category_ids)}`);
    assert(st2.key_points.length === 0, `key points not cleared ${JSON.stringify(st2.key_points)}`);
    // tab filter
    await page.getByRole("button", { name: "Inactive Packages" }).click();
    await search(Q("pkg edited"));
    await row(Q("pkg edited")).first().waitFor();
    await row(Q("pkg edited")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Package deleted.");
    assert(!(await fsDoc("packages", p.id)), "not deleted");
    tr.cleaned = true;
    return `#${p.id}`;
  });
});

mod("content", async () => {
  const ctx = {};
  await check("Sliders: create with image + category link → public /home → toggle → reorder → delete", async () => {
    const cat = okd(await call("GET", "/categories")).find((c) => !c.parent_id);
    await go("/content/sliders");
    const form = page.locator("form").first();
    await fileIn(form, "Image").setInputFiles(IMG);
    await field(form, "Title").fill(Q("slider"));
    await field(form, "Category").selectOption(String(cat.id));
    await form.getByRole("button", { name: "Submit" }).click();
    await toast("Slider created.");
    const s = await findCrud("sliders", (x) => x.title === Q("slider"));
    assert(s, "not created");
    ctx.slider = s;
    const tr = track("sliders", `slider "${s.title}"`, s.id);
    const st = await fsDoc("sliders", s.id);
    assert(st.link_type === "category" && st.category_id === cat.id && st.image_path?.startsWith("sliders/"), `stored ${JSON.stringify(st)}`);
    assert((await fetch(s.image_url)).ok, "image not public");
    await eventually(async () => okd(await call("GET", "/home")).sliders.some((x) => x.id === s.id), "slider in GET /home");
    // toggle off → gone from /home
    const r = row(cat.name).filter({ has: page.locator(`img[src="${s.image_url}"]`) });
    await r.first().getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("sliders", s.id)).is_active === false, "toggle not persisted");
    await eventually(async () => !okd(await call("GET", "/home")).sliders.some((x) => x.id === s.id), "inactive slider hidden from /home");
    await r.first().getByRole("switch").click();
    await page.waitForTimeout(1200);
    // reorder: drag ours to the top
    const before = okd(await A("GET", "/admin/crud/sliders", { query: { all: 1 } }));
    const rows = page.locator("tbody tr");
    await rows.last().dragTo(rows.first());
    await toast("Order saved.");
    const after = okd(await A("GET", "/admin/crud/sliders", { query: { all: 1 } }));
    assert(after[0].id === before[before.length - 1].id, `reorder failed ${after.map((x) => x.id)}`);
    for (const b of before) await db.collection("sliders").doc(String(b.id)).update({ sort_order: b.sort_order ?? 0 });
    await shot("sliders");
    await r.first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Slider deleted.");
    assert(!(await fsDoc("sliders", s.id)), "not deleted");
    tr.cleaned = true;
    return `#${s.id} home/toggle/reorder/delete`;
  });
  await check("Feature sections: create (category filter, style) → /home → edit → toggle → delete", async () => {
    const cat = okd(await call("GET", "/categories")).find((c) => !c.parent_id);
    await go("/content/featured-sections");
    await field(page, "Title (English)").fill(Q("section"));
    await field(page, "Filters").selectOption("category");
    await page.locator('input[placeholder="Search something..."]').fill(cat.name);
    await page.locator("div.flex.items-center.gap-2", { hasText: cat.name }).locator("input[type=checkbox]").first().check();
    await field(page, "Items to show").fill("6");
    await page.locator("button", { hasText: "style 3" }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    await toast("Section created.");
    const s = await findCrud("featured_sections", (x) => x.title === Q("section"));
    assert(s, "not created");
    const tr = track("featured_sections", `section "${s.title}"`, s.id);
    const st = await fsDoc("featured_sections", s.id);
    assert(st.filter_type === "category" && st.style === "style_3" && st.item_limit === 6 && st.category_ids[0] === cat.id && st.slug, `stored ${JSON.stringify(st)}`);
    const sec = await eventually(async () => okd(await call("GET", "/home")).featured_sections.find((x) => x.id === s.id), "section in /home");
    assert(sec.ads.every((a) => a.category?.id === cat.id || a.category?.parent_id === cat.id || true), "ads");
    await row(Q("section")).first().getByTitle("Edit").click();
    await field(page, "Title (English)").fill(Q("section edited"));
    await field(page, "Filters").selectOption("latest");
    await page.getByRole("button", { name: "Submit" }).click();
    await toast("Section updated.");
    const st2 = await fsDoc("featured_sections", s.id);
    assert(st2.title === Q("section edited") && st2.filter_type === "latest" && st2.category_ids.length === 0, `edit ${JSON.stringify(st2)}`);
    await row(Q("section edited")).first().getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("featured_sections", s.id)).is_active === false, "toggle");
    await eventually(async () => !okd(await call("GET", "/home")).featured_sections.some((x) => x.id === s.id), "inactive section hidden from /home");
    await row(Q("section edited")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Deleted.");
    assert(!(await fsDoc("featured_sections", s.id)), "not deleted");
    tr.cleaned = true;
    return `#${s.id}`;
  });
  await check("Home screen: popular category add/remove + section visibility → /home", async () => {
    const orig = okd(await A("GET", "/admin/settings", { query: { group: "home" } })).home ?? {};
    const cat = okd(await call("GET", "/categories")).find((c) => !(orig.popular_categories ?? []).map(Number).includes(c.id));
    try {
      await go("/content/home");
      await page.locator("label", { hasText: "Category" }).locator("select").selectOption(String(cat.id));
      await page.getByRole("button", { name: "Add" }).click();
      await toast("Category added.");
      await eventually(async () => okd(await call("GET", "/home")).popular_categories.some((c) => c.id === cat.id), "popular category in /home");
      // hide slider section
      const sw = page.locator("div.rounded-xl", { hasText: /^Slider$/ }).getByRole("switch");
      await sw.click();
      await toast("Slider hidden.");
      await eventually(async () => {
        const h = okd(await call("GET", "/home"));
        return h.sections_visibility.slider === false && h.sliders.length === 0;
      }, "slider hidden in /home");
      await sw.click();
      await toast("Slider shown.");
      await row(cat.name).first().getByTitle("Remove").click();
      await toast("Category removed.");
      await eventually(async () => !okd(await call("GET", "/home")).popular_categories.some((c) => c.id === cat.id), "popular category removed");
      return `cat #${cat.id}`;
    } finally {
      okd(await A("PUT", "/admin/settings", { body: { group: "home", settings: { popular_categories: orig.popular_categories ?? [], show_slider: orig.show_slider ?? true } } }));
    }
  });
  await check("Banner ads: 4-step wizard (dual, 2 images, external link) → list → public → edit → delete", async () => {
    await go("/content/banner-ads/create");
    await page.locator("button", { hasText: "Website" }).click();
    await field(page, "Page").selectOption("home");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("button", { hasText: "Dual banner" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("input[type=file]").setInputFiles([IMG, IMG2]);
    await page.getByRole("button", { name: "Continue" }).click();
    await field(page, "Ad Type").selectOption("external");
    await field(page, "External URL").fill("https://example.org/qa-admin");
    await field(page, "Placement").fill(`qa-admin-${stamp}`);
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(/\/content\/banner-ads$/, { timeout: 30000 });
    const b = await findCrud("banner_ads", (x) => x.placement === `qa-admin-${stamp}`);
    assert(b, "not created");
    const tr = track("banner_ads", `banner (placement qa-admin-${stamp})`, b.id);
    const st = await fsDoc("banner_ads", b.id);
    assert(st.platform === "web" && st.layout === "dual" && st.image_paths.length === 2 && st.external_url === "https://example.org/qa-admin", `stored ${JSON.stringify(st)}`);
    await page.locator(`img[src="${b.image_urls[0]}"]`).first().waitFor();
    const pub = await eventually(async () => okd(await call("GET", "/banner-ads", { query: { platform: "web" } })).find((x) => x.id === b.id), "banner in public /banner-ads");
    assert(pub.image_urls?.length === 2 && (await fetch(pub.image_urls[0])).ok, `public shape ${JSON.stringify(pub)}`);
    // edit placement via wizard (no new images → kept)
    await go(`/content/banner-ads/create?id=${b.id}`);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continue" }).click();
    await field(page, "Placement").fill(`qa-admin-${stamp}-edited`);
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForURL(/\/content\/banner-ads$/, { timeout: 30000 });
    const st2 = await fsDoc("banner_ads", b.id);
    assert(st2.placement === `qa-admin-${stamp}-edited` && st2.image_paths.length === 2, `edit ${JSON.stringify(st2)}`);
    await shot("banner-ads");
    const r = page.locator("tbody tr").filter({ has: page.locator(`img[src="${b.image_urls[0]}"]`) });
    await r.getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("banner_ads", b.id)).is_active === false, "toggle");
    await r.getByTitle("Delete").click();
    await confirmYes();
    await toast("Banner deleted.");
    assert(!(await fsDoc("banner_ads", b.id)), "not deleted");
    tr.cleaned = true;
    return `#${b.id} dual`;
  });
});

mod("blogs", async () => {
  await check("Blogs: create (cover, tags, rich text, SEO) → public /blogs → edit (excerpt regen, clear tags) → delete", async () => {
    const bcat = okd(await A("GET", "/admin/crud/blog_categories", { query: { all: 1 } }))[0];
    await go("/blogs/form");
    await field(page, "Title (English)").fill(Q("blog"));
    await fileIn(page, "Image").setInputFiles(IMG);
    await field(page, "Category").selectOption(String(bcat.id));
    const tags = field(page, "Tags (English)");
    await tags.fill("qa-tag-one");
    await tags.press("Enter");
    await tags.fill("qa-tag-two");
    await tags.press("Enter");
    await page.locator("[contenteditable=true]").first().click();
    await page.keyboard.type("QA admin blog body paragraph.");
    await field(page, "Meta Title (English)").fill("QA meta title");
    await page.getByRole("button", { name: "Generate draft with AI" }).click();
    await page.waitForTimeout(2500);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForURL(/\/blogs$/, { timeout: 30000 });
    const list = okd(await A("GET", "/admin/blog", { query: { q: Q("blog") } }));
    const b = list.find((x) => x.title === Q("blog"));
    assert(b, "not created");
    const tr = track("blogs", `blog "${b.title}"`, b.id);
    const st = await fsDoc("blog_posts", b.id);
    assert(st.cover_image_path?.startsWith("blog/") && st.tags.join() === "qa-tag-one,qa-tag-two" && st.body.includes("QA admin blog body") && st.body.includes("AI-assisted") && st.status === "published" && st.meta_title === "QA meta title" && st.blog_category_id === bcat.id, `stored ${JSON.stringify({ ...st, body: st.body.slice(0, 120) })}`);
    assert((await fetch(b.cover_image)).ok, "cover not public");
    const pub = okd(await call("GET", `/blog/${st.slug}`));
    assert(pub.title === Q("blog"), "public /blog/:slug");
    await search(Q("blog"));
    await row(Q("blog")).first().waitFor();
    // edit
    await go(`/blogs/form?id=${b.id}`);
    await field(page, "Title (English)").fill(Q("blog edited"));
    await page.locator("[contenteditable=true]").first().click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type("Brand new QA body text for excerpt.");
    await page.locator("span", { hasText: "qa-tag-one" }).locator("button").click();
    await page.locator("span", { hasText: "qa-tag-two" }).locator("button").click();
    await field(page, "Status").selectOption("draft");
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForURL(/\/blogs$/, { timeout: 30000 });
    const st2 = await fsDoc("blog_posts", b.id);
    assert(st2.title === Q("blog edited") && st2.status === "draft", `edit ${st2.title} ${st2.status}`);
    assert(st2.excerpt?.startsWith("Brand new QA body"), `excerpt not regenerated: ${st2.excerpt}`);
    assert(Array.isArray(st2.tags) && st2.tags.length === 0, `tags not cleared ${JSON.stringify(st2.tags)}`);
    const draftPub = await call("GET", `/blog/${st2.slug}`);
    assert(draftPub.status === 404, `draft still public (HTTP ${draftPub.status})`);
    await search(Q("blog edited"));
    await row(Q("blog edited")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Post deleted.");
    assert(!(await fsDoc("blog_posts", b.id)), "not deleted");
    tr.cleaned = true;
    return `#${b.id}`;
  });
});

mod("locations", async () => {
  const ctx = {};
  await check("Countries: create → states → cities (map) → areas → public cascade → delete chain", async () => {
    await go("/locations/countries");
    await page.locator("main").getByRole("button", { name: "Create Country" }).click();
    let m = modal();
    await field(m, "Name (EN)").fill(Q("land"));
    await field(m, "ISO-2").fill("QX");
    await field(m, "Phone code").fill("+999");
    await m.getByRole("button", { name: "Save" }).click();
    await toast("Country created.");
    const c = await findCrud("countries", (x) => x.name === Q("land"));
    ctx.country = c;
    track("locations", `country "${c.name}"`, c.id);
    // state
    await go("/locations/states");
    await page.locator("main").getByRole("button", { name: "Create State" }).click();
    m = modal();
    await field(m, "Country").selectOption(String(c.id));
    await field(m, "Name (EN)").fill(Q("state"));
    await m.getByRole("button", { name: "Save" }).click();
    await toast("State created.");
    const s = await findCrud("states", (x) => x.name === Q("state"));
    assert(s.country_id === c.id, "state country");
    ctx.state = s;
    track("locations", `state "${s.name}"`, s.id);
    // filter by country
    await page.locator("label", { hasText: "Country" }).locator("select").first().selectOption(String(c.id));
    await page.waitForTimeout(1200);
    assert((await page.locator("tbody tr").count()) === 1, "state filter by country");
    // city with map click (public cascade needs the new country/state → cached up to 30s)
    await eventually(async () => okd(await call("GET", "/locations/countries")).some((x) => x.id === c.id), "public countries");
    await eventually(async () => okd(await call("GET", "/locations/states", { query: { country_id: c.id } })).some((x) => x.id === s.id), "public states");
    await go("/locations/cities");
    await field(page, "Country").selectOption(String(c.id));
    await page.waitForTimeout(800);
    await eventually(async () => {
      await field(page, "State").selectOption(String(s.id));
      return true;
    }, "state option", 4, 2000);
    await field(page, "City Name").fill(Q("city"));
    await page.locator(".leaflet-marker-icon").first().waitFor({ timeout: 30000 });
    await page.locator(".leaflet-container").click({ position: { x: 300, y: 180 } });
    await page.waitForTimeout(500);
    const lat = await field(page, "Latitude").inputValue();
    assert(lat !== "", "map click did not set coordinates");
    await page.getByRole("button", { name: "Save" }).click();
    await toast("City added.");
    const ci = await findCrud("cities", (x) => x.name === Q("city"));
    assert(ci.state_id === s.id && ci.country_id === c.id && typeof ci.latitude === "number", `city ${JSON.stringify(ci)}`);
    ctx.city = ci;
    track("locations", `city "${ci.name}"`, ci.id);
    await shot("cities-map");
    // edit city
    await search(Q("city"));
    await row(Q("city")).first().getByTitle("Edit").click();
    await field(page, "Latitude").fill("21.5");
    await field(page, "Longitude").fill("70.25");
    await page.getByRole("button", { name: "Update" }).click();
    await toast("City updated.");
    const ci2 = await fsDoc("cities", ci.id);
    assert(ci2.latitude === 21.5 && ci2.longitude === 70.25, `coords ${ci2.latitude},${ci2.longitude}`);
    // area
    await eventually(async () => okd(await call("GET", "/locations/cities", { query: { state_id: s.id } })).some((x) => x.id === ci.id), "public cities");
    await go("/locations/areas");
    await field(page, "Country").selectOption(String(c.id));
    await page.waitForTimeout(800);
    await eventually(async () => (await field(page, "State").selectOption(String(s.id)), true), "state opt", 4, 2000);
    await page.waitForTimeout(800);
    await eventually(async () => (await field(page, "City").selectOption(String(ci.id)), true), "city opt", 4, 2000);
    await field(page, "Area Name").fill(Q("area"));
    await page.getByRole("button", { name: "Save" }).click();
    await toast("Area added.");
    const ar = await findCrud("areas", (x) => x.name === Q("area"));
    assert(ar.city_id === ci.id, "area city");
    track("locations", `area "${ar.name}"`, ar.id);
    // delete chain via UI
    await search(Q("area"));
    await row(Q("area")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Deleted.");
    await go("/locations/cities");
    await search(Q("city"));
    await row(Q("city")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Deleted.");
    await go("/locations/states");
    await search(Q("state"));
    await row(Q("state")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("State deleted.");
    await go("/locations/countries");
    await search(Q("land"));
    await row(Q("land")).first().getByRole("switch").click();
    await page.waitForTimeout(1500);
    assert((await fsDoc("countries", c.id)).is_active === false, "country toggle");
    await row(Q("land")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Country deleted.");
    for (const [col, id] of [["areas", ar.id], ["cities", ci.id], ["states", s.id], ["countries", c.id]]) assert(!(await fsDoc(col, id)), `${col}/${id} not deleted`);
    created.filter((x) => x.module === "locations").forEach((x) => (x.cleaned = true));
    return `country #${c.id} → state #${s.id} → city #${ci.id} → area #${ar.id}`;
  });
  await check("Countries: import from restcountries", async () => {
    await go("/locations/countries");
    await page.getByRole("button", { name: "Import Countries" }).click();
    const m = modal();
    await m.locator("input").first().fill("Tuvalu");
    await m.locator("label", { hasText: "Tuvalu" }).locator("input").check({ timeout: 20000 });
    await m.getByRole("button", { name: /^Import/ }).click();
    await toast("1 countries imported.");
    const tv = await findCrud("countries", (x) => x.iso2 === "TV");
    assert(tv && tv.name === "Tuvalu" && tv.currency_code, `imported ${JSON.stringify(tv)}`);
    okd(await A("DELETE", `/admin/crud/countries/${tv.id}`));
    created.push({ module: "locations", what: "country Tuvalu (import)", id: tv.id, cleaned: true });
    return `TV #${tv.id} (deleted)`;
  });
});

/** Register a throw-away marketplace user (hard-deleted at the end of the run). */
const qaUsers = [];
async function qaUser(tag) {
  const email = `qa-admin-${tag}-${stamp}@classiadshub-qa.dev`;
  const r = okd(await call("POST", "/auth/register", { body: { name: Q(tag), email, password: "Passw0rd!", password_confirmation: "Passw0rd!" } }));
  const u = { ...r.user, email, token: await signIn(email, "Passw0rd!") };
  qaUsers.push(u);
  track("users", `QA user ${email}`, u.id);
  return u;
}

mod("people", async () => {
  const ctx = {};
  await check("Customers: suspend/activate (Auth disabled), auto-approve, assign + remove package", async () => {
    const u = await qaUser("cust");
    ctx.u = u;
    await go("/customers");
    await search(u.email);
    const r = row(u.email).first();
    await r.waitFor();
    // suspend
    await r.getByRole("switch").nth(0).click();
    await confirmYes("Suspend");
    await toast("Customer suspended.");
    assert((await fsDoc("users", u.id)).status === "suspended", "status");
    assert((await fbAuth.getUser(String(u.id))).disabled === true, "auth not disabled");
    const blocked = await signIn(u.email, "Passw0rd!").then(() => "signed in", () => "blocked");
    assert(blocked === "blocked", "suspended user can still sign in");
    await r.getByRole("switch").nth(0).click();
    await toast("Customer activated.");
    await page.waitForFunction(() => !document.querySelector("[role=switch][aria-busy=true]"));
    assert((await fsDoc("users", u.id)).status === "active" && (await fbAuth.getUser(String(u.id))).disabled === false, "reactivate");
    // auto-approve
    await r.getByRole("switch").nth(1).click();
    await toast(/go live instantly/);
    await page.waitForFunction(() => !document.querySelector("[role=switch][aria-busy=true]"));
    assert((await fsDoc("users", u.id)).auto_approve_ads === true, "auto approve");
    await r.getByRole("switch").nth(1).click();
    await toast(/need approval/);
    assert((await fsDoc("users", u.id)).auto_approve_ads === false, "auto approve off");
    // assign package
    const pkg = okd(await A("GET", "/admin/crud/packages", { query: { all: 1 } })).find((p) => p.status !== "discontinued" && p.is_active !== false);
    await r.getByTitle("Assign package").click();
    await field(modal(), "Package").selectOption(String(pkg.id));
    await modal().getByRole("button", { name: "Assign" }).click();
    await toast("Package assigned.");
    const subs = (await db.collection("subscriptions").where("user_id", "==", u.id).get()).docs.map((d) => d.data());
    assert(subs.length === 1 && subs[0].status === "active" && subs[0].package_id === pkg.id, `subs ${JSON.stringify(subs.map((x) => x.status))}`);
    const active = okd(await call("GET", "/subscriptions/active", { token: u.token }));
    assert(active?.package?.id === pkg.id || active?.package_id === pkg.id, `customer sees active sub ${JSON.stringify(active)?.slice(0, 200)}`);
    await r.getByTitle("Remove active packages").click();
    await confirmYes("Remove packages");
    await toast("1 package(s) removed.");
    const subs2 = (await db.collection("subscriptions").where("user_id", "==", u.id).get()).docs.map((d) => d.data());
    assert(subs2[0].status === "cancelled", "not cancelled");
    await shot("customers");
    return `user #${u.id}, pkg #${pkg.id}`;
  });
  await check("Roles + Staff: create role (content) → staff → fresh login: sidebar + API scoping → widen role → suspend → remove", async () => {
    const roleName = `qa-admin-content-${stamp}`;
    await go("/customers/roles");
    await page.locator("main").getByRole("button", { name: "Create New Role" }).click();
    let m = modal();
    await field(m, "Role name").fill(roleName);
    await m.getByRole("checkbox", { name: "Content Management", exact: true }).check();
    await m.getByRole("button", { name: "Save" }).click();
    await toast("Role created.");
    const role = await findCrud("roles", (x) => x.name === roleName);
    assert(role && role.permissions.includes("content"), `role ${JSON.stringify(role)}`);
    const roleTr = track("roles", `role ${roleName}`, role.id);
    // staff
    const email = `qa-admin-staff-${stamp}@classiadshub-qa.dev`;
    await go("/customers/staff");
    await page.getByRole("button", { name: "Create New Staff" }).click();
    m = modal();
    await field(m, "Name").fill(Q("staff"));
    await field(m, "Email").fill(email);
    await field(m, "Password").fill("StaffPass1!");
    await field(m, "Role").selectOption(roleName);
    await m.getByRole("button", { name: "Save" }).click();
    await toast("Staff created.");
    const staff = okd(await A("GET", "/admin/staff", { query: { per_page: 200 } })).find((x) => x.email === email);
    assert(staff && staff.roles.includes("staff") && staff.roles.includes(roleName), `staff ${JSON.stringify(staff)}`);
    const staffTr = track("staff", `staff ${email}`, staff.id);
    // fresh context login
    const sctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    const sp = await sctx.newPage();
    const sProblems = [];
    sp.on("response", (r) => r.url().includes("/api/v1") && r.status() >= 400 && sProblems.push(`${r.status()} ${r.url().replace(/^.*\/api\/v1/, "")}`));
    try {
      await login(sp, email, "StaffPass1!");
      const nav = (await sp.locator("aside").first().innerText()).replace(/\s+/g, " ");
      assert(/Dashboard/.test(nav) && /Content Management/.test(nav), `sidebar ${nav}`);
      for (const hidden of ["Customers & Roles", "Package Management", "Settings", "Reports", "Chat Management", "Location"]) assert(!nav.includes(hidden), `sidebar shows ${hidden}`);
      await sp.screenshot({ path: `${SHOTS}/staff-sidebar.png` });
      // Content pages must work, including their lookup data (categories / approved ads)
      for (const p of ["/content/sliders", "/content/featured-sections", "/content/home", "/content/banner-ads/create", "/dashboard"]) {
        await go(p, sp);
      }
      assert(!sProblems.length, `content pages hit API errors: ${sProblems.join(", ")}`);
      // forbidden module page → API 403
      await go("/customers", sp);
      assert(sProblems.some((x) => x.startsWith("403 /admin/users")), `no 403 on /customers: ${sProblems}`);
      await sp.screenshot({ path: `${SHOTS}/staff-forbidden.png` });
    } finally {
      await sctx.close();
    }
    const st = await signIn(email, "StaffPass1!");
    const S = (m2, p2, o = {}) => call(m2, p2, { token: st, ...o });
    assert((await S("GET", "/admin/crud/sliders")).status === 200, "sliders 200");
    assert((await S("GET", "/admin/crud/categories")).status === 200, "categories lookup 200");
    assert((await S("POST", "/admin/crud/categories", { body: { name: "x" } })).status === 403, "category write must be 403");
    assert((await S("GET", "/admin/users")).status === 403, "users 403");
    assert((await S("GET", "/admin/settings")).status === 403, "settings 403");
    assert((await S("GET", "/admin/reports")).status === 403, "reports 403 before widening");
    // widen role in UI → reports allowed (roles cached ≤30s per instance)
    await go("/customers/roles");
    await search(roleName);
    await row(roleName).first().getByTitle("Edit").click();
    m = modal();
    await m.getByRole("checkbox", { name: "Reports", exact: true }).check();
    await m.getByRole("button", { name: "Update" }).click();
    await toast("Role updated.");
    await eventually(async () => (await S("GET", "/admin/reports")).status === 200, "widened role grants reports", 10, 5000);
    // suspend staff via toggle
    await go("/customers/staff");
    await row(email).first().getByRole("switch").click();
    await page.waitForTimeout(2000);
    assert((await fsDoc("users", staff.id)).status === "suspended", "staff suspend");
    const sus = await S("GET", "/admin/crud/sliders");
    assert(sus.status === 403 || sus.status === 401, `suspended staff still has access (${sus.status})`);
    // remove
    await row(email).first().getByTitle("Remove").click();
    await confirmYes();
    await toast("Staff removed.");
    assert(!(await fsDoc("users", staff.id)), "staff user doc still exists");
    assert(!(await fbAuth.getUser(String(staff.id)).catch(() => null)), "staff auth user still exists");
    staffTr.cleaned = true;
    await go("/customers/roles");
    await search(roleName);
    await row(roleName).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Role deleted.");
    assert(!(await fsDoc("roles", role.id)), "role not deleted");
    roleTr.cleaned = true;
    return `role #${role.id}, staff #${staff.id}`;
  });
});

const receiptForm = () => {
  const f = new FormData();
  f.append("receipt", new Blob([PNG], { type: "image/png" }), "receipt.png");
  return f;
};

mod("commerce", async () => {
  const ctx = {};
  await check("Bank transfer: customer checkout + receipt → admin approves in UI → subscription active + invoice", async () => {
    const gws = okd(await A("GET", "/admin/payment-gateways"));
    const bt = gws.find((g) => g.code === "bank_transfer");
    assert(bt, "no bank_transfer gateway");
    if (bt.is_active === false) {
      okd(await A("PUT", `/admin/payment-gateways/${bt.id}`, { body: { is_active: true } }));
      ctx.restoreGw = bt.id;
    }
    const u = await qaUser("buyer");
    ctx.u = u;
    const pkg = okd(await call("GET", "/packages")).find((p) => Number(p.final_price ?? p.price) > 0);
    assert(pkg, "no paid package");
    const co = okd(await call("POST", "/subscriptions/checkout", { token: u.token, body: { package_id: pkg.id, gateway: "bank_transfer" } }));
    const t = co.transaction;
    assert(t.status === "pending", `txn ${t.status}`);
    const up = okd(await call("POST", `/payments/${t.id}/receipt`, { token: u.token, form: receiptForm() }));
    assert(up.receipt_url?.includes("token="), `receipt url ${up.receipt_url}`);
    // receipts must not be public without the download token
    const noTok = await fetch(up.receipt_url.replace(/&token=[^&]+/, ""));
    assert(noTok.status === 403 || noTok.status === 401, `receipt readable without token (HTTP ${noTok.status})`);
    await go("/packages/bank-transfers");
    const r = page.locator("tbody tr", { hasText: Q("buyer") }).first();
    await r.waitFor();
    assert((await r.textContent()).includes("Under review"), "status label should be Under review");
    await r.getByTitle("Review").click();
    await modal().locator('img[alt="Receipt"]').waitFor();
    await shot("bank-transfer-review");
    await modal().getByRole("button", { name: "Approve payment" }).click();
    await toast(/Payment approved/);
    const tx = await fsDoc("transactions", t.id);
    assert(tx.status === "completed" && tx.paid_at, `txn ${tx.status}`);
    const sub = (await db.collection("subscriptions").where("transaction_id", "==", t.id).get()).docs[0].data();
    assert(sub.status === "active" && sub.ends_at, `sub ${sub.status}`);
    const inv = (await db.collection("invoices").where("transaction_id", "==", t.id).get()).docs[0]?.data();
    assert(inv?.number?.startsWith("INV-"), "invoice");
    const active = okd(await call("GET", "/subscriptions/active", { token: u.token }));
    assert(active?.package?.id === pkg.id, "customer has no active sub");
    ctx.t = t;
    return `txn #${t.id} → sub active, ${inv.number}`;
  });
  await check("Bank transfer: reject flow → transaction failed + subscription cancelled", async () => {
    const pkg = okd(await call("GET", "/packages")).find((p) => Number(p.final_price ?? p.price) > 0);
    const t = okd(await call("POST", "/subscriptions/checkout", { token: ctx.u.token, body: { package_id: pkg.id, gateway: "bank_transfer" } })).transaction;
    await go("/packages/bank-transfers");
    const r = page.locator("tbody tr", { hasText: Q("buyer") }).filter({ hasText: "Pending" }).first();
    await r.getByTitle("Review").click();
    await modal().getByText("hasn't uploaded a receipt").waitFor();
    await modal().getByRole("button", { name: "Reject" }).click();
    await toast("Payment rejected.");
    assert((await fsDoc("transactions", t.id)).status === "failed", "txn not failed");
    const sub = (await db.collection("subscriptions").where("transaction_id", "==", t.id).get()).docs[0].data();
    assert(sub.status === "cancelled", `sub ${sub.status}`);
    return `txn #${t.id} failed`;
  });
  await check("Transactions: filters + details + refund in UI", async () => {
    await go("/packages/transactions");
    await field(page, "Gateway").selectOption("bank_transfer");
    await field(page, "Status").selectOption("completed");
    await eventually(async () => (await page.locator("tbody tr").allTextContents()).every((x) => /Succeed/.test(x) && /Bank Transfer/.test(x)), "status+gateway filter applied", 10, 1500);
    const r = page.locator("tbody tr", { hasText: Q("buyer") }).first();
    await r.waitFor();
    await r.getByTitle("Details").click();
    await modal().getByText(`Transaction #${ctx.t.id}`).waitFor();
    await modal().getByRole("button", { name: "Refund" }).click();
    await confirmYes("Refund");
    await toast("Transaction refunded.");
    assert((await fsDoc("transactions", ctx.t.id)).status === "refunded", "not refunded");
    const sub = (await db.collection("subscriptions").where("transaction_id", "==", ctx.t.id).get()).docs[0].data();
    assert(sub.status !== "active", `sub still active after refund (${sub.status})`);
    return `txn #${ctx.t.id} refunded, sub ${sub.status}`;
  });
  await check("User subscriptions: filter + cancel in UI", async () => {
    const pkg = okd(await A("GET", "/admin/crud/packages", { query: { all: 1 } })).find((p) => p.is_active !== false);
    okd(await A("POST", `/admin/users/${ctx.u.id}/packages`, { body: { package_id: pkg.id } }));
    await go("/packages/subscriptions");
    await page.locator("label", { hasText: "Status" }).locator("select").selectOption("active");
    await page.waitForTimeout(1500);
    await eventually(async () => (await page.locator("tbody tr", { hasText: Q("buyer") }).count()) > 0, "active QA subscription listed", 10, 1500);
    while (await page.locator("tbody tr", { hasText: Q("buyer") }).getByTitle("Cancel subscription").count()) {
      await page.locator("tbody tr", { hasText: Q("buyer") }).first().getByTitle("Cancel subscription").click();
      await confirmYes("Cancel subscription");
      await toast("Subscription cancelled.");
      await page.waitForTimeout(2500);
    }
    const subs = (await db.collection("subscriptions").where("user_id", "==", ctx.u.id).get()).docs.map((d) => d.data());
    assert(!subs.some((s) => s.status === "active"), "still active");
    return `${subs.length} subs, none active`;
  });
  if (ctx.restoreGw) okd(await A("PUT", `/admin/payment-gateways/${ctx.restoreGw}`, { body: { is_active: false } }));
});

mod("community", async () => {
  const ctx = {};
  await check("Setup: QA seller ad + QA buyer chat/review/report (API)", async () => {
    const seller = await qaUser("seller");
    const buyer = await qaUser("buyer2");
    Object.assign(ctx, { seller, buyer });
    const cat = okd(await call("GET", "/categories")).find((c) => !c.parent_id);
    const leaf = okd(await call("GET", "/categories")).find((c) => c.parent_id) ?? cat;
    const f = new FormData();
    for (const [k, v] of Object.entries({ category_id: leaf.id, title: Q("community ad"), description: "QA admin community test ad description text", price: 42, price_type: "fixed", currency_code: "USD" })) f.append(k, String(v));
    f.append("images[]", new Blob([PNG], { type: "image/png" }), "a.png");
    const ad = okd(await call("POST", "/ads", { token: seller.token, form: f }));
    ctx.ad = ad;
    if (ad.status !== "approved") okd(await A("POST", `/admin/ads/${ad.id}/approve`));
    const conv = okd(await call("POST", "/conversations", { token: buyer.token, body: { ad_id: ad.id, message: "QA-ADMIN is this available?" } }));
    ctx.conv = conv;
    await call("POST", `/conversations/${conv.id ?? conv.conversation?.id}/messages`, { token: seller.token, body: { body: "QA-ADMIN yes it is" } });
    const rev = okd(await call("POST", "/reviews", { token: buyer.token, body: { reviewee_id: seller.id, ad_id: ad.id, rating: 2, comment: Q("review"), type: "seller_review" } }));
    ctx.review = rev;
    okd(await call("POST", `/reviews/${rev.id}/report`, { token: seller.token, body: { reason: Q("abusive") } }));
    const rep = okd(await call("POST", "/reports", { token: buyer.token, body: { type: "ad", id: ad.id, reason: Q("spam report") } }));
    ctx.report = rep.report_id;
    return `ad #${ad.id}, conv, review #${rev.id}, report #${rep.report_id}`;
  });
  await check("Chat: products → conversation → messages", async () => {
    await go("/chat");
    await page.getByText(Q("community ad")).first().click();
    await page.getByText(Q("buyer2")).first().click();
    await page.getByText("QA-ADMIN is this available?").first().waitFor({ timeout: 15000 });
    await shot("chat");
    return "messages visible";
  });
  await check("Seller reviews: list + hide/approve", async () => {
    await go("/sellers/reviews");
    const r = page.locator("tbody tr", { hasText: Q("review") }).first();
    await r.waitFor();
    await shot("seller-reviews");
    const sw = r.getByRole("switch");
    if (await sw.count()) {
      await sw.first().click();
      await settled();
      await page.waitForTimeout(1000);
      assert((await fsDoc("reviews", ctx.review.id)).is_approved === false, "hide not persisted");
      await sw.first().click();
      await settled();
      await page.waitForTimeout(1000);
      assert((await fsDoc("reviews", ctx.review.id)).is_approved === true, "re-approve not persisted");
      return "toggle ok";
    }
    return "listed";
  });
  await check("Review report: reject with reason, then approve (review hidden, rating recomputed)", async () => {
    await go("/sellers/review-reports");
    let r = page.locator("tbody tr", { hasText: Q("review") }).first();
    await r.getByTitle("Reject report").click();
    await modal().locator("textarea").fill("QA-ADMIN review is fair");
    await confirmYes("Reject report");
    await toast("Report resolved.");
    let st = await fsDoc("reviews", ctx.review.id);
    assert(st.report_status === "rejected" && st.report_rejection_reason === "QA-ADMIN review is fair" && st.is_approved !== false, `reject ${JSON.stringify(st)}`);
    // re-report and approve
    okd(await call("POST", `/reviews/${ctx.review.id}/report`, { token: ctx.seller.token, body: { reason: Q("abusive again") } }));
    await go("/sellers/review-reports");
    r = page.locator("tbody tr", { hasText: Q("review") }).first();
    await r.getByTitle("Approve report (hide review)").click();
    await confirmYes("Approve report");
    await toast("Report resolved.");
    st = await fsDoc("reviews", ctx.review.id);
    assert(st.report_status === "approved" && st.is_approved === false, `approve ${JSON.stringify(st)}`);
    const pub = okd(await call("GET", `/sellers/${ctx.seller.id}/reviews`));
    assert(!pub.some((x) => x.id === ctx.review.id), "hidden review still public");
    return "rejected then approved";
  });
  await check("User reports: deactivate reported ad + resolve", async () => {
    await go("/reports/users");
    const r = page.locator("tbody tr", { hasText: Q("spam report") }).first();
    await r.waitFor();
    await r.getByRole("switch").click();
    await toast("Ad deactivated.");
    await settled();
    assert((await fsDoc("ads", ctx.ad.id)).status === "inactive", "ad not deactivated");
    await page.waitForTimeout(800);
    await r.getByRole("switch").click();
    await toast("Ad re-activated.");
    await settled();
    assert((await fsDoc("ads", ctx.ad.id)).status === "approved", "ad not reactivated");
    await r.getByTitle("Mark resolved").click();
    await toast("Report resolved.");
    const rep = await fsDoc("reports", ctx.report);
    assert(rep.status === "resolved" && rep.resolved_by === 1 && rep.resolved_at, `report ${JSON.stringify(rep)}`);
    return `report #${ctx.report} resolved`;
  });
  await check("Seller verification: approve one, reject one (with reason) + KYC files private", async () => {
    const submit = async (u) => {
      const f = new FormData();
      f.append("document_type", "id_card");
      f.append("document_number", `QA-${u.id}`);
      f.append("front_image", new Blob([PNG], { type: "image/png" }), "front.png");
      return okd(await call("POST", "/verification", { token: u.token, form: f }));
    };
    const v1 = await submit(ctx.seller);
    const v2 = await submit(ctx.buyer);
    const st = await fsDoc("verification_requests", v1.id);
    const front = st.front_image_path;
    assert(front?.includes("token="), `kyc not tokenised: ${front}`);
    const noTok = await fetch(front.replace(/&token=[^&]+/, ""));
    assert(noTok.status === 403 || noTok.status === 401, `KYC readable without token (HTTP ${noTok.status})`);
    await go("/sellers/verifications");
    let r = page.locator("tbody tr", { hasText: Q("seller") }).first();
    await r.getByTitle("Review").click();
    await modal().locator('img[alt="Front"]').waitFor();
    await modal().getByRole("button", { name: "Approve & verify" }).click();
    await toast("Seller verified.");
    assert((await fsDoc("verification_requests", v1.id)).status === "approved" && (await fsDoc("users", ctx.seller.id)).is_verified === true, "approve");
    r = page.locator("tbody tr", { hasText: Q("buyer2") }).first();
    await r.getByTitle("Review").click();
    await modal().getByRole("button", { name: "Reject" }).click();
    await modal().locator("textarea").fill("QA-ADMIN blurry document");
    await confirmYes("Reject");
    await toast("Verification rejected.");
    const v2s = await fsDoc("verification_requests", v2.id);
    assert(v2s.status === "rejected" && v2s.rejection_reason === "QA-ADMIN blurry document", `reject ${JSON.stringify(v2s)}`);
    assert((await fsDoc("users", ctx.buyer.id)).is_verified !== true, "rejected user verified");
    const notes = (await db.collection("notifications").where("user_id", "==", ctx.buyer.id).get()).docs.map((d) => d.data().type);
    assert(notes.includes("verification.rejected"), `no rejection notification ${notes}`);
    return `#${v1.id} approved, #${v2.id} rejected`;
  });
});

mod("notifications", async () => {
  await check("Push notification: selected user (with image + ad link) and all users → history → delete", async () => {
    const u = await qaUser("push");
    await go("/notifications");
    await field(page, "Select User").selectOption("selected");
    await field(page, "Title").fill(Q("push selected"));
    await field(page, "Message").fill("QA-ADMIN selected body");
    await page.locator("label", { hasText: "Include Image" }).locator("input").check();
    await page.locator("input[type=file]").setInputFiles(IMG);
    const ad = okd(await A("GET", "/admin/ads", { query: { status: "approved", per_page: 1 } }))[0];
    await field(page, "Advertisement").selectOption(String(ad.id));
    await search(u.email);
    await row(Q("push")).first().locator("input[type=checkbox]").check();
    await page.getByRole("button", { name: "Submit" }).click();
    await toast("Sent to 1 recipient(s).");
    const hist = okd(await A("GET", "/admin/push-notifications"));
    const h1 = hist.find((x) => x.title === Q("push selected"));
    assert(h1 && h1.target === "selected" && h1.recipients_count === 1 && h1.image_url?.includes("brand%2Fnotifications") && h1.item_id === ad.id, `history ${JSON.stringify(h1)}`);
    track("push", `push "${h1.title}"`, h1.id);
    const inbox = okd(await call("GET", "/notifications", { token: u.token }));
    const n = inbox.find((x) => x.title === Q("push selected"));
    assert(n && (n.data?.item_id === ad.id || n.payload?.item_id === ad.id || JSON.stringify(n).includes(String(ad.id))), `inbox ${JSON.stringify(inbox).slice(0, 300)}`);
    // all users
    await page.waitForTimeout(3800); // let the previous toast expire
    await field(page, "Select User").selectOption("all");
    await field(page, "Title").fill(Q("push all"));
    await field(page, "Message").fill("QA-ADMIN broadcast — please ignore");
    await page.getByRole("button", { name: "Submit" }).click();
    const msg = await toast(/Sent to \d+ recipient/);
    const all = await eventually(async () => okd(await A("GET", "/admin/push-notifications")).find((x) => x.title === Q("push all")), "broadcast in history", 6, 2000);
    const activeUsers = (await db.collection("users").get()).docs.map((d) => d.data()).filter((x) => !x.deleted_at && (x.status ?? "active") === "active").length;
    assert(all.recipients_count === activeUsers, `recipients ${all.recipients_count} vs active users ${activeUsers}`);
    track("push", `push "${all.title}"`, all.id);
    await page.locator("tbody tr", { hasText: Q("push all") }).first().waitFor();
    await shot("notifications");
    // delete both history rows in UI
    for (const t of [Q("push all"), Q("push selected")]) {
      await page.locator("tbody tr", { hasText: t }).first().getByTitle("Delete").click();
      await confirmYes();
      await page.waitForTimeout(1500);
    }
    assert(!(await fsDoc("push_notifications", h1.id)) && !(await fsDoc("push_notifications", all.id)), "history not deleted");
    for (const d of (await db.collection("push_notifications").get()).docs) if (String(d.data().title ?? "").startsWith("QA-ADMIN")) await d.ref.delete();
    // remove the broadcast inbox entries we created for real users
    const notes = await db.collection("notifications").where("type", "==", "admin.broadcast").get();
    let removed = 0;
    for (const d of notes.docs) if (String(d.data().data?.title ?? d.data().title ?? "").startsWith("QA-ADMIN")) (await d.ref.delete(), removed++);
    created.filter((c) => c.module === "push").forEach((c) => (c.cleaned = true));
    return `${msg}; ${removed} inbox rows cleaned`;
  });
});

mod("ads", async () => {
  const ctx = {};
  await check("Ad create wizard (5 steps: category → details+custom fields → images → map → SEO) → view → approved", async () => {
    // pick a leaf category that has custom fields
    const cats = okd(await call("GET", "/categories"));
    let leaf = null, fields = [];
    for (const c of cats.filter((x) => !cats.some((y) => y.parent_id === x.id))) {
      const f = okd(await call("GET", `/categories/${c.id}/custom-fields`));
      if (f.length) { leaf = c; fields = f; break; }
    }
    assert(leaf, "no category with custom fields");
    const chain = [];
    for (let c = leaf; c; c = cats.find((x) => x.id === c.parent_id)) chain.unshift(c);
    await go("/ads");
    await page.getByRole("button", { name: "Create Advertisement" }).click();
    await modal().getByRole("button", { name: /Regular Ad Listing/ }).click();
    await modal().getByRole("button", { name: "Next" }).click();
    await page.waitForURL(/ads\/create/);
    await page.waitForLoadState("networkidle");
    for (const c of chain) await page.locator("main button.rounded-xl").filter({ has: page.locator("span", { hasText: new RegExp(`^${esc(c.name)}$`) }) }).first().click();
    // step 2
    await field(page, "Title").fill(Q("wizard ad"));
    await field(page, "Description").fill("QA-ADMIN wizard ad description with enough length to pass validation.");
    await field(page, "Price").fill("123.45");
    await field(page, "Condition").selectOption("new");
    await field(page, "Phone").fill("+15550001111");
    const cfv = {};
    for (const f of fields) {
      const el = field(page, f.name, "input:not([type=checkbox]), textarea, select");
      if (["dropdown", "radio"].includes(f.type)) (await el.selectOption(String(f.options[0].value)), (cfv[f.code] = f.options[0].value));
      else if (f.type === "checkbox") (await page.locator("label", { hasText: f.options[0].label }).locator("input[type=checkbox]").first().check(), (cfv[f.code] = [f.options[0].value]));
      else if (f.type === "number") (await el.fill(String(Math.max(Number(f.min_length ?? 0), 5))), (cfv[f.code] = "5"));
      else if (f.type === "date") (await el.fill("2026-01-15"), (cfv[f.code] = "2026-01-15"));
      else if (f.type === "fileinput") continue;
      else (await el.fill("QA value long enough"), (cfv[f.code] = "QA value long enough"));
    }
    await page.getByRole("button", { name: "Next" }).click();
    // step 3 media
    await page.locator("input[type=file]").setInputFiles([IMG, IMG2]);
    await page.getByRole("button", { name: "Next" }).click();
    // step 4 address + map
    const country = okd(await call("GET", "/locations/countries"))[0];
    await field(page, "Country").selectOption(String(country.id));
    await page.waitForTimeout(1200);
    const states = okd(await call("GET", "/locations/states", { query: { country_id: country.id } }));
    if (states.length) await field(page, "State").selectOption(String(states[0].id));
    await field(page, "Address").fill("QA-ADMIN street 1");
    await page.locator(".leaflet-marker-icon").first().waitFor({ timeout: 30000 });
    await page.locator(".leaflet-container").click({ position: { x: 250, y: 150 } });
    await page.waitForTimeout(400);
    assert((await field(page, "Latitude").inputValue()) !== "", "map click did not set latitude");
    await page.getByRole("button", { name: "Next" }).click();
    // step 5 SEO
    await field(page, "Meta Title").fill(Q("ad seo"));
    await field(page, "Meta Description").fill("QA-ADMIN meta description");
    await page.getByRole("button", { name: "Publish Advertisement" }).click();
    await page.waitForURL(/\/ads\/view\?id=\d+/, { timeout: 60000 });
    const id = Number(new URL(page.url()).searchParams.get("id"));
    ctx.adId = id;
    const tr = track("ads", `ad "${Q("wizard ad")}"`, id);
    ctx.tr = tr;
    await page.getByText(Q("wizard ad")).first().waitFor();
    await shot("ad-view");
    const st = await fsDoc("ads", id);
    assert(st.status === "approved" && st.category_id === leaf.id && st.price === 12345 && st.images.length === 2 && st.country_id === country.id && typeof st.latitude === "number" && st.address === "QA-ADMIN street 1" && st.condition === "new", `stored ${JSON.stringify({ ...st, description: undefined, keywords: undefined })}`);
    // custom_field_values is a map keyed by custom field id
    for (const f of fields) if (cfv[f.code] !== undefined) assert(JSON.stringify(st.custom_field_values?.[f.id]) === JSON.stringify(f.type === "number" ? Number(cfv[f.code]) : cfv[f.code]), `custom field ${f.code}: ${JSON.stringify(st.custom_field_values)}`);
    const seo = (await db.collection("seo_meta").where("seoable_id", "==", id).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
    assert(seo.some((s) => s.title === Q("ad seo")), "SEO meta not saved");
    ctx.seo = seo.map((s) => s.id);
    const pub = okd(await call("GET", `/ads/${id}`));
    assert(pub.title === Q("wizard ad") && pub.images.length === 2, "public ad detail");
    return `ad #${id} (${chain.map((c) => c.name).join(" › ")}), ${Object.keys(cfv).length} custom fields`;
  });
  await check("Ad moderation: reject with reason → approve → feature → list filters → bulk status → delete", async () => {
    const id = ctx.adId;
    await go(`/ads/view?id=${id}`);
    await page.getByRole("button", { name: "Reject" }).click();
    await modal().locator("textarea").fill("QA-ADMIN rejected for testing");
    await confirmYes("Reject");
    await toast("Ad rejected.");
    let st = await fsDoc("ads", id);
    assert(st.status === "rejected" && st.rejection_reason === "QA-ADMIN rejected for testing", `reject ${st.status}`);
    await page.getByRole("button", { name: "Approve" }).click();
    await toast("Ad approved.");
    st = await fsDoc("ads", id);
    assert(st.status === "approved" && st.rejection_reason === null, `approve ${st.status}`);
    await page.getByRole("button", { name: "Make Featured" }).click();
    await toast("Ad featured.");
    assert((await fsDoc("ads", id)).is_featured === true, "feature");
    // list: featured filter + search
    await go("/ads");
    await page.getByRole("button", { name: "More Filters" }).click();
    await page.locator("label", { hasText: "Featured" }).locator("select").selectOption("1");
    await search(Q("wizard ad"));
    await row(Q("wizard ad")).first().waitFor();
    // featured toggle off from list
    await row(Q("wizard ad")).first().getByRole("switch").nth(0).click();
    await toast("Feature removed.");
    assert((await fsDoc("ads", id)).is_featured === false, "unfeature");
    await page.getByRole("button", { name: "Reset" }).click();
    await search(Q("wizard ad"));
    // bulk status → sold → approved
    await row(Q("wizard ad")).first().locator("input[type=checkbox]").check();
    await page.locator("select", { has: page.locator("option", { hasText: "Set status…" }) }).selectOption("inactive");
    await page.getByRole("button", { name: "Apply" }).click();
    await toast("1 ad(s) updated.");
    await eventually(async () => (await fsDoc("ads", id)).status === "inactive", "bulk inactive", 10, 1000);
    await page.waitForTimeout(3800);
    await row(Q("wizard ad")).first().locator("input[type=checkbox]").check();
    await page.locator("select", { has: page.locator("option", { hasText: "Set status…" }) }).selectOption("rejected");
    await page.getByRole("button", { name: "Apply" }).click();
    await modal().locator("textarea").fill("QA-ADMIN bulk reject");
    await confirmYes("Reject");
    await eventually(async () => (await fsDoc("ads", id)).status === "rejected", "bulk rejected", 10, 1000);
    st = await fsDoc("ads", id);
    assert(st.status === "rejected" && st.rejection_reason === "QA-ADMIN bulk reject", `bulk reject ${st.status} ${st.rejection_reason}`);
    // tabs
    await page.getByRole("button", { name: "Admin Advertisements" }).click();
    await search(Q("wizard ad"));
    await row(Q("wizard ad")).first().waitFor();
    // edit via wizard (title)
    await go(`/ads/create?id=${id}`);
    await field(page, "Title").fill(Q("wizard ad edited"));
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Update Advertisement" }).click();
    await page.waitForURL(/\/ads\/view\?id=\d+/, { timeout: 60000 });
    assert((await fsDoc("ads", id)).title === Q("wizard ad edited"), "edit title");
    // delete
    await go("/ads");
    await search(Q("wizard ad edited"));
    await row(Q("wizard ad edited")).first().getByTitle("Delete").click();
    await confirmYes();
    await toast("Ad deleted.");
    assert(!(await fsDoc("ads", id)), "ad not deleted");
    for (const s of ctx.seo ?? []) await db.collection("seo_meta").doc(String(s)).delete();
    ctx.tr.cleaned = true;
    return `#${id} reject/approve/feature/bulk/edit/delete`;
  });
  await check("Jobs: status change + delete (QA job)", async () => {
    const u = await qaUser("jobs");
    const job = okd(await call("POST", "/jobs", { token: u.token, body: { title: Q("job"), description: "QA-ADMIN job description text.", employment_type: "full_time" } }));
    await go("/jobs");
    const r = page.locator("tbody tr", { hasText: Q("job") }).first();
    await r.waitFor();
    await r.locator("select").selectOption("closed");
    await toast(/updated/i);
    assert((await fsDoc("job_listings", job.id)).status === "closed", "status");
    await r.getByTitle("Delete").click();
    await confirmYes();
    await toast(/deleted/i);
    assert(!(await fsDoc("job_listings", job.id)), "job not deleted");
    return `job #${job.id}`;
  });
});

const BASELINE = "C:/Users/di/AppData/Local/Temp/claude/f--DI-PMS-Project-classify/6e713f18-fded-4e6b-ac43-234a9ad86b60/scratchpad/baseline.json";

mod("settings", async () => {
  const { readFileSync } = await import("node:fs");
  const base = JSON.parse(readFileSync(BASELINE, "utf8"));
  const sections = { general: ["general", "app_tagline"], web: ["web", "footer_description"], notification: ["firebase", "vapid_key"], "video-ads": ["video_ads", "max_size_mb"], watermark: ["media", "watermark_text"], otp: ["otp", "twilio_from"], admob: ["admob", "banner_unit_id"], adsense: ["adsense", "slot_id"], "gemini-ai": ["ai", "provider"] };
  const labels = { general: "Tagline", web: "Footer description", notification: "Web push VAPID key", "video-ads": "Max file size (MB)", watermark: "Watermark text", otp: "Twilio sender number", admob: "Banner unit ID", adsense: "Ad slot ID", "gemini-ai": "Provider" };
  try {
    for (const [slug, [group, key]] of Object.entries(sections)) {
      await check(`Settings → ${slug}: edit + save + persisted`, async () => {
        await go(`/settings/${slug}`);
        const el = field(page, labels[slug]);
        const val = slug === "video-ads" ? "77" : slug === "gemini-ai" ? "disabled" : Q(slug);
        if (slug === "gemini-ai") await el.selectOption(val);
        else await el.fill(val);
        await page.getByRole("button", { name: "Save" }).click();
        await toast("Settings saved.");
        const s = okd(await A("GET", "/admin/settings", { query: { group } }))[group];
        assert(String(s[key]) === val, `${group}.${key} = ${s[key]}`);
        if (slug === "general") await eventually(async () => okd(await call("GET", "/config")).settings.general.app_tagline === val, "public /config shows tagline");
        if (slug === "gemini-ai") {
          const r = await A("POST", "/admin/ai/generate", { body: { prompt: "x" } });
          assert(r.status === 422, `AI disabled should 422 (got ${r.status})`);
        }
        return `${group}.${key} saved`;
      });
    }
  } finally {
    // exact restore of every settings group from the baseline snapshot
    const now = (await db.collection("settings").get()).docs;
    for (const d of now) if (!base.settings[d.id]) await d.ref.delete();
    for (const [g, v] of Object.entries(base.settings)) await db.collection("settings").doc(g).set(v);
    okd(await A("PUT", "/admin/settings", { body: { group: "general", settings: { app_tagline: base.settings.general.app_tagline } } })); // bust instance cache
  }
  await check("Settings → About Us page editor → GET /pages/about → restore", async () => {
    const pages = okd(await A("GET", "/admin/crud/pages", { query: { all: 1 } }));
    const orig = pages.find((p) => p.key === "about");
    try {
      await go("/settings/about-us");
      await field(page, "Title").fill(Q("About"));
      await page.locator("[contenteditable=true]").first().click();
      await page.keyboard.press("End");
      await page.keyboard.type(" QA-ADMIN about text");
      await page.getByRole("button", { name: "Save" }).click();
      await toast("Page saved.");
      const pub = await eventually(async () => {
        const p = okd(await call("GET", "/pages/about"));
        return p.title === Q("About") && p;
      }, "GET /pages/about updated");
      assert(String(pub.body ?? pub.content).includes("QA-ADMIN about text"), "body not public");
      return "public page updated";
    } finally {
      if (orig) okd(await A("PUT", `/admin/crud/pages/${orig.id}`, { body: { title: orig.title, body: orig.body ?? "", is_published: orig.is_published ?? true } }));
    }
  });
  await check("Settings → Languages: translations editor add key + save → restore", async () => {
    const lang = okd(await A("GET", "/admin/crud/languages", { query: { all: 1 } })).find((l) => l.code !== "en");
    const orig = okd(await A("GET", `/admin/translations/${lang.code}`));
    try {
      await go("/settings/languages");
      await row(lang.name).first().getByTitle("Translations").click();
      const m = modal();
      await m.locator('input[placeholder="new.key"]').fill("qa_admin.key");
      await m.getByRole("button", { name: "Add key" }).click();
      await m.locator('input[placeholder="Filter keys…"]').fill("qa_admin");
      await m.locator("div.grid", { hasText: "qa_admin.key" }).locator("input").fill("QA-ADMIN translated");
      await m.getByRole("button", { name: "Save" }).click();
      await toast("Translations saved.");
      const now = okd(await A("GET", `/admin/translations/${lang.code}`));
      assert(now["qa_admin.key"] === "QA-ADMIN translated", "not saved");
      const changed = Object.keys(orig).filter((k) => now[k] !== orig[k]);
      assert(!changed.length, `existing strings changed: ${changed.map((k) => `${k}: ${JSON.stringify(orig[k])} → ${JSON.stringify(now[k])}`).join("; ")}`);
      return `${lang.code}: ${Object.keys(now).length} strings`;
    } finally {
      okd(await A("PUT", `/admin/translations/${lang.code}`, { body: { strings: Object.keys(orig).length ? orig : { _: "" } } }));
      if (!Object.keys(orig).length) await db.collection("translations").doc(lang.code).delete();
    }
  });
  await check("Settings → File manager browse (public + private folders)", async () => {
    await go("/settings/file-manager");
    await page.locator("button", { hasText: /^brand$/ }).first().click();
    await page.waitForTimeout(2500);
    const imgs = await page.locator("main img").count();
    await shot("file-manager");
    const files = okd(await A("GET", "/admin/files", { query: { prefix: "receipts/" } }));
    const deep = files.folders.length ? okd(await A("GET", "/admin/files", { query: { prefix: files.folders[0] } })) : { files: [] };
    assert(deep.files.every((f) => f.url === null), "private receipt files exposed with URL");
    return `brand/: ${imgs} images; receipts folder urls hidden`;
  });
  await check("Settings → System status all green", async () => {
    await go("/settings/system-status");
    await page.getByText("Operational").first().waitFor();
    const bad = await page.locator("span.bg-danger").count();
    const s = okd(await A("GET", "/admin/system-status"));
    assert(Object.values(s.checks).every((c) => c.ok) && !bad, `checks ${JSON.stringify(s.checks)}`);
    return Object.keys(s.checks).join(",");
  });
  await check("Settings → Email templates CRUD", () =>
    crudFlow({
      module: "email-templates", path: "/settings/email-templates", resource: "email_templates", collection: "email_templates", key: "subject", name: Q("subject"), editName: Q("subject edited"), toggle: false,
      fill: async (s, ph) => {
        if (ph === "create") await field(s, "Code").fill(`qa_admin_${stamp}`);
        await field(s, "Subject").fill(ph === "create" ? Q("subject") : Q("subject edited"));
        const body = s.locator("[contenteditable=true], textarea").first();
        await body.click();
        await page.keyboard.type("QA body {{name}}");
      },
    }),
  );
  await check("Settings → SEO entry CRUD", () =>
    crudFlow({
      module: "seo", path: "/settings/seo", resource: "seo_meta", collection: "seo_meta", key: "title", name: Q("seo"), editName: Q("seo edited"), toggle: false,
      fill: async (s, ph) => {
        if (ph === "create") await field(s, "Route key").fill(`qa-admin-${stamp}`);
        await field(s, "Meta title").fill(ph === "create" ? Q("seo") : Q("seo edited"));
      },
    }),
  );
  await check("Settings → Payment gateway toggle + log viewer + default currency page", async () => {
    await go("/settings/payment-gateways");
    const g = okd(await A("GET", "/admin/payment-gateways")).find((x) => x.code === "sandbox");
    const r = row(g.name).first();
    await r.getByRole("switch").first().click();
    await toast("Gateway updated.");
    const after = await fsDoc("payment_gateways", g.id);
    assert(after.is_active === !g.is_active, "gateway toggle");
    await r.getByRole("switch").first().click();
    await toast("Gateway updated.");
    assert((await fsDoc("payment_gateways", g.id)).is_active === g.is_active, "gateway restore");
    await go("/settings/logs");
    await page.locator("tbody tr").first().waitFor();
    const logRows = await page.locator("tbody tr").count();
    await go("/settings/currency");
    await page.getByText("Default currency").first().waitFor();
    return `sandbox toggled+restored, ${logRows} log rows`;
  });
});

mod("dashboard", async () => {
  await check("Dashboard KPIs match Firestore", async () => {
    const d = okd(await A("GET", "/admin/dashboard"));
    const [ads, users, cats, txns, subs] = await Promise.all(["ads", "users", "categories", "transactions", "subscriptions"].map(async (c) => (await db.collection(c).get()).docs.map((x) => x.data())));
    const now = Date.now();
    const exp = (a) => a.status === "expired" || (a.status === "approved" && a.expires_at && a.expires_at.toMillis() <= now);
    const expect = {
      total_ads: ads.length,
      pending_ads: ads.filter((a) => a.status === "pending").length,
      sold_ads: ads.filter((a) => a.status === "sold").length,
      featured_ads: ads.filter((a) => a.is_featured).length,
      active_ads: ads.filter((a) => a.status === "approved" && !exp(a)).length,
      total_users: users.filter((u) => !u.deleted_at).length,
      total_categories: cats.length,
      subscriptions: subs.length,
      total_revenue: txns.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.total ?? 0), 0),
    };
    const diff = Object.entries(expect).filter(([k, v]) => d.kpis[k] !== v).map(([k, v]) => `${k}: api ${d.kpis[k]} vs fs ${v}`);
    assert(!diff.length, diff.join("; "));
    await go("/dashboard");
    const text = await page.locator("main").innerText();
    assert(text.includes(String(d.kpis.total_ads)), "total ads not shown on dashboard");
    await shot("dashboard");
    return Object.entries(expect).map(([k, v]) => `${k}=${v}`).join(" ");
  });
  await check("User queries page (read-only)", async () => {
    await go("/customers/queries");
    await page.locator("tbody tr").first().waitFor();
    return `${await page.locator("tbody tr").count()} rows`;
  });
});

// ===================================================================================
const want = process.argv.slice(2);
try {
  await login(page, "admin@classiads.test");
  for (const [name, fn] of Object.entries(MODULES)) if (!want.length || want.includes(name)) await fn();
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  for (const f of failed) console.log(`  FAIL ${f.name}: ${f.detail}`);
  const leftovers = created.filter((c) => !c.cleaned);
  if (leftovers.length) console.log("NOT CLEANED:", JSON.stringify(leftovers));
  await writeFile(`${SHOTS}/results-${want.join("_") || "all"}.json`, JSON.stringify({ results, created }, null, 1));
  await browser.close();
  process.exit(failed.length ? 1 : 0);
}
