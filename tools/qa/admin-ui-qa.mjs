/**
 * Browser QA for the admin panel: logs in, opens every module, records console errors,
 * failed API calls and a screenshot per page.
 *   node admin-ui-qa.mjs [baseUrl] [outDir]
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:4100";
const OUT = process.argv[3] ?? "./shots/admin";
await mkdir(OUT, { recursive: true });

const PAGES = [
  "/dashboard", "/ads", "/ads/create?type=regular", "/categories", "/categories/order", "/categories/form", "/custom-fields", "/custom-fields/form", "/jobs",
  "/content/sliders", "/content/home", "/content/featured-sections", "/content/tips", "/content/banner-ads", "/content/banner-ads/create",
  "/chat", "/chat/templates", "/packages", "/packages/form", "/packages/featured-plans", "/packages/subscriptions", "/packages/transactions", "/packages/bank-transfers",
  "/sellers/verification-fields", "/sellers/verifications", "/sellers/reviews", "/sellers/review-reports",
  "/blogs", "/blogs/form", "/blogs/categories", "/blogs/faqs",
  "/customers", "/customers/roles", "/customers/staff", "/customers/queries",
  "/locations/currencies", "/locations/countries", "/locations/states", "/locations/cities", "/locations/areas",
  "/reports/reasons", "/reports/users", "/notifications",
  "/settings", "/settings/general", "/settings/web", "/settings/otp", "/settings/about-us", "/settings/firebase", "/settings/languages", "/settings/payment-gateways",
  "/settings/system-status", "/settings/seo", "/settings/file-manager", "/settings/email-templates", "/settings/gemini-ai", "/settings/currency", "/settings/logs", "/settings/dummy-data",
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await ctx.newPage();
const problems = [];
let current = "login";
page.on("console", (m) => m.type() === "error" && !/favicon|Download the React DevTools/.test(m.text()) && problems.push(`[${current}] console: ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => problems.push(`[${current}] pageerror: ${e.message.slice(0, 200)}`));
page.on("response", async (r) => {
  if (r.url().includes("/api/v1") && r.status() >= 400) problems.push(`[${current}] HTTP ${r.status()} ${r.request().method()} ${r.url().replace(/^.*\/api\/v1/, "")}`);
});

await page.goto(`${BASE}/login`);
await page.fill('input[autocomplete="username"]', "admin@classiads.test");
await page.fill('input[type="password"]', "password");
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 30000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${OUT}/00-login-ok.png` });

let i = 1;
for (const p of PAGES) {
  current = p;
  await page.goto(`${BASE}${p}`);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(600);
  const name = `${String(i++).padStart(2, "0")}-${p.replace(/[/?=&]+/g, "_").replace(/^_/, "")}.png`;
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  const heading = await page.locator("main h1").first().textContent().catch(() => "");
  console.log(`OK  ${p.padEnd(40)} ${heading?.trim() ?? ""}`);
}

console.log(`\n${problems.length} problem(s)`);
for (const pr of problems) console.log("  ", pr);
await browser.close();
process.exit(problems.length ? 1 : 0);
