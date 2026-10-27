// Adds real photos to the 6 demo ads (for store screenshots/video). Prefers CC0 / Public Domain
// images from Wikimedia Commons; any attribution-required image is logged to docs/IMAGE_CREDITS.md.
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
initializeApp({ credential: applicationDefault(), projectId: "classiadshub", storageBucket: "classiadshub.firebasestorage.app" });

const UA = { "User-Agent": "ClassiAdsHub-demo/1.0 (dhaval@bydesign.io)" };
const QUERIES = {
  1: ["Ford Mustang EcoBoost", "Ford Mustang S550"],
  2: ["Toyota Corolla 2019", "Toyota Corolla sedan"],
  3: ["iPhone 15 Pro Max", "iPhone 15 Pro"],
  4: ["Samsung Galaxy S24 Ultra", "Samsung Galaxy smartphone"],
  5: ["villa swimming pool house", "luxury villa"],
  6: ["suburban house exterior", "house front yard"],
};
const FREE = /^(cc0|public domain|pdm|no restrictions)/i;

async function search(q) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=25&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1200`;
  const j = await (await fetch(url, { headers: UA })).json();
  return Object.values(j.query?.pages ?? {})
    .map((p) => ({ title: p.title, i: p.imageinfo?.[0] }))
    .filter((x) => x.i && /jpeg|png/.test(x.i.mime) && x.i.width >= 1000 && x.i.width >= x.i.height)
    .map((x) => ({
      title: x.title,
      thumb: x.i.thumburl,
      page: x.i.descriptionurl,
      license: x.i.extmetadata?.LicenseShortName?.value ?? "",
      artist: (x.i.extmetadata?.Artist?.value ?? "").replace(/<[^>]*>/g, "").trim(),
    }));
}

(async () => {
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const credits = [];
  for (const [id, queries] of Object.entries(QUERIES)) {
    const ad = (await db.collection("ads").doc(id).get()).data();
    if (!ad) continue;
    if ((ad.images ?? []).length) {
      console.log(`ad ${id} already has images`);
      continue;
    }
    let pool = [];
    for (const q of queries) pool.push(...(await search(q)));
    const free = pool.filter((p) => FREE.test(p.license));
    const picks = (free.length >= 2 ? free : [...free, ...pool.filter((p) => !FREE.test(p.license))]).slice(0, 3);
    const images = [];
    for (const [n, p] of picks.entries()) {
      const buf = Buffer.from(await (await fetch(p.thumb, { headers: UA })).arrayBuffer());
      const dest = `ads/${id}/${randomUUID()}.jpg`;
      await bucket.file(dest).save(buf, { contentType: "image/jpeg", metadata: { cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: randomUUID() } } });
      images.push({ id: n + 1, path: dest, is_primary: n === 0, sort_order: n });
      if (!FREE.test(p.license)) credits.push(`- Ad #${id} "${ad.title}": [${p.title}](${p.page}) by ${p.artist || "unknown"} — ${p.license}`);
      console.log(`ad ${id}: ${p.license} ${p.title}`);
    }
    await db.collection("ads").doc(id).update({ images, updated_at: new Date() });
  }
  const doc = path.join(__dirname, "../../docs/IMAGE_CREDITS.md");
  fs.writeFileSync(
    doc,
    `# Demo image credits\n\nDemo listing photos come from Wikimedia Commons. Public-domain / CC0 images need no attribution; the images below require it and must be credited (or replaced) if the demo ads stay live.\n\n${credits.join("\n") || "_All demo images are CC0 / public domain._"}\n`,
  );
  console.log("credits written:", credits.length);
})();
