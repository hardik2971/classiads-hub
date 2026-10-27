"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { Container } from "@/components/ui/misc";
import { ButtonLink, Spinner } from "@/components/ui/button";

type Status = "success" | "pending" | "failed" | "processing";

function ResultInner() {
  const sp = useSearchParams();
  const txn = sp.get("txn");
  const [status, setStatus] = useState<Status>(txn ? "processing" : ((sp.get("status") as Status) ?? "success"));
  const [message, setMessage] = useState(sp.get("message"));

  // Returning from Stripe / Razorpay / PayPal: the server checks the payment with the gateway.
  useEffect(() => {
    if (!txn) return;
    clientApi<{ status: string }>(`/payments/${txn}/confirm`, {
      method: "POST",
      body: { cancelled: sp.get("cancelled") === "1" },
    })
      .then((r) => {
        const s = r.data?.status;
        setStatus(s === "completed" ? "success" : s === "failed" ? "failed" : "pending");
        if (s === "failed") setMessage(sp.get("cancelled") === "1" ? "Payment was cancelled." : r.message);
        if (s !== "completed" && s !== "failed") setMessage("Your payment is still being processed. We'll activate it as soon as it's confirmed.");
      })
      .catch((e) => {
        setStatus("failed");
        setMessage(e instanceof ApiError ? e.message : "We couldn't verify the payment.");
      });
  }, [txn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "processing") {
    return (
      <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <Spinner className="h-10 w-10 text-brand" />
        <p className="mt-4 text-muted">Confirming your payment…</p>
      </Container>
    );
  }

  const config = {
    success: { icon: "✅", title: "Payment successful", desc: "Your purchase is complete and active." },
    pending: { icon: "⏳", title: "Awaiting confirmation", desc: message ?? "Complete the bank transfer; an admin will confirm it shortly." },
    failed: { icon: "❌", title: "Payment failed", desc: message ?? "Something went wrong. Please try again." },
  }[status] ?? { icon: "✅", title: "Done", desc: "" };

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl">{config.icon}</div>
      <h1 className="mt-4 text-3xl font-extrabold">{config.title}</h1>
      <p className="mt-2 max-w-md text-muted">{config.desc}</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/dashboard/transactions">View transactions</ButtonLink>
        {status === "failed" ? (
          <ButtonLink href="/dashboard/subscriptions" variant="outline">Try again</ButtonLink>
        ) : (
          <ButtonLink href="/dashboard" variant="outline">Go to dashboard</ButtonLink>
        )}
      </div>
    </Container>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultInner />
    </Suspense>
  );
}
