"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { Container } from "@/components/ui/misc";
import { Button, Spinner } from "@/components/ui/button";

interface Gateway {
  code: string;
  name: string;
  is_manual: boolean;
}

interface FeaturedPlan {
  id: number;
  name: string;
  description?: string | null;
  price_display: string;
  duration_days: number;
}

function CheckoutInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const type = sp.get("type") ?? "subscription"; // subscription | featured
  const title = sp.get("title") ?? "Order";
  const queryPrice = sp.get("price") ?? "";

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selected, setSelected] = useState("");
  const [paying, setPaying] = useState(false);

  // Featured-ad flow: let the user pick a feature plan inline.
  const [plans, setPlans] = useState<FeaturedPlan[]>([]);
  const [planId, setPlanId] = useState<number | null>(
    sp.get("plan_id") ? Number(sp.get("plan_id")) : null,
  );
  const [loadingPlans, setLoadingPlans] = useState(type === "featured");

  useEffect(() => {
    clientApi<Gateway[]>("/payment-gateways")
      .then((r) => {
        if (r.data?.length) {
          setGateways(r.data);
          setSelected(r.data[0].code);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (type !== "featured") return;
    clientApi<FeaturedPlan[]>("/featured-plans")
      .then((r) => {
        setPlans(r.data ?? []);
        if (!planId && r.data?.length) setPlanId(r.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPlan = plans.find((p) => p.id === planId);
  const price = type === "featured" ? selectedPlan?.price_display ?? queryPrice : queryPrice;

  async function pay() {
    setPaying(true);
    try {
      type Started = { transaction: { id: number }; payment?: { status?: string; checkout_url?: string | null } };
      let started: Started;
      if (type === "featured") {
        if (!planId) throw new ApiError("Please choose a feature plan.", 422);
        started = (
          await clientApi<Started>(`/ads/${sp.get("ad_id")}/feature/checkout`, {
            method: "POST",
            body: { plan_id: planId, gateway: selected },
          })
        ).data;
      } else {
        started = (
          await clientApi<Started>("/subscriptions/checkout", {
            method: "POST",
            body: { package_id: Number(sp.get("package_id")), gateway: selected },
          })
        ).data;
      }
      const txnId = started.transaction.id;

      if (started.payment?.status === "completed") {
        router.push("/checkout/result?status=success");
        return;
      }
      // Stripe / Razorpay / PayPal: pay on the gateway's page; it returns to /checkout/result?txn=…
      if (started.payment?.checkout_url) {
        window.location.assign(started.payment.checkout_url);
        return;
      }
      const manual = gateways.find((g) => g.code === selected)?.is_manual;
      if (manual) {
        router.push("/checkout/result?status=pending");
        return;
      }
      await clientApi(`/payments/${txnId}/confirm`, { method: "POST", body: {} });
      router.push("/checkout/result?status=success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Payment failed";
      router.push(`/checkout/result?status=failed&message=${encodeURIComponent(msg)}`);
    } finally {
      setPaying(false);
    }
  }

  return (
    <Container className="max-w-lg py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span className="font-medium">{title}</span>
        {price && <span className="text-lg font-bold text-brand">{price}</span>}
      </div>

      {type === "featured" && (
        <>
          <h2 className="mt-6 mb-2 font-bold">Feature plan</h2>
          {loadingPlans ? (
            <Spinner className="h-6 w-6 text-brand" />
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted">No feature plans available right now.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                    planId === p.id ? "border-brand bg-brand/[0.04]" : "border-border bg-card"
                  }`}
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">{p.duration_days} days featured</span>
                  </span>
                  <span className="font-bold text-brand">{p.price_display}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="mt-6 mb-2 font-bold">Payment method</h2>
      <div className="space-y-2">
        {gateways.map((g) => (
          <button
            key={g.code}
            onClick={() => setSelected(g.code)}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
              selected === g.code ? "border-brand bg-brand/[0.04]" : "border-border bg-card"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{g.is_manual ? "🏦" : "💳"}</span> {g.name}
            </span>
            <span>{selected === g.code ? "●" : "○"}</span>
          </button>
        ))}
      </div>

      <Button
        className="mt-6"
        fullWidth
        loading={paying}
        disabled={!selected || (type === "featured" && !planId)}
        onClick={pay}
      >
        Pay {price}
      </Button>
      <p className="mt-2 text-center text-xs text-muted">
        {gateways.find((g) => g.code === selected)?.is_manual
          ? "You'll get bank details after placing the order."
          : "You'll be taken to a secure payment page to complete your purchase."}
      </p>
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
