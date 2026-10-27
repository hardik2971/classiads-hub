import { logger } from "firebase-functions";
import { db } from "../lib/firebase";
import { notify } from "../lib/notify";
import { C, col } from "../lib/store";

/** Expire ads, featured flags and subscriptions whose end date has passed. */
export async function expireStale(): Promise<void> {
  const now = new Date();
  let expiredAds = 0;
  let unfeatured = 0;
  let expiredSubs = 0;

  const approved = await col(C.ads).where("status", "==", "approved").where("expires_at", "<=", now).get();
  for (const d of approved.docs) {
    await d.ref.update({ status: "expired", updated_at: now });
    expiredAds++;
    const a = d.data();
    await notify(Number(a.user_id), "ad.expired", "Ad expired", `"${a.title}" has expired. Renew it to keep it live.`, { ad_id: Number(d.id) }).catch(() => undefined);
  }

  const featured = await col(C.ads).where("is_featured", "==", true).where("featured_until", "<=", now).get();
  const batch = db.batch();
  featured.docs.forEach((d) => {
    batch.update(d.ref, { is_featured: false, featured_until: null, updated_at: now });
    unfeatured++;
  });

  const subs = await col(C.subscriptions).where("status", "==", "active").where("ends_at", "<=", now).get();
  subs.docs.forEach((d) => {
    batch.update(d.ref, { status: "expired", updated_at: now });
    expiredSubs++;
  });
  if (unfeatured || expiredSubs) await batch.commit();

  logger.info("housekeeping", { expiredAds, unfeatured, expiredSubs });
}
