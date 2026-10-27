/**
 * Renders Play Store marketing assets from raw emulator captures.
 *   node store/compose.mjs   (uses tools/qa/node_modules/playwright-core + local Chrome)
 * Output: store/playstore/phone-screenshots/*.png (1080×1920), feature-graphic.png (1024×500), icon-512.png
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../tools/qa/package.json"));
const { chromium } = require("playwright-core");

const RAW = join(here, "raw");
const OUT = join(here, "playstore");
mkdirSync(join(OUT, "phone-screenshots"), { recursive: true });
const b64 = (f) => `data:image/png;base64,${readFileSync(join(RAW, f)).toString("base64")}`;
const logo = `data:image/png;base64,${readFileSync(join(here, "../app-icon.png")).toString("base64")}`;

const SLIDES = [
  ["01-home.png", "Buy & Sell Anything", "In One Click", "Your marketplace for cars, phones, homes & more"],
  ["02-listings.png", "Great Deals", "Handpicked for You", "Featured, most-viewed and popular listings"],
  ["08-buyer-detail.png", "Every Detail", "Before You Decide", "Photos, specs and verified seller ratings"],
  ["11-category.png", "Find It Fast", "With Smart Categories", "Browse, filter and search in seconds"],
  ["10-chat-convo.png", "Chat & Negotiate", "Instantly", "Message sellers and make offers in-app"],
  ["05-post-ad.png", "Post Your Ad", "In Under a Minute", "Add photos, price and location — done"],
  ["03-ad-detail.png", "Your Listing", "Looking Its Best", "Big photos, key specs and a verified seller badge"],
  ["04-my-ads.png", "Manage Everything", "In One Place", "Edit, renew or mark your ads as sold"],
];

const css = `
  * { margin: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1920px; overflow: hidden; font-family: 'Poppins', sans-serif; }
  .bg { position: absolute; inset: 0; background: radial-gradient(1200px 900px at 85% 0%, #505081 0%, transparent 60%), linear-gradient(160deg, #272757 0%, #1b1b45 55%, #0f0e47 100%); }
  .ring { position: absolute; border-radius: 50%; border: 2px solid rgba(255,191,0,.25); }
  .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; }
  .copy { position: absolute; top: 120px; left: 0; right: 0; text-align: center; color: #fff; padding: 0 70px; }
  .brand { display: inline-flex; align-items: center; gap: 14px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); padding: 10px 22px 10px 12px; border-radius: 999px; font-weight: 600; font-size: 26px; letter-spacing: .3px; }
  .brand img { width: 44px; height: 44px; border-radius: 12px; }
  h1 { margin-top: 36px; font-size: 84px; line-height: 1.02; font-weight: 800; letter-spacing: -1.5px; }
  h1 span { display: block; color: #FFBF00; }
  p { margin-top: 26px; font-size: 34px; color: rgba(255,255,255,.78); font-weight: 400; }
  .phone { position: absolute; left: 50%; top: 610px; width: 760px; height: 1690px; transform: translateX(-50%); border-radius: 96px; background: #0b0b20; padding: 22px;
           box-shadow: 0 0 0 3px #3a3a6e, 0 60px 120px rgba(0,0,0,.55), inset 0 0 0 2px #1d1d3f; }
  .screen { position: relative; width: 100%; height: 100%; border-radius: 76px; overflow: hidden; background: #e4e4ee; }
  .screen img { width: 100%; display: block; }
  .status { position: absolute; top: 0; left: 0; right: 0; height: 64px; background: inherit; display: flex; align-items: center; justify-content: space-between; padding: 6px 54px 0; font: 600 26px 'Poppins'; color: #0f0e47; }
  .island { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 150px; height: 40px; background: #0b0b20; border-radius: 30px; }
  .icons { display: flex; gap: 10px; align-items: center; }
  .bar { width: 6px; background: #0f0e47; border-radius: 2px; }
`;

const statusBar = (bg) => `
  <div class="status" style="background:${bg}"><span>9:41</span><div class="island"></div>
    <div class="icons"><div class="bar" style="height:10px"></div><div class="bar" style="height:15px"></div><div class="bar" style="height:20px"></div><div class="bar" style="height:25px"></div>
      <svg width="34" height="22" viewBox="0 0 34 22"><rect x="1" y="1" width="28" height="20" rx="5" fill="none" stroke="#0f0e47" stroke-width="2"/><rect x="4" y="4" width="22" height="14" rx="3" fill="#0f0e47"/><rect x="30" y="7" width="3" height="8" rx="1.5" fill="#0f0e47"/></svg></div></div>`;

function slide([file, l1, l2, sub], i) {
  return `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
    <div class="bg"></div>
    <div class="blob" style="width:520px;height:520px;background:#FFBF00;left:${i % 2 ? -260 : 820}px;top:${i % 2 ? 980 : 1200}px;opacity:.18"></div>
    <div class="ring" style="width:900px;height:900px;left:${i % 2 ? 420 : -380}px;top:-300px"></div>
    <div class="ring" style="width:600px;height:600px;left:${i % 2 ? -200 : 700}px;top:1350px"></div>
    <div class="copy"><div class="brand"><img src="${logo}">ClassiAds Hub</div><h1>${l1}<span>${l2}</span></h1><p>${sub}</p></div>
    <div class="phone"><div class="screen">${statusBar("#ffffff")}<img src="${b64(file)}" style="margin-top:-12px;clip-path: inset(66px 0 0 0)"></div></div>
  </body></html>`;
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [i, s] of SLIDES.entries()) {
  await page.setContent(slide(s, i), { waitUntil: "networkidle" });
  // The status bar background follows the screen's own top colour.
  await page.evaluate(() => {
    const img = document.querySelector(".screen img");
    const c = document.createElement("canvas");
    c.width = 4; c.height = 4;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, img.naturalWidth / 2, 80, 4, 4, 0, 0, 4, 4);
    const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
    document.querySelector(".status").style.background = `rgb(${r},${g},${b})`;
  });
  await page.screenshot({ path: join(OUT, "phone-screenshots", `${String(i + 1).padStart(2, "0")}-${s[0].replace(/^\d+b?-/, "")}`) });
  console.log("slide", i + 1);
}

// Feature graphic 1024×500
await page.setViewportSize({ width: 1024, height: 500 });
await page.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet"><style>
  *{margin:0;box-sizing:border-box} body{width:1024px;height:500px;overflow:hidden;font-family:Poppins;background:linear-gradient(120deg,#272757,#0f0e47);position:relative;color:#fff}
  .ring{position:absolute;border-radius:50%;border:2px solid rgba(255,191,0,.28)} .blob{position:absolute;border-radius:50%;filter:blur(50px);background:#FFBF00;opacity:.2}
  .l{position:absolute;left:56px;top:96px;width:440px} .logo{display:flex;align-items:center;gap:16px;font-weight:600;font-size:26px} .logo img{width:64px;height:64px;border-radius:16px}
  h1{margin-top:26px;font-size:54px;line-height:1.05;font-weight:800} h1 span{color:#FFBF00} p{margin-top:16px;font-size:22px;color:rgba(255,255,255,.8)}
  .ph{position:absolute;width:250px;height:520px;border-radius:40px;background:#0b0b20;padding:10px;box-shadow:0 30px 60px rgba(0,0,0,.5),0 0 0 2px #3a3a6e}
  .ph div{width:100%;height:100%;border-radius:32px;overflow:hidden} .ph img{width:100%;margin-top:-58px}
</style></head><body>
  <div class="blob" style="width:380px;height:380px;right:60px;top:40px"></div><div class="ring" style="width:620px;height:620px;right:-140px;top:-160px"></div>
  <div class="l"><div class="logo"><img src="${logo}">ClassiAds Hub</div><h1>Buy &amp; Sell <span>Anything</span><br>in One Click</h1><p>Cars · Phones · Homes · Jobs & more</p></div>
  <div class="ph" style="right:290px;top:80px;transform:rotate(-7deg)"><div><img src="${b64("02-listings.png")}"></div></div>
  <div class="ph" style="right:60px;top:40px;transform:rotate(6deg)"><div><img src="${b64("08-buyer-detail.png")}"></div></div>
</body></html>`, { waitUntil: "networkidle" });
await page.screenshot({ path: join(OUT, "feature-graphic.png") });
await browser.close();
copyFileSync(join(here, "../512.png"), join(OUT, "icon-512.png"));
console.log("done");
