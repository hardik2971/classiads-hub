/**
 * Removes data created by QA runs from the live Firestore/Auth/Storage, keeping everything
 * that came from the MySQL migration (ids ≤ the migrated maximum per collection).
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=../../secret/classiadshub-firebase.json node cleanup-qa-data.js [--dry]
 */
const path = require("path");
const admin = require(path.join(__dirname, "../migrate/node_modules/firebase-admin"));
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: "classiadshub", storageBucket: "classiadshub.firebasestorage.app" });
const db = admin.firestore();
const dry = process.argv.includes("--dry");

// Highest numeric id per collection after the migration (MySQL data).
const MIGRATED_MAX = {
  users: 3, ads: 6, conversations: 2, messages: 4, offers: 1, reviews: 0, reports: 0, transactions: 1, subscriptions: 1, invoices: 1,
  saved_searches: 0, verification_requests: 0, job_listings: 1, job_applications: 0, push_notifications: 0, user_queries: 4,
  categories: 30, custom_fields: 10, sliders: 2, featured_sections: 4, packages: 3, featured_ad_plans: 2, blog_posts: 3, blog_categories: 2,
  pages: 6, faqs: 7, email_templates: 3, countries: 4, states: 7, cities: 11, areas: 0, currencies: 5, languages: 4, roles: 1, tips: 4,
  report_reasons: 7, chat_templates: 0, banner_ads: 0, verification_fields: 3, seo_meta: 1,
};
const MIGRATION_DAY = new Date("2026-10-26T11:00:00Z");
// Store-listing demo data created after the migration that must survive cleanup.
const DEMO_CONVERSATIONS = [17];
const KEEP = {
  conversations: (d) => DEMO_CONVERSATIONS.includes(Number(d.id)),
  messages: (d) => DEMO_CONVERSATIONS.includes(Number(d.conversation_id)),
};

(async () => {
  const qaUsers = new Set();
  let removed = 0;
  for (const [col, max] of Object.entries(MIGRATED_MAX)) {
    const snap = await db.collection(col).get();
    let next = max;
    for (const d of snap.docs) {
      const id = Number(d.data().id ?? d.id);
      if (KEEP[col]?.({ ...d.data(), id })) {
        next = Math.max(next, id);
        continue;
      }
      if (Number.isFinite(id) && id > max) {
        if (col === "users") qaUsers.add(id);
        if (!dry) await d.ref.delete();
        removed++;
      }
    }
    if (col === "counters") continue;
    if (!dry) await db.collection("counters").doc(col).set({ value: next }, { merge: true });
  }
  // Docs keyed by composite/uuid ids created during QA.
  for (const col of ["favorites", "follows", "notifications", "user_devices", "otp_verifications", "ad_sales", "audit_logs"]) {
    const snap = await db.collection(col).get();
    for (const d of snap.docs) {
      const c = d.data().created_at;
      const at = c?.toDate ? c.toDate() : c ? new Date(c) : null;
      if (at && at >= MIGRATION_DAY && !String(d.id).startsWith("mysql_")) {
        if (!dry) await d.ref.delete();
        removed++;
      }
    }
  }
  // Firebase Auth accounts that aren't migrated users.
  const list = await admin.auth().listUsers(1000);
  for (const u of list.users) {
    if (!["1", "2", "3"].includes(u.uid)) {
      if (!dry) await admin.auth().deleteUser(u.uid);
      removed++;
    }
  }
  // Restore demo-ad counters and seller rating after QA interactions.
  if (!dry) {
    for (const id of [1, 2, 3, 4, 5, 6]) {
      const favs = await db.collection("favorites").where("ad_id", "==", id).count().get();
      await db.collection("ads").doc(String(id)).set({ favorites_count: favs.data().count }, { merge: true });
    }
    const revs = (await db.collection("reviews").where("reviewee_id", "==", 2).get()).docs.map((d) => d.data()).filter((r) => r.type === "seller_review" && r.is_approved !== false);
    const avg = revs.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;
    await db.collection("users").doc("2").set({ seller_profile: { rating_avg: Math.round(avg * 100) / 100, rating_count: revs.length } }, { merge: true });
  }
  // QA uploads in Storage (avatars/kyc/receipts/resumes/ads of removed ids).
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  for (const f of files) {
    const [top, owner] = f.name.split("/");
    const id = Number(owner);
    const qaOwned = ["avatars", "kyc", "receipts", "resumes"].includes(top) ? qaUsers.has(id) || id > 3 : top === "ads" ? id > MIGRATED_MAX.ads : false;
    if (qaOwned) {
      if (!dry) await f.delete().catch(() => undefined);
      removed++;
    }
  }
  console.log(`${dry ? "[dry] would remove" : "removed"} ${removed} QA records/files`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
