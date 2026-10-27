// Demo ads seeded in May expired in June; give them a fresh 60-day window so the
// marketplace isn't empty for QA. Marks them is_demo so Settings → Dummy Data can remove them.
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp({ credential: applicationDefault(), projectId: "classiadshub" });
(async () => {
  const db = getFirestore();
  const snap = await db.collection("ads").where("status", "in", ["approved", "expired"]).get();
  const until = new Date(Date.now() + 60 * 86400000);
  for (const d of snap.docs) await d.ref.update({ status: "approved", expires_at: until, is_demo: true, updated_at: new Date() });
  console.log(`renewed ${snap.size} ads until ${until.toISOString()}`);
})();
