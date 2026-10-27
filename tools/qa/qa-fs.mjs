/** Direct Firestore/Auth/Storage access for QA verification + cleanup (service account in /secret). */
import { createRequire } from "node:module";
const require = createRequire("F:/DI_PMS_Project/classify/functions/package.json");
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require("F:/DI_PMS_Project/classify/secret/classiadshub-firebase.json")), storageBucket: "classiadshub.firebasestorage.app" });
}
export const db = admin.firestore();
db.settings({ preferRest: true });
export const auth = admin.auth();
export const bucket = admin.storage().bucket();
export async function doc(col, id) {
  const s = await db.collection(col).doc(String(id)).get();
  return s.exists ? s.data() : null;
}
export async function find(col, field, value) {
  const s = await db.collection(col).where(field, "==", value).get();
  return s.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

/** Hard-delete a QA user and everything that references it (Firestore + Auth + Storage). */
export async function purgeUser(id) {
  id = Number(id);
  const fields = {
    ads: ["user_id"], favorites: ["user_id"], saved_searches: ["user_id"], follows: ["follower_id", "following_id"],
    conversations: ["buyer_id", "seller_id"], offers: ["buyer_id", "seller_id"], ad_sales: ["buyer_id", "seller_id"],
    reviews: ["reviewer_id", "reviewee_id"], reports: ["reporter_id"], notifications: ["user_id"],
    transactions: ["user_id"], subscriptions: ["user_id"], invoices: ["user_id"], verification_requests: ["user_id"],
    job_listings: ["user_id"], job_applications: ["user_id"], user_devices: ["user_id"], user_queries: ["user_id"],
  };
  let n = 0;
  const adIds = (await db.collection("ads").where("user_id", "==", id).get()).docs.map((d) => Number(d.id));
  const convIds = new Set();
  for (const [col, fs] of Object.entries(fields)) {
    for (const f of fs) {
      const snap = await db.collection(col).where(f, "==", id).get();
      for (const d of snap.docs) {
        if (col === "conversations") convIds.add(Number(d.id));
        await d.ref.delete();
        n++;
      }
    }
  }
  for (const adId of adIds) {
    for (const [col, f] of [["favorites", "ad_id"], ["reports", "reportable_id"], ["conversations", "ad_id"], ["reviews", "ad_id"]]) {
      const snap = await db.collection(col).where(f, "==", adId).get();
      for (const d of snap.docs) {
        if (col === "reports" && d.data().reportable_type !== "ad") continue;
        if (col === "conversations") convIds.add(Number(d.id));
        await d.ref.delete();
        n++;
      }
    }
    await bucket.deleteFiles({ prefix: `ads/${adId}/` }).catch(() => undefined);
  }
  for (const c of convIds) {
    const snap = await db.collection("messages").where("conversation_id", "==", c).get();
    for (const d of snap.docs) (await d.ref.delete(), n++);
  }
  const u = (await db.collection("users").doc(String(id)).get()).data();
  for (const p of ["kyc", "receipts", "resumes", "avatars"]) await bucket.deleteFiles({ prefix: `${p}/${id}/` }).catch(() => undefined);
  await auth.deleteUser(String(u?.auth_uid ?? id)).catch(() => undefined);
  await db.collection("users").doc(String(id)).delete();
  return n;
}
