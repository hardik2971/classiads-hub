"use client";

import { useEffect } from "react";

import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { Ad, User } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Container, EmptyState, PageState } from "@/components/ui/misc";
import { AdCardGrid } from "@/components/ad-card";
import { FollowButton } from "@/components/follow-button";
import { ReviewForm } from "@/components/seller/review-form";
import { Avatar } from "@/components/ui/avatar";

interface SellerProfile {
  seller: User;
  followers: number;
  following: number;
  live_ads: number;
  rating_avg: number;
  rating_count: number;
  is_following: boolean;
}

interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  reviewer?: User;
  created_at?: string;
}

export function SellerView() {
  const id = useRouteParam(1);
  const { data: profile, loading } = useApi<SellerProfile>(id ? `/sellers/${id}` : null);
  const ads = useApi<Ad[]>(id ? `/sellers/${id}/ads` : null).data;
  const reviewsApi = useApi<Review[]>(id ? `/sellers/${id}/reviews` : null);
  const reviews = reviewsApi.data;

  useEffect(() => {
    if (profile) document.title = `${profile.seller.name} — Seller Profile · ClassiAds_Hub`;
  }, [profile]);

  if (!profile) return <PageState loading={loading || id === null} title="Seller not found" />;

  const s = profile.seller;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={s.name} src={s.avatar_path} className="h-16 w-16 text-2xl" />
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                {s.name}
                {s.is_verified && <span title="Verified">✔️</span>}
              </h1>
              <p className="text-sm text-muted">
                ⭐ {profile.rating_avg.toFixed(1)} ({profile.rating_count} reviews)
              </p>
            </div>
          </div>
          <FollowButton sellerId={s.id} initialFollowing={profile.is_following} />
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <span><b>{profile.live_ads}</b> <span className="text-muted">Ads</span></span>
          <span><b>{profile.followers}</b> <span className="text-muted">Followers</span></span>
          <span><b>{profile.following}</b> <span className="text-muted">Following</span></span>
        </div>
      </div>

      {/* Ads */}
      <h2 className="mb-4 mt-8 text-lg font-bold">Live Ads</h2>
      {ads && ads.length > 0 ? (
        <AdCardGrid ads={ads} />
      ) : (
        <EmptyState title="No active listings" icon="📭" />
      )}

      {/* Reviews */}
      <div className="mb-4 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Ratings & Reviews</h2>
        <ReviewForm sellerId={s.id} onSubmitted={reviewsApi.reload} />
      </div>
      {reviews && reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
      {reviews && reviews.length > 0 && (
        <>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.reviewer?.name ?? "User"}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-foreground/80">{r.comment}</p>}
                <p className="mt-1 text-xs text-muted">{timeAgo(r.created_at)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
