// Post-QA data fixes: explicit defaults for toggles the admin form saves as booleans,
// and slider images that were never present in Laravel storage.
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { randomUUID } = require("crypto");
initializeApp({ credential: applicationDefault(), projectId: "classiadshub", storageBucket: "classiadshub.firebasestorage.app" });
(async () => {
  const db = getFirestore();
  const ads = (await db.collection("settings").doc("ads").get()).data() ?? {};
  const notif = (await db.collection("settings").doc("notifications").get()).data() ?? {};
  if (ads.free_ad_listing === undefined) await db.collection("settings").doc("ads").set({ free_ad_listing: true }, { merge: true });
  const n = {};
  for (const k of ["push_enabled", "notify_new_message", "notify_offers"]) if (notif[k] === undefined) n[k] = true;
  if (Object.keys(n).length) await db.collection("settings").doc("notifications").set(n, { merge: true });
  console.log("settings ok", { free_ad_listing: ads.free_ad_listing, notif });
  const bucket = getStorage().bucket();
  const sliders = await db.collection("sliders").get();
  const files = ["../../web/public/banner1.png", "../../web/public/banner2.png"];
  let i = 0;
  for (const s of sliders.docs) {
    const p = s.data().image_path;
    const [exists] = p ? await bucket.file(p).exists() : [false];
    if (exists) continue;
    const dest = `sliders/banner-${s.id}.png`;
    await bucket.upload(files[i++ % files.length], { destination: dest, metadata: { contentType: "image/png", metadata: { firebaseStorageDownloadTokens: randomUUID() } } });
    await s.ref.update({ image_path: dest });
    console.log("slider", s.id, "→", dest);
  }
  // Literal "seller_profile.x" keys written before the dotted-path fix.
  for (const u of (await db.collection("users").get()).docs) {
    const d = u.data();
    const bad = Object.keys(d).filter((k) => k.includes("."));
    if (bad.length) {
      const { FieldValue, FieldPath } = require("firebase-admin/firestore");
      const args = bad.flatMap((k) => [new FieldPath(k), FieldValue.delete()]);
      await u.ref.update(...args);
      console.log("user", u.id, "removed literal keys", bad);
    }
  }
})();
