import { Router } from "express";
import { me, requireAuth } from "../lib/auth";
import { ApiError, addDays, fail, filled, forbidden, h, intParam, money, ms, notFound, ok, okPage, randomStr, strQ } from "../lib/http";
import { assertImage, storeFile } from "../lib/media";
import { fileFor, multipart } from "../lib/multipart";
import { notify } from "../lib/notify";
import { HOSTED_GATEWAYS, startHosted, verifyHosted } from "../lib/payments";
import { adsRes, invoiceRes, subscriptionIsLive, subscriptionRes, txnRes } from "../lib/resources";
import { setting } from "../lib/settings";
import { C, Doc, col, docs, first, get, getMany, getOrFail, inc, insert, ref, update } from "../lib/store";
import { fieldError, validate } from "../lib/validate";

export const billingRouter = Router();

// ---------- subscriptions quota ----------

export async function resolveSubscriptionForPosting(user: Doc, categoryId: number): Promise<Doc | null> {
  // Posting needs a package when subscriptions are required or free listing is switched off.
  const required = (await setting("ads", "require_subscription", false)) || (await setting("ads", "free_ad_listing", true)) === false;
  if (!required) return null;
  const subs = docs(await col(C.subscriptions).where("user_id", "==", user.id).where("status", "==", "active").get()).filter(subscriptionIsLive);
  const pkgs = await getMany(C.packages, subs.map((s) => s.package_id));
  for (const s of subs) {
    const p = pkgs.get(Number(s.package_id));
    const cats: number[] = (p?.category_ids ?? []).map(Number);
    const covers = !cats.length || cats.includes(categoryId);
    const hasQuota = s.is_unlimited || Number(s.ads_used ?? 0) < Number(s.ad_limit ?? 0);
    if (covers && hasQuota) return s;
  }
  throw new ApiError("An active subscription with remaining quota is required to post in this category.", 422, {
    subscription: ["An active subscription with remaining quota is required to post in this category."],
  });
}

export async function consumeQuota(sub: Doc | null) {
  if (sub && !sub.is_unlimited) await ref(C.subscriptions, sub.id).update({ ads_used: inc() });
}

// ---------- payment gateways ----------

async function gateway(code: string): Promise<Doc> {
  const g = await first(C.paymentGateways, "code", code);
  if (!g || g.is_active === false) throw new ApiError(`Payment gateway [${code}] is not available.`, 422);
  return g;
}

/** Start the gateway flow for a pending transaction (hosted Stripe/Razorpay/PayPal, sandbox, manual bank transfer). */
async function initiate(t: Doc, g: Doc): Promise<Record<string, unknown>> {
  if (g.code === "sandbox") {
    const reference = `sbx_${randomStr(20)}`;
    await update(C.transactions, t.id, { gateway_reference: reference, status: "pending" });
    return { status: "pending", requires_action: true, reference, checkout_url: null, message: "Sandbox checkout — confirm the payment to capture." };
  }
  if (g.code === "bank_transfer" || g.is_manual) {
    const reference = `bt_${randomStr(10, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789")}`;
    await update(C.transactions, t.id, { gateway_reference: reference, status: "pending" });
    const instructions = g.config?.instructions ?? "Transfer the amount to the marketplace bank account and quote your reference.";
    return {
      status: "pending",
      requires_action: true,
      reference,
      checkout_url: null,
      instructions: `${instructions} (Ref: ${reference})`,
      bank_details: g.config?.bank_details ?? null,
      message: "Awaiting manual confirmation by an administrator.",
    };
  }
  if (HOSTED_GATEWAYS.includes(g.code)) {
    const { reference, checkout_url } = await startHosted(t, g);
    await update(C.transactions, t.id, { gateway_reference: reference, status: "pending" });
    return { status: "pending", requires_action: true, reference, checkout_url, message: `Redirecting to ${g.name ?? g.code}…` };
  }
  if (!g.config || !Object.keys(g.config).length) throw new ApiError(`${g.name ?? g.code} is not configured.`, 422);
  throw new ApiError(`${g.name ?? g.code} live integration is not enabled yet.`, 422);
}

async function withTax(amount: number): Promise<[number, number]> {
  const pct = Number(await setting("commerce", "tax_percent", 0));
  const tax = Math.round((amount * pct) / 100);
  return [tax, amount + tax];
}

// ---------- fulfilment (shared with admin) ----------

export async function fulfil(t: Doc): Promise<Doc> {
  if (t.status === "completed") return t;
  await update(C.transactions, t.id, { status: "completed", paid_at: new Date() });

  if (t.type === "subscription") {
    const sub = await first(C.subscriptions, "transaction_id", t.id);
    const pkg = await get(C.packages, t.package_id);
    if (sub && pkg) {
      await update(C.subscriptions, sub.id, {
        status: "active",
        starts_at: new Date(),
        ends_at: pkg.duration_days ? addDays(Number(pkg.duration_days)).toDate() : null,
        ad_limit: pkg.is_unlimited ? null : pkg.ad_limit ?? null,
        is_unlimited: !!pkg.is_unlimited,
        ads_used: 0,
      });
    }
  } else if (t.type === "featured_ad") {
    const ad = await get(C.ads, t.ad_id);
    const plan = await get(C.featuredAdPlans, t.featured_ad_plan_id);
    if (ad && plan) {
      const base = ad.featured_until && ms(ad.featured_until) > Date.now() ? new Date(ms(ad.featured_until)) : new Date();
      await update(C.ads, ad.id, { is_featured: true, featured_until: addDays(Number(plan.duration_days), base).toDate() });
    }
  }

  let invoice = await first(C.invoices, "transaction_id", t.id);
  if (!invoice) {
    const d = new Date();
    const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
    invoice = await insert(C.invoices, {
      transaction_id: t.id,
      user_id: t.user_id,
      number: `INV-${stamp}-${String(t.id).padStart(6, "0")}`,
      subtotal: t.amount,
      tax_amount: t.tax_amount,
      total: t.total,
      currency_code: t.currency_code,
      status: "paid",
      issued_at: new Date(),
    });
  }
  await notify(t.user_id, "payment.completed", "Payment successful", `${money(t.total, t.currency_code)} — ${String(t.type).replace(/_/g, " ")}`, {
    transaction_id: t.id,
    invoice_number: invoice.number,
  });
  return (await get(C.transactions, t.id))!;
}

export async function failTxn(t: Doc): Promise<Doc> {
  if (t.status !== "completed") await update(C.transactions, t.id, { status: "failed" });
  return (await get(C.transactions, t.id))!;
}

export async function refund(t: Doc): Promise<Doc> {
  await update(C.transactions, t.id, { status: "refunded" });
  const inv = await first(C.invoices, "transaction_id", t.id);
  if (inv) await update(C.invoices, inv.id, { status: "refunded" });
  if (t.type === "subscription") {
    const sub = await first(C.subscriptions, "transaction_id", t.id);
    if (sub) await update(C.subscriptions, sub.id, { status: "cancelled" });
  } else if (t.type === "featured_ad" && t.ad_id) {
    await update(C.ads, t.ad_id, { is_featured: false, featured_until: null });
  }
  await notify(t.user_id, "payment.refunded", "Payment refunded", `${money(t.total, t.currency_code)} has been refunded.`, { transaction_id: t.id });
  return (await get(C.transactions, t.id))!;
}

export async function txnWithRelations(t: Doc, viewerId?: number, withUser = false) {
  const [pkg, ad, invoice, user] = await Promise.all([
    t.package_id ? get(C.packages, t.package_id) : Promise.resolve(null),
    t.ad_id ? get(C.ads, t.ad_id) : Promise.resolve(null),
    first(C.invoices, "transaction_id", t.id),
    withUser ? get(C.users, t.user_id) : Promise.resolve(undefined),
  ]);
  return txnRes(t, { pkg, ad: ad ? (await adsRes([ad], viewerId))[0] : null, invoice, ...(withUser ? { user: user ?? null } : {}) });
}

// ---------- user endpoints ----------

billingRouter.get(
  "/subscriptions",
  requireAuth,
  h(async (req, res) => {
    const subs = docs(await col(C.subscriptions).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const pkgs = await getMany(C.packages, subs.map((s) => s.package_id));
    ok(res, subs.map((s) => subscriptionRes(s, pkgs.get(Number(s.package_id)) ?? null)), "Subscriptions.");
  }),
);

billingRouter.get(
  "/subscriptions/active",
  requireAuth,
  h(async (req, res) => {
    const subs = docs(await col(C.subscriptions).where("user_id", "==", me(req).id).where("status", "==", "active").get())
      .filter(subscriptionIsLive)
      .sort((a, b) => ms(b.created_at) - ms(a.created_at));
    const s = subs[0];
    if (!s) return ok(res, null, "No active subscription.");
    ok(res, subscriptionRes(s, await get(C.packages, s.package_id)), "Active subscription.");
  }),
);

billingRouter.post(
  "/subscriptions/checkout",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { package_id: "required|integer", gateway: "required|string|max:50" });
    const pkg = await get(C.packages, d.package_id);
    if (!pkg || pkg.is_active === false) throw notFound("Package");
    let g: Doc;
    try {
      g = await gateway(d.gateway);
    } catch (e: any) {
      return fail(res, e.message, 422);
    }
    const [tax, total] = await withTax(Number(pkg.final_price ?? 0));
    const t = await insert(C.transactions, {
      user_id: me(req).id,
      type: "subscription",
      package_id: pkg.id,
      gateway: g.code,
      amount: Number(pkg.final_price ?? 0),
      tax_amount: tax,
      total,
      currency_code: pkg.currency_code,
      status: "pending",
    });
    const sub = await insert(C.subscriptions, {
      user_id: me(req).id,
      package_id: pkg.id,
      transaction_id: t.id,
      status: "pending",
      ad_limit: pkg.is_unlimited ? null : pkg.ad_limit ?? null,
      is_unlimited: !!pkg.is_unlimited,
      ads_used: 0,
    });
    let payment: Record<string, unknown>;
    try {
      payment = await initiate(t, g);
    } catch (e: any) {
      await update(C.transactions, t.id, { status: "failed" });
      return fail(res, e.message, 422);
    }
    // Free packages complete immediately.
    if (total === 0) {
      const done = await fulfil((await get(C.transactions, t.id))!);
      return ok(res, { transaction: txnRes(done), subscription: subscriptionRes((await get(C.subscriptions, sub.id))!, pkg), payment: { status: "completed", requires_action: false } }, "Subscription activated.", 201);
    }
    ok(res, { transaction: txnRes((await get(C.transactions, t.id))!), subscription: subscriptionRes(sub, pkg), payment }, "Checkout started.", 201);
  }),
);

billingRouter.post(
  "/ads/:id(\\d+)/feature/checkout",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { plan_id: "required|integer", gateway: "required|string|max:50" });
    const ad = await getOrFail(C.ads, intParam(req, "id"), "Ad");
    if (Number(ad.user_id) !== me(req).id) throw forbidden("You can only feature your own ads.");
    const plan = await get(C.featuredAdPlans, d.plan_id);
    if (!plan || plan.is_active === false) throw notFound("Plan");
    let g: Doc;
    try {
      g = await gateway(d.gateway);
    } catch (e: any) {
      return fail(res, e.message, 422);
    }
    const [tax, total] = await withTax(Number(plan.price ?? 0));
    const t = await insert(C.transactions, {
      user_id: me(req).id,
      type: "featured_ad",
      ad_id: ad.id,
      featured_ad_plan_id: plan.id,
      gateway: g.code,
      amount: Number(plan.price ?? 0),
      tax_amount: tax,
      total,
      currency_code: plan.currency_code,
      status: "pending",
    });
    let payment: Record<string, unknown>;
    try {
      payment = await initiate(t, g);
    } catch (e: any) {
      await update(C.transactions, t.id, { status: "failed" });
      return fail(res, e.message, 422);
    }
    ok(res, { transaction: txnRes((await get(C.transactions, t.id))!), payment }, "Checkout started.", 201);
  }),
);

billingRouter.post(
  "/payments/:id(\\d+)/confirm",
  requireAuth,
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (Number(t.user_id) !== me(req).id) throw forbidden();
    if (t.status === "completed") return ok(res, await txnWithRelations(t, me(req).id), "Already completed.");
    if (t.status !== "pending") return fail(res, "Transaction is not payable.", 422);
    const g = await first(C.paymentGateways, "code", t.gateway);
    if (g?.is_manual) return fail(res, "This payment must be confirmed by an administrator.", 422);
    if (HOSTED_GATEWAYS.includes(t.gateway)) {
      // Ask the gateway; a cancelled return with nothing paid fails the transaction.
      const state = await verifyHosted(t);
      const cancelled = String(req.body?.cancelled ?? "") === "1" || req.body?.cancelled === true;
      const after = state === "completed" ? await fulfil(t) : state === "failed" || cancelled ? await failTxn(t) : t;
      const msg = state === "completed" ? "Payment successful." : after.status === "failed" ? "Payment failed." : "Payment is still processing.";
      return ok(res, await txnWithRelations(after, me(req).id), msg);
    }
    const success = String(req.body?.simulate ?? "success") !== "fail" && t.gateway === "sandbox";
    const after = success ? await fulfil(t) : await failTxn(t);
    ok(res, await txnWithRelations(after, me(req).id), success ? "Payment successful." : "Payment failed.");
  }),
);

/** Upload a bank-transfer receipt for admin review. */
billingRouter.post(
  "/payments/:id(\\d+)/receipt",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (Number(t.user_id) !== me(req).id) throw forbidden();
    if (t.status !== "pending") return fail(res, "Transaction is not awaiting payment.", 422);
    const f = fileFor(req, "receipt");
    if (!f) throw fieldError("receipt", "The receipt field is required.");
    try {
      assertImage(f, "receipt");
    } catch (e: any) {
      throw fieldError("receipt", e.message);
    }
    const path = await storeFile(f, `receipts/${t.user_id}`);
    await update(C.transactions, t.id, { receipt_path: path, status: "pending", payment_status: "under_review" });
    ok(res, await txnWithRelations((await get(C.transactions, t.id))!, me(req).id), "Receipt uploaded. We'll confirm your payment shortly.");
  }),
);

billingRouter.get(
  "/payments/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const t = await getOrFail(C.transactions, intParam(req, "id"), "Transaction");
    if (Number(t.user_id) !== me(req).id) throw forbidden();
    ok(res, await txnWithRelations(t, me(req).id), "Transaction.");
  }),
);

billingRouter.get(
  "/transactions",
  requireAuth,
  h(async (req, res) => {
    let list = docs(await col(C.transactions).where("user_id", "==", me(req).id).get());
    if (filled(req, "status")) list = list.filter((t) => t.status === strQ(req, "status"));
    list.sort((a, b) => ms(b.created_at) - ms(a.created_at));
    okPage(res, req, await Promise.all(list.map((t) => txnWithRelations(t, me(req).id))), "Transactions.");
  }),
);

billingRouter.get(
  "/invoices",
  requireAuth,
  h(async (req, res) => {
    const list = docs(await col(C.invoices).where("user_id", "==", me(req).id).get()).sort((a, b) => ms(b.created_at) - ms(a.created_at));
    okPage(res, req, list.map(invoiceRes), "Invoices.");
  }),
);

billingRouter.get(
  "/invoices/:id(\\d+)",
  requireAuth,
  h(async (req, res) => {
    const inv = await get(C.invoices, intParam(req, "id"));
    if (!inv || Number(inv.user_id) !== me(req).id) throw notFound("Invoice");
    ok(res, invoiceRes(inv), "Invoice.");
  }),
);

/** Public gateway webhook (sandbox: { transaction_id | reference, status }). */
billingRouter.post(
  "/webhooks/payments/:gateway",
  h(async (req, res) => {
    const g = await first(C.paymentGateways, "code", req.params.gateway);
    if (!g) return fail(res, "Unknown gateway.", 404);
    if (g.code !== "sandbox") return fail(res, "Unhandled webhook.", 422);
    const body = req.body ?? {};
    const t = (body.transaction_id ? await get(C.transactions, body.transaction_id) : null) ?? (body.reference ? await first(C.transactions, "gateway_reference", body.reference) : null);
    if (!t) return fail(res, "Transaction not found.", 404);
    const status = String(body.status ?? "completed");
    if (status === "completed") await fulfil(t);
    else if (status === "failed") await failTxn(t);
    ok(res, { status: (await get(C.transactions, t.id))!.status }, "Webhook processed.");
  }),
);


/** Settle hosted payments whose buyer never came back to /checkout/result (run by housekeeping). */
export async function reconcileHostedPayments(): Promise<number> {
  const since = new Date(Date.now() - 2 * 86400_000);
  const pending = docs(await col(C.transactions).where("status", "==", "pending").get()).filter(
    (t) => HOSTED_GATEWAYS.includes(t.gateway) && t.gateway_reference && ms(t.created_at) >= since.getTime(),
  );
  let settled = 0;
  for (const t of pending) {
    const state = await verifyHosted(t).catch(() => "pending" as const);
    if (state === "completed") await fulfil(t);
    else if (state === "failed") await failTxn(t);
    if (state !== "pending") settled++;
  }
  return settled;
}
