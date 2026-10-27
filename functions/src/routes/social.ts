import { Router, Request } from "express";
import { me, optionalAuth, requireAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { ApiError, boolQ, fail, filled, forbidden, h, intParam, intQ, limitStr, ms, notFound, ok, okPage, strQ, toMinor } from "../lib/http";
import { notify } from "../lib/notify";
import { adsRes, conversationRes, messageRes, offerAmountDisplay, offerRes, notificationRes, reviewRes, userRes } from "../lib/resources";
import { C, Doc, col, docs, first, get, getMany, getOrFail, insert, ref, update } from "../lib/store";
import { fieldError, validate } from "../lib/validate";
import { authUid } from "./auth";
import { bustAds, publishedAds } from "./ads";

export const socialRouter = Router();

// ---------- chat ----------

const participants = (c: Doc) => [c.buyer_id, c.seller_id].map(Number);

async function participantUids(buyerId: number, sellerId: number): Promise<string[]> {
  const users = await getMany(C.users, [buyerId, sellerId]);
  return [buyerId, sellerId].map((id) => (users.get(id) ? authUid(users.get(id)!) : String(id)));
}

async function findOrCreateConversation(ad: Doc, buyerId: number): Promise<Doc> {
  const id = `${ad.id}_${buyerId}`;
  const existing = await first(C.conversations, "key", id);
  if (existing) return existing;
  return insert(C.conversations, {
    key: id,
    ad_id: ad.id,
    buyer_id: buyerId,
    seller_id: Number(ad.user_id),
    participant_uids: await participantUids(buyerId, Number(ad.user_id)),
    last_message: null,
    last_message_at: null,
    buyer_unread: 0,
    seller_unread: 0,
  });
}

async function persistMessage(c: Doc, senderId: number, body: string, type = "text", offerId: number | null = null, attachment: string | null = null): Promise<Doc> {
  const msg = await insert(C.messages, {
    conversation_id: c.id,
    sender_id: senderId,
    body,
    type,
    offer_id: offerId,
    attachment_path: attachment,
    participant_uids: c.participant_uids ?? [],
    read_at: null,
  });
  const isBuyer = senderId === Number(c.buyer_id);
  await update(C.conversations, c.id, {
    last_message: limitStr(body, 140),
    last_message_at: new Date(),
    buyer_unread: isBuyer ? Number(c.buyer_unread ?? 0) : Number(c.buyer_unread ?? 0) + 1,
    seller_unread: isBuyer ? Number(c.seller_unread ?? 0) + 1 : Number(c.seller_unread ?? 0),
  });
  return msg;
}

function assertParticipant(req: Request, c: Doc) {
  if (!participants(c).includes(me(req).id)) throw forbidden("Not a participant.");
}

async function conversationsPayload(list: Doc[], viewerId: number | undefined) {
  const ads = await getMany(C.ads, list.map((c) => c.ad_id));
  const adRes = new Map<number, any>();
  const adList = [...ads.values()];
  (await adsRes(adList, viewerId)).forEach((r, i) => adRes.set(adList[i].id, r));
  const users = await getMany(C.users, list.flatMap(participants));
  return list.map((c) => conversationRes(c, viewerId, adRes.get(Number(c.ad_id)) ?? null, users));
}

export async function conversationMessages(c: Doc, viewerId: number | undefined, newestFirst = true) {
  const msgs = docs(await col(C.messages).where("conversation_id", "==", c.id).get()).sort((a, b) => (newestFirst ? b.id - a.id : a.id - b.id));
  const offers = await getMany(C.offers, msgs.map((m) => m.offer_id));
  return msgs.map((m) => messageRes(m, viewerId, m.offer_id ? offers.get(Number(m.offer_id)) ?? null : null));
}
export { conversationsPayload };

socialRouter.get(
  "/conversations",
  requireAuth,
  h(async (req, res) => {
    const uid = me(req).id;
    const tab = strQ(req, "tab");
    const [asBuyer, asSeller] = await Promise.all([
      tab === "selling" ? [] : docs(await col(C.conversations).where("buyer_id", "==", uid).get()),
      tab === "buying" ? [] : docs(await col(C.conversations).where("seller_id", "==", uid).get()),
    ]);
    const list = [...asBuyer, ...asSeller].sort((a, b) => ms(b.last_message_at ?? b.created_at) - ms(a.last_message_at ?? a.created_at));
    okPage(res, req, await conversationsPayload(list, uid), "Conversations.");
  }),
);

socialRouter.post(
  "/conversations",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { ad_id: "required|integer", message: "nullable|string|max:5000" });
    const ad = await getOrFail(C.ads, d.ad_id, "Ad");
    const buyer = me(req);
    if (Number(ad.user_id) === buyer.id) return fail(res, "You cannot start a conversation on your own ad.", 422);
    let c = await findOrCreateConversation(ad, buyer.id);
    if (d.message) {
      await persistMessage(c, buyer.id, d.message);
      await notify(Number(ad.user_id), "chat.message", "New message", limitStr(d.message, 80), { conversation_id: c.id, ad_id: ad.id });
      c = (await get(C.conversations, c.id))!;
    }
    ok(res, (await conversationsPayload([c], buyer.id))[0], "Conversation ready.", 201);
  }),
);

socialRouter.get(
  "/conversations/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const c = await getOrFail(C.conversations, intParam(req, "id"), "Conversation");
    assertParticipant(req, c);
    const messages = await conversationMessages(c, me(req).id);
    await markRead(c, me(req).id);
    const per = Math.max(1, Math.min(intQ(req, "per_page", 30), 100));
    const page = Math.max(1, intQ(req, "page", 1));
    const slice = messages.slice((page - 1) * per, page * per);
    ok(res, { conversation: (await conversationsPayload([c], me(req).id))[0], messages: slice }, "Conversation.", 200, {
      pagination: { current_page: page, per_page: per, total: messages.length, last_page: Math.max(1, Math.ceil(messages.length / per)), from: slice.length ? (page - 1) * per + 1 : null, to: slice.length ? (page - 1) * per + slice.length : null },
    });
  }),
);

socialRouter.post(
  "/conversations/:id(\\d+)/messages",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { body: "required|string|max:5000" });
    const c = await getOrFail(C.conversations, intParam(req, "id"), "Conversation");
    assertParticipant(req, c);
    const m = await persistMessage(c, me(req).id, d.body);
    const recipient = me(req).id === Number(c.buyer_id) ? Number(c.seller_id) : Number(c.buyer_id);
    await notify(recipient, "chat.message", "New message", limitStr(d.body, 80), { conversation_id: c.id, ad_id: c.ad_id });
    ok(res, messageRes(m, me(req).id, null), "Message sent.", 201);
  }),
);

async function markRead(c: Doc, uid: number) {
  const field = Number(c.buyer_id) === uid ? "buyer_unread" : "seller_unread";
  await update(C.conversations, c.id, { [field]: 0 });
  const unread = docs(await col(C.messages).where("conversation_id", "==", c.id).where("read_at", "==", null).get()).filter((m) => Number(m.sender_id) !== uid);
  const batch = db.batch();
  unread.forEach((m) => batch.update(ref(C.messages, m.id), { read_at: new Date() }));
  if (unread.length) await batch.commit();
}

socialRouter.post(
  "/conversations/:id(\\d+)/read",
  requireAuth,
  h(async (req, res) => {
    const c = await getOrFail(C.conversations, intParam(req, "id"), "Conversation");
    assertParticipant(req, c);
    await markRead(c, me(req).id);
    ok(res, null, "Marked as read.");
  }),
);

// ---------- offers ----------

async function offerMessage(conversationId: number | null, senderId: number, offer: Doc, text: string, type = "offer") {
  if (!conversationId) return;
  const c = await get(C.conversations, conversationId);
  if (c) await persistMessage(c, senderId, text, type, offer.id);
}

socialRouter.get(
  "/offers",
  requireAuth,
  h(async (req, res) => {
    const uid = me(req).id;
    const role = strQ(req, "role");
    const [b, s] = await Promise.all([
      role === "seller" ? [] : docs(await col(C.offers).where("buyer_id", "==", uid).get()),
      role === "buyer" ? [] : docs(await col(C.offers).where("seller_id", "==", uid).get()),
    ]);
    let list = [...b, ...s];
    if (filled(req, "ad_id")) list = list.filter((o) => Number(o.ad_id) === intQ(req, "ad_id"));
    list.sort((a, c) => ms(c.created_at) - ms(a.created_at));
    const ads = await getMany(C.ads, list.map((o) => o.ad_id));
    const adList = [...ads.values()];
    const resMap = new Map<number, any>();
    (await adsRes(adList, uid)).forEach((r, i) => resMap.set(adList[i].id, r));
    okPage(res, req, list.map((o) => offerRes(o, resMap.get(Number(o.ad_id)) ?? null)), "Offers.");
  }),
);

socialRouter.post(
  "/offers",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { ad_id: "required|integer", amount: "required|numeric|min:0|max:999999999", message: "nullable|string|max:500" });
    const ad = await getOrFail(C.ads, d.ad_id, "Ad");
    const buyer = me(req);
    if (Number(ad.user_id) === buyer.id) return fail(res, "You cannot make an offer on your own ad.", 422);
    const c = await findOrCreateConversation(ad, buyer.id);
    const offer = await insert(C.offers, {
      ad_id: ad.id,
      conversation_id: c.id,
      buyer_id: buyer.id,
      seller_id: Number(ad.user_id),
      parent_offer_id: null,
      amount: toMinor(d.amount),
      currency_code: ad.currency_code,
      status: "pending",
      message: d.message ?? null,
    });
    await offerMessage(c.id, buyer.id, offer, `${offerAmountDisplay(offer)} offered`);
    await notify(Number(ad.user_id), "offer.received", "New offer", `${offerAmountDisplay(offer)} on ${ad.title}`, { offer_id: offer.id, ad_id: ad.id });
    ok(res, offerRes(offer, (await adsRes([ad], buyer.id))[0]), "Offer sent.", 201);
  }),
);

async function pendingOffer(req: Request): Promise<Doc> {
  const o = await getOrFail(C.offers, intParam(req, "id"), "Offer");
  return o;
}
const guardPending = (o: Doc) => {
  if (o.status !== "pending") throw new ApiError("This offer is no longer pending.", 422);
};

for (const [action, status, title, verb] of [
  ["accept", "accepted", "Offer accepted", "accepted"],
  ["reject", "rejected", "Offer rejected", "rejected"],
] as const) {
  socialRouter.post(
    `/offers/:id(\\d+)/${action}`,
    requireAuth,
    h(async (req, res) => {
      const o = await pendingOffer(req);
      if (Number(o.seller_id) !== me(req).id) throw forbidden("Only the seller can do this.");
      guardPending(o);
      await update(C.offers, o.id, { status });
      const label = `Offer ${verb}: ${offerAmountDisplay(o)}`;
      await offerMessage(o.conversation_id, Number(o.seller_id), o, label, "system");
      await notify(Number(o.buyer_id), `offer.${status}`, title, `Your offer ${offerAmountDisplay(o)} was ${verb}.`, { offer_id: o.id, ad_id: o.ad_id });
      ok(res, offerRes({ ...o, status }), `${title}.`);
    }),
  );
}

socialRouter.post(
  "/offers/:id(\\d+)/counter",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { amount: "required|numeric|min:0|max:999999999", message: "nullable|string|max:500" });
    const parent = await pendingOffer(req);
    const uid = me(req).id;
    if (![Number(parent.buyer_id), Number(parent.seller_id)].includes(uid)) throw forbidden();
    guardPending(parent);
    await update(C.offers, parent.id, { status: "countered" });
    const counter = await insert(C.offers, {
      ad_id: parent.ad_id,
      conversation_id: parent.conversation_id ?? null,
      buyer_id: parent.buyer_id,
      seller_id: parent.seller_id,
      parent_offer_id: parent.id,
      amount: toMinor(d.amount),
      currency_code: parent.currency_code,
      status: "pending",
      message: d.message ?? null,
      countered_by: uid,
    });
    await offerMessage(parent.conversation_id, uid, counter, `Counter offer: ${offerAmountDisplay(counter)}`);
    const recipient = uid === Number(parent.buyer_id) ? Number(parent.seller_id) : Number(parent.buyer_id);
    await notify(recipient, "offer.countered", "Counter offer", offerAmountDisplay(counter), { offer_id: counter.id, ad_id: counter.ad_id });
    ok(res, offerRes(counter), "Counter offer sent.", 201);
  }),
);

socialRouter.post(
  "/offers/:id(\\d+)/withdraw",
  requireAuth,
  h(async (req, res) => {
    const o = await pendingOffer(req);
    if (Number(o.buyer_id) !== me(req).id) throw forbidden();
    guardPending(o);
    await update(C.offers, o.id, { status: "withdrawn" });
    ok(res, offerRes({ ...o, status: "withdrawn" }), "Offer withdrawn.");
  }),
);

// ---------- follows ----------

socialRouter.post(
  "/sellers/:id(\\d+)/follow",
  requireAuth,
  h(async (req, res) => {
    const target = await getOrFail(C.users, intParam(req, "id"), "User");
    const mine = me(req);
    if (target.id === mine.id) return fail(res, "You cannot follow yourself.", 422);
    const fRef = col(C.follows).doc(`${mine.id}_${target.id}`);
    const exists = (await fRef.get()).exists;
    if (exists) await fRef.delete();
    else {
      await fRef.set({ follower_id: mine.id, following_id: target.id, created_at: new Date() });
      await notify(target.id, "follow.new", "New follower", `${mine.name} started following you.`, { user_id: mine.id });
    }
    ok(res, { user_id: target.id, following: !exists }, exists ? "Unfollowed." : "Now following.");
  }),
);

for (const [path, mineField, otherField, msg] of [
  ["/following", "follower_id", "following_id", "Following."],
  ["/followers", "following_id", "follower_id", "Followers."],
] as const) {
  socialRouter.get(
    path,
    requireAuth,
    h(async (req, res) => {
      const rows = (await col(C.follows).where(mineField, "==", me(req).id).get()).docs.map((d) => d.data());
      const users = await getMany(C.users, rows.map((r) => r[otherField]));
      okPage(res, req, rows.map((r) => userRes(users.get(Number(r[otherField])) ?? null, { contact: false })).filter(Boolean), msg);
    }),
  );
}

// ---------- sellers (public) ----------

socialRouter.get(
  "/sellers/:id(\\d+)",
  optionalAuth,
  h(async (req, res) => {
    const viewer = req.user;
    const seller = await getOrFail(C.users, intParam(req, "id"), "Seller");
    const [followers, following, liveAds] = await Promise.all([
      col(C.follows).where("following_id", "==", seller.id).count().get(),
      col(C.follows).where("follower_id", "==", seller.id).count().get(),
      col(C.ads).where("user_id", "==", seller.id).where("status", "==", "approved").count().get(),
    ]);
    const isFollowing = viewer ? (await col(C.follows).doc(`${viewer.id}_${seller.id}`).get()).exists : false;
    ok(
      res,
      {
        seller: userRes(seller, { seller: true, contact: false }),
        followers: followers.data().count,
        following: following.data().count,
        live_ads: liveAds.data().count,
        rating_avg: Number(seller.seller_profile?.rating_avg ?? 0),
        rating_count: Number(seller.seller_profile?.rating_count ?? 0),
        is_following: isFollowing,
      },
      "Seller profile.",
    );
  }),
);

socialRouter.get(
  "/sellers/:id(\\d+)/ads",
  h(async (req, res) => {
    const id = intParam(req, "id");
    const list = (await publishedAds()).filter((a) => Number(a.user_id) === id).sort((a, b) => ms(b.published_at) - ms(a.published_at));
    okPage(res, req, await adsRes(list), "Seller ads.");
  }),
);

socialRouter.get(
  "/sellers/:id(\\d+)/reviews",
  h(async (req, res) => {
    const id = intParam(req, "id");
    const list = docs(await col(C.reviews).where("reviewee_id", "==", id).get())
      .filter((r) => r.is_approved !== false && r.type === "seller_review")
      .sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const users = await getMany(C.users, list.flatMap((r) => [r.reviewer_id, r.reviewee_id]));
    okPage(res, req, list.map((r) => reviewRes(r, users)), "Seller reviews.");
  }),
);

// ---------- reviews ----------

export async function recomputeSellerRating(sellerId: number) {
  const list = docs(await col(C.reviews).where("reviewee_id", "==", sellerId).get()).filter((r) => r.is_approved !== false && r.type === "seller_review");
  const avg = list.length ? list.reduce((s, r) => s + Number(r.rating ?? 0), 0) / list.length : 0;
  await update(C.users, sellerId, { "seller_profile.rating_avg": Math.round(avg * 100) / 100, "seller_profile.rating_count": list.length });
}

socialRouter.post(
  "/reviews",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { reviewee_id: "required|integer", ad_id: "nullable|integer", rating: "required|integer|min:1|max:5", comment: "nullable|string|max:2000", type: "required|in:seller_review,buyer_review" });
    const reviewer = me(req);
    if (reviewer.id === d.reviewee_id) throw fieldError("reviewee_id", "You cannot review yourself.");
    const reviewee = await get(C.users, d.reviewee_id);
    if (!reviewee) throw fieldError("reviewee_id", "The selected reviewee id is invalid.");

    const sales = docs(await col(C.adSales).where("buyer_id", "==", d.type === "seller_review" ? reviewer.id : d.reviewee_id).get()).filter(
      (s) => Number(s.seller_id) === (d.type === "seller_review" ? d.reviewee_id : reviewer.id) && (!d.ad_id || Number(s.ad_id) === d.ad_id),
    );
    if (d.type === "seller_review") {
      const convos = docs(await col(C.conversations).where("buyer_id", "==", reviewer.id).get()).filter((c) => Number(c.seller_id) === d.reviewee_id && (!d.ad_id || Number(c.ad_id) === d.ad_id));
      if (!convos.length && !sales.length) throw fieldError("reviewee_id", "You can only review sellers you have interacted with.");
    } else if (!sales.length) {
      throw fieldError("reviewee_id", "You can only review confirmed buyers.");
    }

    const key = `${reviewer.id}_${d.reviewee_id}_${d.ad_id ?? 0}`;
    const existing = await first(C.reviews, "key", key);
    const data = { key, reviewer_id: reviewer.id, reviewee_id: d.reviewee_id, ad_id: d.ad_id ?? null, rating: d.rating, comment: d.comment ?? null, type: d.type, is_approved: true };
    const review = existing ? { ...existing, ...data } : await insert(C.reviews, data);
    if (existing) await update(C.reviews, existing.id, data);
    if (d.type === "seller_review") await recomputeSellerRating(d.reviewee_id);
    await notify(d.reviewee_id, "review.received", "New review", `${reviewer.name} left you a ${d.rating}★ review.`, { review_id: review.id });
    const users = await getMany(C.users, [reviewer.id, d.reviewee_id]);
    ok(res, reviewRes(review as Doc, users), "Review submitted.", 201);
  }),
);

for (const [path, field, msg, onlyApproved] of [
  ["/reviews/mine", "reviewer_id", "Reviews given.", false],
  ["/reviews/received", "reviewee_id", "Reviews received.", true],
] as const) {
  socialRouter.get(
    path,
    requireAuth,
    h(async (req, res) => {
      const list = docs(await col(C.reviews).where(field, "==", me(req).id).get())
        .filter((r) => !onlyApproved || r.is_approved !== false)
        .sort((a, b) => ms(b.created_at) - ms(a.created_at));
      const users = await getMany(C.users, list.flatMap((r) => [r.reviewer_id, r.reviewee_id]));
      okPage(res, req, list.map((r) => reviewRes(r, users)), msg);
    }),
  );
}

/** Buyer flags a review they received as abusive (Seller Review Report in admin). */
socialRouter.post(
  "/reviews/:id(\\d+)/report",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { reason: "required|string|max:500" });
    const r = await getOrFail(C.reviews, intParam(req, "id"), "Review");
    if (Number(r.reviewee_id) !== me(req).id) throw forbidden();
    await update(C.reviews, r.id, { report_status: "reported", report_reason: d.reason, reported_at: new Date() });
    ok(res, null, "Review reported.");
  }),
);

socialRouter.get(
  "/ads/:id(\\d+)/potential-buyers",
  requireAuth,
  h(async (req, res) => {
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    if (Number(ad.user_id) !== me(req).id) throw forbidden();
    const [convos, offers] = await Promise.all([col(C.conversations).where("ad_id", "==", ad.id).get(), col(C.offers).where("ad_id", "==", ad.id).get()]);
    const ids = [...new Set([...convos.docs, ...offers.docs].map((d) => Number(d.data().buyer_id)))];
    const users = await getMany(C.users, ids);
    ok(res, ids.map((id) => userRes(users.get(id) ?? null)).filter(Boolean), "Potential buyers.");
  }),
);

socialRouter.post(
  "/ads/:id(\\d+)/confirm-buyer",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { buyer_id: "required|integer" });
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    if (Number(ad.user_id) !== me(req).id) throw forbidden("Only the ad owner can confirm a buyer.");
    if (d.buyer_id === Number(ad.user_id)) return fail(res, "Buyer cannot be the seller.", 422);
    if (!(await get(C.users, d.buyer_id))) throw fieldError("buyer_id", "The selected buyer id is invalid.");
    await col(C.adSales).doc(String(ad.id)).set({ id: ad.id, ad_id: ad.id, seller_id: Number(ad.user_id), buyer_id: d.buyer_id, confirmed_at: new Date(), created_at: new Date() }, { merge: true });
    await update(C.ads, ad.id, { status: "sold", sold_at: new Date(), buyer_id: d.buyer_id });
    bustAds();
    await notify(d.buyer_id, "sale.confirmed", "Purchase confirmed", `You were confirmed as the buyer of "${ad.title}". Leave a review!`, { ad_id: ad.id, seller_id: ad.user_id });
    ok(res, { ad_id: ad.id, buyer_id: d.buyer_id, status: "sold" }, "Buyer confirmed; ad marked sold.");
  }),
);

// ---------- reports ----------

socialRouter.post(
  "/reports",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { type: "required|in:ad,user", id: "required|integer", reason: "required|string|max:150", details: "nullable|string|max:2000" });
    await getOrFail(d.type === "ad" ? C.ads : C.users, d.id, d.type === "ad" ? "Ad" : "User");
    const key = `${me(req).id}_${d.type}_${d.id}`;
    const open = docs(await col(C.reports).where("key", "==", key).get()).find((r) => r.status === "open");
    const report = open ?? (await insert(C.reports, { key, reporter_id: me(req).id, reportable_type: d.type, reportable_id: d.id, reason: d.reason, details: d.details ?? null, status: "open", resolved_at: null }));
    ok(res, { report_id: report.id }, "Report submitted. Thank you.", 201);
  }),
);

// ---------- notifications ----------

async function myNotifications(uid: number) {
  return (await col(C.notifications).where("user_id", "==", uid).get()).docs.map((d) => d.data() as Doc).sort((a, b) => ms(b.created_at) - ms(a.created_at));
}

socialRouter.get(
  "/notifications",
  requireAuth,
  h(async (req, res) => {
    let list = await myNotifications(me(req).id);
    const unread = list.filter((n) => !n.read_at).length;
    if (boolQ(req, "unread")) list = list.filter((n) => !n.read_at);
    okPage(res, req, list.map(notificationRes), "Notifications.", 20, 50, { unread_count: unread });
  }),
);

socialRouter.get(
  "/notifications/unread-count",
  requireAuth,
  h(async (req, res) => {
    const c = await col(C.notifications).where("user_id", "==", me(req).id).where("read_at", "==", null).count().get();
    ok(res, { unread_count: c.data().count }, "Unread count.");
  }),
);

socialRouter.post(
  "/notifications/read-all",
  requireAuth,
  h(async (req, res) => {
    const snap = await col(C.notifications).where("user_id", "==", me(req).id).where("read_at", "==", null).get();
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = db.batch();
      snap.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { read_at: new Date() }));
      await batch.commit();
    }
    ok(res, null, "All marked as read.");
  }),
);

socialRouter.post(
  "/notifications/:id/read",
  requireAuth,
  h(async (req, res) => {
    const r = col(C.notifications).doc(String(req.params.id));
    const s = await r.get();
    if (!s.exists || Number(s.data()?.user_id) !== me(req).id) throw notFound("Notification");
    await r.update({ read_at: new Date() });
    ok(res, null, "Marked as read.");
  }),
);
