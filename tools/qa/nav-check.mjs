// Client-side navigation through dynamic routes; reports whether each hop was SPA or full reload.
import { chromium } from "playwright-core";
const BASE = process.argv[2] ?? "http://localhost:4201";
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext()).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(m.text().slice(0, 200)));
const txt = [];
page.on("response", (r) => /\.txt/.test(r.url()) && txt.push(`${r.status()} ${r.headers()["content-type"]} ${r.url().replace(BASE, "")}`));
async function hop(label, sel, check) {
  await page.evaluate(() => (window.__marker = 1));
  await page.locator(sel).first().click();
  await page.waitForFunction(check, null, { timeout: 30000 });
  const spa = await page.evaluate(() => window.__marker === 1);
  console.log(`${label}: ok (${spa ? "SPA" : "full reload"}) ${page.url().replace(BASE, "")} — ${(await page.locator("main h1").first().innerText().catch(() => "")).trim()}`);
}
await page.goto(`${BASE}/`); await page.waitForSelector('a[href^="/ad/"]'); await page.waitForTimeout(2500);
await hop("home → ad", 'main a[href^="/ad/"]', () => location.pathname.startsWith("/ad/") && document.querySelector("main h1")?.textContent);
await page.waitForTimeout(1500);
await hop("ad → seller", 'main a[href^="/seller/"]', () => location.pathname.startsWith("/seller/") && document.querySelector("main h1")?.textContent);
await page.waitForTimeout(1500);
await hop("seller → ad", 'main a[href^="/ad/"]', () => location.pathname.startsWith("/ad/") && document.querySelector("main h1")?.textContent);
await page.waitForTimeout(1500);
await hop("ad → category", 'main nav a[href^="/category/"]', () => location.pathname.startsWith("/category/") && document.querySelector("main h1")?.textContent);
await page.waitForTimeout(1500);
await hop("category → ad", 'main a[href^="/ad/"]', () => location.pathname.startsWith("/ad/") && document.querySelector("main h1")?.textContent);
await page.goto(`${BASE}/blog`); await page.waitForTimeout(2500);
await hop("blog → post", 'main a[href^="/blog/"]', () => location.pathname.split("/").length > 2 && document.querySelector("main h1")?.textContent);
console.log("errors:", errs);
console.log(txt.filter((t) => !t.startsWith("200 text/plain")).slice(0, 12).join("\n"));
await browser.close();
