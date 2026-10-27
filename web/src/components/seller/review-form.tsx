"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/auth/auth-shell";

/**
 * Leave (or update) a seller review. The API only accepts it from buyers who have chatted
 * with or bought from the seller, and reports that as a validation error.
 */
export function ReviewForm({ sellerId, onSubmitted }: { sellerId: number; onSubmitted?: () => void }) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isAuthenticated || user?.id === sellerId) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await clientApi("/reviews", {
        method: "POST",
        body: { reviewee_id: sellerId, rating, comment: comment || null, type: "seller_review" },
      });
      setMsg("Thanks! Your review was submitted.");
      setOpen(false);
      onSubmitted?.();
    } catch (e) {
      setErr(e instanceof ApiError ? (e.fieldError("reviewee_id") ?? e.message) : "Could not submit review.");
    } finally {
      setBusy(false);
    }
  }

  if (msg) return <p className="text-sm text-green-700">{msg}</p>;
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        ★ Write a review
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-amber-500" : "text-muted"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        className={`${inputClass} h-20 py-2`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>Submit review</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
