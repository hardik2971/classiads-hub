// Replace a demo ad's photos with specific Wikimedia Commons files (by search + title match).
const fs = require("fs"); const path = require("path"); const { randomUUID } = require("crypto");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore"); const { getStorage } = require("firebase-admin/storage");
initializeApp({ credential: applicationDefault(), projectId: "classiadshub", storageBucket: "classiadshub.firebasestorage.app" });
const UA = { "User-Agent": "ClassiAdsHub-demo/1.0 (dhaval@bydesign.io)" };
const PLAN = {
  2: ["Toyota Corolla Sedan E210 Washington DC", ["USA (2)", "USA (3)", "USA (5)"]],
  5: ["modern villa exterior", ["3D Rendering of Modern Luxury Villa", "Modern countryside villa", "View of Highcombe"]],
  6: ["modern house exterior red roof garden", ["Modern house exterior with red roof", "Rockhill House Estate"]],
};
(async () => {
  const db = getFirestore(), bucket = getStorage().bucket(); const credits = [];
  for (const [id, [q, wanted]] of Object.entries(PLAN)) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=40&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1200`;
    const pages = Object.values((await (await fetch(url, { headers: UA })).json()).query?.pages ?? {});
    const ad = (await db.collection("ads").doc(id).get()).data();
    for (const img of ad.images ?? []) await bucket.file(img.path).delete().catch(() => {});
    const images = [];
    for (const w of wanted) {
      const p = pages.find((x) => x.title.includes(w)); if (!p) { console.log("missing", id, w); continue; }
      const i = p.imageinfo[0]; const lic = i.extmetadata?.LicenseShortName?.value ?? "";
      const artist = (i.extmetadata?.Artist?.value ?? "").replace(/<[^>]*>/g, "").trim();
      const buf = Buffer.from(await (await fetch(i.thumburl, { headers: UA })).arrayBuffer());
      const dest = `ads/${id}/${randomUUID()}.jpg`;
      await bucket.file(dest).save(buf, { contentType: "image/jpeg", metadata: { metadata: { firebaseStorageDownloadTokens: randomUUID() } } });
      images.push({ id: images.length + 1, path: dest, is_primary: images.length === 0, sort_order: images.length });
      if (!/cc0|public domain|no restrictions/i.test(lic)) credits.push(`- Ad #${id} "${ad.title}": [${p.title}](${i.descriptionurl}) by ${artist || "unknown"} — ${lic}`);
      console.log(id, lic, p.title);
    }
    await db.collection("ads").doc(id).update({ images, updated_at: new Date() });
  }
  const doc = path.join(__dirname, "../../docs/IMAGE_CREDITS.md");
  fs.appendFileSync(doc, credits.join("\n") + "\n");
})();
