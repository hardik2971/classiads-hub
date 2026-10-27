/**
 * Browser QA for the public website (static export + Firebase API).
 *   node web-ui-qa.mjs [baseUrl] [outDir]
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:4200";
const OUT = process.argv[3] ?? "./shots/web";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const problems = [];
const results = [];
let current = "";
page.on("console", (m) => m.type() === "error" && !/favicon|DevTools|Failed to load resource: the server responded with a status of 404/.test(m.text()) && problems.push(`[${current}] console: ${m.text().slice(0, 220)}`));
page.on("pageerror", (e) => problems.push(`[${current}] pageerror: ${e.message.slice(0, 220)}`));
page.on("response", (r) => {
  if (/\/api\/v1|cloudfunctions\.net\/api/.test(r.url()) && r.status() >= 500) problems.push(`[${current}] HTTP ${r.status()} ${r.url().replace(/^.*\/v1/, "")}`);
});

let n = 0;
async function step(name, fn) {
  current = name;
  try {
    const detail = await fn();
    results.push(`PASS ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    results.push(`FAIL ${name} — ${e.message.split("\n")[0].slice(0, 200)}`);
  }
  await page.screenshot({ path: `${OUT}/${String(++n).padStart(2, "0")}-${name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.png` }).catch(() => undefined);
}
const settle = async () => {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(500);
};

await step("home", async () => {
  await page.goto(`${BASE}/`);
  await page.waitForSelector('a[href^="/ad/"]', { timeout: 30000 });
  await settle();
  return `${await page.locator('a[href^="/ad/"]').count()} ad links`;
});

let adHref = "";
await step("ad detail", async () => {
  adHref = (await page.locator('a[href^="/ad/"]').first().getAttribute("href")) ?? "";
  await page.goto(`${BASE}${adHref}`);
  await page.waitForSelector("main h1", { timeout: 30000 });
  await settle();
  return (await page.locator("main h1").first().textContent())?.trim();
});

await step("search", async () => {
  await page.goto(`${BASE}/search?q=Toyota`);
  await page.waitForSelector('a[href^="/ad/"]', { timeout: 30000 });
  await settle();
  return `${await page.locator('a[href^="/ad/"]').count()} results`;
});

await step("category", async () => {
  await page.goto(`${BASE}/category/cars-vehicles`);
  await page.waitForSelector("main h1", { timeout: 30000 });
  await settle();
  return (await page.locator("main h1").first().textContent())?.trim();
});

for (const [name, path, sel] of [
  ["blog list", "/blog", "main h1"],
  ["jobs list", "/jobs", "main h1"],
  ["cms page", "/page/about", "main h1"],
  ["seller profile", "/seller/2", "main h1"],
]) {
  await step(name, async () => {
    await page.goto(`${BASE}${path}`);
    await page.waitForSelector(sel, { timeout: 30000 });
    await settle();
    return (await page.locator(sel).first().textContent())?.trim();
  });
}

await step("blog detail", async () => {
  await page.goto(`${BASE}/blog`);
  await settle();
  const href = await page.locator('a[href^="/blog/"]').first().getAttribute("href");
  await page.goto(`${BASE}${href}`);
  await page.waitForSelector("main h1", { timeout: 30000 });
  return (await page.locator("main h1").first().textContent())?.trim();
});

await step("job detail", async () => {
  await page.goto(`${BASE}/jobs`);
  await settle();
  const href = await page.locator('a[href^="/jobs/"]').first().getAttribute("href").catch(() => null);
  if (!href) return "no jobs listed";
  await page.goto(`${BASE}${href}`);
  await page.waitForSelector("main h1", { timeout: 30000 });
  return (await page.locator("main h1").first().textContent())?.trim();
});

await step("login (seller)", async () => {
  await page.goto(`${BASE}/login`);
  await settle();
  await page.locator("main form input").first().fill("seller@classiads.test");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('main form button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  await page.waitForTimeout(2500);
  await settle();
  return page.url().replace(BASE, "");
});

for (const path of ["/dashboard", "/dashboard/ads", "/dashboard/favorites", "/dashboard/chat", "/dashboard/notifications", "/dashboard/subscriptions", "/dashboard/transactions", "/dashboard/verification", "/dashboard/profile", "/dashboard/reviews", "/dashboard/applications", "/post-ad", "/checkout"]) {
  await step(path, async () => {
    await page.goto(`${BASE}${path}`);
    await settle();
    await page.waitForTimeout(800);
    if (page.url().includes("/login")) throw new Error("redirected to login — session lost");
    return (await page.locator("main h1, main h2").first().textContent().catch(() => ""))?.trim();
  });
}

await step("dashboard ad edit", async () => {
  await page.goto(`${BASE}/dashboard/ads`);
  await settle();
  const href = await page.locator('a[href*="/edit"]').first().getAttribute("href").catch(() => null);
  if (!href) return "no editable ads";
  await page.goto(`${BASE}${href}`);
  await settle();
  const title = await page.locator('input[name="title"]').inputValue().catch(() => "");
  if (!title) throw new Error("edit form empty");
  return title;
});

await step("favorite toggle on ad", async () => {
  await page.goto(`${BASE}${adHref}`);
  await settle();
  const btn = page.getByRole("button", { name: /favou?rite|save/i }).first();
  if (!(await btn.count())) return "no favorite button";
  await btn.click();
  await page.waitForTimeout(1500);
  return "clicked";
});

await step("logout", async () => {
  await ctx.clearCookies();
  await page.evaluate(() => indexedDB.deleteDatabase("firebaseLocalStorageDb"));
  await page.goto(`${BASE}/dashboard`);
  await settle();
  return page.url().replace(BASE, "");
});

console.log(results.join("\n"));
console.log(`\n${problems.length} problem(s)`);
for (const p of problems) console.log("  ", p);
await browser.close();
process.exit(results.some((r) => r.startsWith("FAIL")) || problems.length ? 1 : 0);
