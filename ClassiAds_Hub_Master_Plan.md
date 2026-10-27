# ClassiAds_Hub — Master Production Implementation Plan

> **Status:** Planning (greenfield)
> **Last updated:** 2026-05-25
> **Approach:** Backend/API-first · Large team (8+ devs, parallel squads)
> **Source of truth for requirements:** `ClassiAds_Hub_implementation.txt`

This document is the single master plan. It (1) restates the product cleanly, (2) defines architecture and the data model, (3) inventories **every** screen across Mobile/Web/Admin and **flags pages missing from the original spec**, and (4) lays out a phase-wise, parallelized production roadmap with explicit interface contracts between squads.

Legend used in inventories:
- ✅ **Spec'd** — described in the requirements document.
- 🆕 **Missing/Added** — required for a production marketplace but not in the original spec.

---

## 1. Product Overview (cleaned)

**ClassiAds_Hub** is a multi-vendor classifieds / buy-and-sell marketplace (in the OLX / Dubizzle / Kijiji class) delivered as three coordinated clients over one backend:

| Layer | Technology | Primary purpose |
|---|---|---|
| Backend + Admin | Laravel (PHP 8.2+), MySQL | REST API, business logic, admin control panel |
| Mobile apps | Flutter 3.38.3 (Android + iOS) | Native-like buyer/seller experience |
| Web frontend | Next.js (React) | SEO-friendly public marketplace + user dashboard |

**Core value pillars**
- **Multi-vendor & scalable:** unlimited independent sellers, nested categories, custom fields per category.
- **Monetization:** category-based subscription packages, featured/premium ads, AdMob (banner/interstitial/native).
- **Discovery:** location-based (Google Maps/Places), advanced search & filters, featured sections.
- **Trust & engagement:** real-time chat + offers, follow sellers, ratings/reviews, verified badges, bookmarks.
- **Reach & content:** multi-language (with RTL), multi-currency, blog/CMS, dynamic SEO (metadata, structured data, sitemaps), push notifications (FCM), multi-provider OTP/SMS.

**Integrations (configurable per region):**
Payments — Stripe, PayPal, Razorpay, Paystack, PhonePe, Flutterwave, PayTabs, DPO, Bank Transfer · OTP/SMS — Firebase, Twilio, 2Factor · Maps — Google Maps & Places · Push — Firebase Cloud Messaging · AI (optional) — Google Gemini · Storage (optional) — AWS S3 · Ads — Google AdMob.

**Baseline hosting:** Nginx/Apache, 2 vCPU / 2 GB RAM / 20+ GB disk (production should scale beyond this — see §6 & §10).

---

## 2. System Architecture

### 2.1 Component map

```
                 ┌─────────────────────────────────────────────┐
                 │             Laravel Backend                  │
                 │  ┌────────────┐   ┌──────────────────────┐   │
   Flutter  ───► │  │ REST API   │   │ Admin Panel (Blade/  │   │
   (iOS/And)     │  │ (versioned)│   │ Filament/Vue)        │   │
   Next.js  ───► │  └─────┬──────┘   └──────────────────────┘   │
                 │        │                                      │
                 │  ┌─────▼───────┐  Queue (Redis) · Scheduler   │
                 │  │ Services /  │  · Events · Jobs (mail, push,│
                 │  │ Domain      │    watermark, sitemap, etc.) │
                 │  └─────┬───────┘                              │
                 └────────┼─────────────────────────────────────┘
                          │
            ┌─────────────┼───────────────┬───────────────┐
            ▼             ▼               ▼               ▼
        MySQL         Redis         S3 / local       3rd-party
       (primary)   (cache/queue)   media + CDN     (Stripe, FCM,
                                                    Twilio, Maps,
                                                    Gemini, AdMob)
```

### 2.2 API-first contract approach (critical for a large team)

Because mobile, web, admin, and backend squads work in parallel, the **API contract is the synchronization point**, authored before feature code:

1. **OpenAPI 3.1 spec** is the single source of truth for every endpoint (request/response schemas, auth scopes, error envelope).
2. A **mock server** is generated from the spec (e.g., Prism/Stoplight) so Mobile & Web build against realistic responses on day one — no waiting for backend.
3. Backend implements endpoints to match the spec; **contract tests** (Spectator/Dredd) prevent drift.
4. Versioned routes: `/api/v1/...`. Breaking changes → `/api/v2`.
5. Standard envelope for all responses:
   ```json
   { "success": true, "data": {}, "message": "", "meta": { "pagination": {} }, "errors": null }
   ```
6. Auth: **Laravel Sanctum** (token) for app/web clients; admin uses session/guarded routes. RBAC via roles & permissions (spatie/laravel-permission).

### 2.3 Repository & environment strategy

- **Polyrepo** (recommended for clear squad ownership): `classiads-backend`, `classiads-mobile`, `classiads-web`, plus a shared `classiads-api-contract` repo (OpenAPI + generated client SDKs).
- Generate typed clients from OpenAPI: Dart client for Flutter, TypeScript client for Next.js — eliminates hand-written DTO drift.
- Environments: **local → dev → staging → production**, each with isolated DB, storage bucket, payment sandbox keys, FCM project.
- CI/CD per repo: lint → test → build → deploy. Mobile uses Fastlane for store builds; backend uses zero-downtime deploy (e.g., Deployer/Envoyer).

---

## 3. Domain & Data Model (core entities)

High-level entity groups (full schema is a Phase 0 deliverable / ERD):

**Identity & access**
- `users` (role: customer/seller/staff/admin), `seller_profiles`, `roles`, `permissions`, `role_user`, `user_devices` (FCM tokens), `verification_requests` (KYC), `social_accounts`.

**Catalog & listings**
- `categories` (self-referencing parent_id, nested), `custom_fields`, `custom_field_options`, `category_custom_field`, `ads` (listings), `ad_images`, `ad_custom_field_values`, `ad_slugs`, `favorites`, `saved_searches`.

**Geography & localization**
- `countries`, `states`, `cities`, `languages`, `translations`, `currencies`, `currency_rates`.

**Engagement**
- `conversations`, `messages`, `offers`, `follows`, `reviews` (seller↔buyer), `reports` (reported ads/users), `notifications`.

**Monetization**
- `packages` (subscription plans), `package_category` (category-based), `subscriptions`, `transactions`, `invoices`, `payment_gateways` (config), `featured_ads`, `admob_settings`.

**Content & system**
- `blog_posts`, `blog_categories`, `pages` (CMS: about/terms/privacy/contact), `sliders`, `featured_sections`, `seo_meta`, `settings` (key/value), `email_templates`, `jobs` + `job_applications` (job-category listings), `audit_logs`, `system_status`.

> **Note on "Jobs":** the spec's web sidebar lists "Job Applications," implying a Jobs vertical (apply-to-listing flow). Treated as a first-class category type with an application sub-flow (Phase 5).

---

## 4. Complete Screen / Page Inventory

### 4.1 Mobile App (Flutter)

| # | Screen | Status | Notes |
|---|---|---|---|
| 1 | Splash | 🆕 | Branding, version/force-update check, session bootstrap |
| 2 | Onboarding / intro carousel | 🆕 | First-run value props, location/notification priming |
| 3 | Login (email/phone, Google, Apple, email) | ✅ | "Multiple Login Options" |
| 4 | Register / Create account | 🆕 | Implied by "Create account" link |
| 5 | OTP verification | 🆕 | Firebase/Twilio/2Factor flow |
| 6 | Forgot / reset password | 🆕 | Standard auth recovery |
| 7 | Home dashboard (location, search, banners, categories, featured sections) | ✅ | "Dynamic Home Layout" |
| 8 | Category browse / subcategory drill-down | 🆕 | Nested category navigation |
| 9 | Search results + advanced filters | 🆕 | Category/price/location/custom-field filters; sort |
| 10 | Map / nearby ads (KM radius) | 🆕 | "Nearby Ads with KM Range" needs a map screen |
| 11 | Ad detail (gallery, specs, seller, map, related, report) | ✅ | "Explore Ad Detail Screen" |
| 12 | Full-screen image gallery | 🆕 | Pinch/zoom viewer |
| 13 | Post ad — multi-step (category → details → extra/custom fields → images → location) | ✅ | "Effortless Ad Listings" |
| 14 | Edit ad | 🆕 | Manage existing listings |
| 15 | My Ads (active/pending/sold/expired, renew, boost, mark sold) | 🆕 | Implied by profile "Ads/Listings" |
| 16 | Make an Offer flow | 🆕 | "Make an Offer" button needs a flow |
| 17 | Chat list (Selling / Buying tabs, by product) | ✅ | "Track Chats by Product" |
| 18 | Chat conversation (product card, negotiation, offers) | ✅ | "Live Chat" |
| 19 | Seller public profile (live ads, ratings, follow) | ✅ | "Follow Your Favorite Sellers" |
| 20 | Followers / Following lists | ✅ | Tabs shown in spec |
| 21 | Write/submit review (rate seller) | 🆕 | "Seller-Buyer Review System" popup |
| 22 | "Who bought?" buyer confirmation (seller side) | 🆕 | Review verification step |
| 23 | Report ad form | 🆕 | "Report this ad" needs a form |
| 24 | Favorites / bookmarks grid | ✅ | "Saved Favorites" |
| 25 | Notifications list | ✅ | "Instant Notifications" |
| 26 | Profile (view/edit) | ✅ | "Personalized Profile" |
| 27 | Subscription plans (category-based) | ✅ | "Category Based Subscription" |
| 28 | Checkout / payment method selection | 🆕 | Needed for subscriptions & featured ads |
| 29 | Payment success / failure | 🆕 | Result screens |
| 30 | Transactions / invoices / receipts | 🆕 | "Transactions" in profile menu |
| 31 | Verification (KYC submission, get verified badge) | 🆕 | "Verified User Badge" needs a submit flow |
| 32 | Saved searches / alerts | 🆕 | Re-run searches, notify on new matches |
| 33 | Settings (language, currency, theme, notif prefs) | 🆕 | Multi-language/currency need UI |
| 34 | Blog list | ✅ | "Blog Module" |
| 35 | Blog detail | ✅ | "Blog Module" |
| 36 | Static pages: About / Terms / Privacy / Contact | 🆕 | Backed by CMS |
| 37 | Job listing + apply (job category) | 🆕 | Implied by "Job Applications" |
| 38 | Delete account flow | 🆕 | "Delete Account" in menu (+ store compliance) |
| 39 | Global states: empty / error / offline / loading skeletons | 🆕 | Production polish |
| 40 | AdMob placements (banner/interstitial/native) | ✅ | Cross-cutting, not a standalone screen |

### 4.2 Web Frontend (Next.js)

| # | Page | Status | Notes |
|---|---|---|---|
| 1 | Home (modernized) | ✅ | "Modernized Home Screen" |
| 2 | Smart search by category (results + filter sidebar) | ✅ | "Smart Search by Category" |
| 3 | **Ad detail page (SEO, structured data)** | 🆕 | Critical SEO page — not described for web |
| 4 | **Category landing pages (SEO)** | 🆕 | Per-category indexable pages |
| 5 | Seller public profile page | 🆕 | Web equivalent of mobile seller profile |
| 6 | Login modal | ✅ | "Flexible Login Options" |
| 7 | Register page + OTP | 🆕 | Onboarding |
| 8 | Forgot / reset password | 🆕 | Auth recovery |
| 9 | Post ad (multi-step) | ✅ | "Effortless Ad Listings" |
| 10 | Edit ad | 🆕 | Listing management |
| 11 | My Ads management | 🆕 | Dashboard section |
| 12 | Favorites | ✅ | "Saved Favorites" |
| 13 | Notifications | ✅ | "Instant Notifications" |
| 14 | Chat (list + window) | ✅ | "Live Chat Seller and Buyer" |
| 15 | Profile / Edit profile | ✅ | "Personalized Profile" |
| 16 | Subscription (category-based) | ✅ | Web subscription page |
| 17 | Checkout + payment + success/failure | 🆕 | Web payment flow |
| 18 | Transactions / invoices | 🆕 | "Transactions" in sidebar |
| 19 | Reviews (given/received) | 🆕 | "Reviews" in sidebar |
| 20 | Job applications | 🆕 | "Job Applications" in sidebar |
| 21 | Verification / KYC | 🆕 | Verified badge flow |
| 22 | Blog list (SEO) | 🆕 | Spec shows blog on mobile; web needs it for SEO |
| 23 | Blog detail (SEO) | 🆕 | Indexable articles |
| 24 | Static pages: About/Terms/Privacy/Contact/FAQ | 🆕 | CMS-driven |
| 25 | 404 / 500 / error boundaries | 🆕 | Required |
| 26 | sitemap.xml / robots.txt / structured data | 🆕 | "Dynamic SEO Management" |

### 4.3 Admin Panel (Laravel)

| # | Screen | Status | Notes |
|---|---|---|---|
| 1 | Admin login (+ 2FA) | 🆕 | Secure admin auth |
| 2 | Insightful dashboard (KPIs, featured sections, geo map) | ✅ | "Insightful Dashboard" |
| 3 | Category management (nested, reorder, custom fields) | ✅ | "Category Management" |
| 4 | Custom field management | ✅ | "Custom Field Management" |
| 5 | Item / ad approval (moderation) | ✅ | "Item Approval" |
| 6 | Package management (subscription plans) | ✅ | "Package Management" |
| 7 | Slider / banner management | ✅ | "Slider Management" |
| 8 | Featured section management | ✅ | "Featured Section Management" |
| 9 | Staff management (RBAC) | ✅ | "Staff Management" |
| 10 | Roles & permissions detail | 🆕 | Implied by role-based staff |
| 11 | **Customer/user management** | 🆕 | Sidebar "Users & Roles" — manage end users |
| 12 | **Seller management** | 🆕 | Sidebar "Seller Management" — not detailed |
| 13 | **Chat moderation** | 🆕 | Sidebar "Chats" — not detailed |
| 14 | **Reports management** (reported ads/users) | 🆕 | Sidebar "Reports" — not detailed |
| 15 | **Reviews & ratings moderation** | 🆕 | Trust/safety |
| 16 | **Subscriptions / orders management** | 🆕 | View/manage active subscriptions |
| 17 | **Transactions & invoices** | 🆕 | Payment records, refunds |
| 18 | Multilingual / language management | ✅ | "Multilingual Support" |
| 19 | Push notification system | ✅ | "Push Notification System" |
| 20 | **Location management** (countries/states/cities) | 🆕 | Sidebar "Location" — not detailed |
| 21 | **Currency management** (multi-currency + rates) | 🆕 | "Multi-Currency Support" |
| 22 | **Verification / KYC requests** | 🆕 | Approve verified badges |
| 23 | **Blog / CMS management** | 🆕 | "Forms & Blogs" sidebar; create/edit posts |
| 24 | **CMS pages management** (about/terms/privacy/contact) | 🆕 | Edit static content |
| 25 | **SEO management** (metadata, sitemaps, structured data) | 🆕 | "Dynamic SEO Management" feature |
| 26 | **Tax / commission settings** (multi-vendor) | 🆕 | Revenue rules |
| 27 | **Watermark settings** | 🆕 | "Watermark Feature" |
| 28 | All-in-one settings hub | ✅ | "All in One Settings" |
| 29 | ↳ General settings | ✅ | |
| 30 | ↳ Web settings | ✅ | |
| 31 | ↳ Notification settings | ✅ | |
| 32 | ↳ OTP provider settings | ✅ | Firebase/Twilio/2Factor |
| 33 | ↳ AdMob settings | ✅ | |
| 34 | ↳ Payment gateway settings | ✅ | All gateways |
| 35 | ↳ About/Terms/Privacy/Contact content | ✅ | |
| 36 | ↳ Firebase settings | ✅ | |
| 37 | ↳ System status | ✅ | |
| 38 | System updates / version management | ✅ | Sidebar "System Updates" |
| 39 | **Email template management** | 🆕 | Transactional email content |
| 40 | **Audit logs / activity log** | 🆕 | Accountability |
| 41 | **Reports & analytics** (revenue, sales, engagement) | 🆕 | Business reporting beyond dashboard |
| 42 | **AI content settings (Gemini)** | 🆕 | Optional AI generation config |

**Summary of gaps:** Mobile +25 missing · Web +18 missing · Admin +18 missing. These are folded into the phases below.

---

## 5. Cross-Cutting Capabilities

| Capability | Approach |
|---|---|
| **Auth & OTP** | Sanctum tokens; social (Google/Apple); pluggable OTP provider (Firebase/Twilio/2Factor) behind one interface |
| **RBAC** | spatie/laravel-permission; roles: super-admin, staff (granular perms), seller, customer |
| **Payments** | Gateway-agnostic `PaymentGatewayInterface`; per-region enable/disable; webhooks; idempotency keys; sandbox→live config in admin |
| **Multi-currency** | Base currency + rates; user-preferred display currency; store amounts in minor units |
| **Notifications** | FCM push + in-app + email; templated; role/event-based (message, approval, expiry, offer, follow) |
| **Media & watermark** | Upload pipeline → optional watermark → resize/optimize → local or S3 + CDN; queued |
| **i18n & RTL** | Server-driven translation files (admin + app); RTL-aware layouts on web & mobile |
| **SEO** | Auto slugs, dynamic metadata, JSON-LD structured data, dynamic sitemaps, SSR/ISR on Next.js |
| **Search & geo** | Filterable search (DB indexes → optionally Meilisearch/Elastic at scale); Google Places autocomplete; radius search |
| **AdMob** | Banner/interstitial/native placements, remotely toggleable, frequency capping |
| **Observability** | Centralized logging, error tracking (Sentry), uptime/health, queue monitoring |
| **Security** | OWASP ASVS baseline, rate limiting, input validation, signed media URLs, PII handling, GDPR delete-account |

---

## 6. Team Structure (8+ devs — suggested squads)

| Squad | Owns | Headcount (guide) |
|---|---|---|
| **Platform/DevOps** | Repos, CI/CD, infra, env, observability, API contract tooling | 1–2 |
| **Backend/API** | Domain logic, REST API, integrations (payments/OTP/maps/FCM) | 2–3 |
| **Admin Panel** | Laravel admin (all management screens) | 1–2 |
| **Mobile (Flutter)** | iOS + Android app | 2 |
| **Web (Next.js)** | Public site + user dashboard + SEO | 1–2 |
| **QA/Automation** | Test strategy, contract tests, E2E, release QA | 1 |

Synchronization: the **OpenAPI contract + generated SDKs** decouple client squads from backend timing; weekly contract review keeps drift near zero.

---

## 7. Phase-Wise Production Roadmap

Each phase lists **parallel tracks**, **interface contracts** that must be frozen for downstream work, and **exit criteria**. Phases overlap; tracks within a phase run concurrently across squads.

### Phase 0 — Foundation & Enablement
**Goal:** make it possible for all squads to build in parallel from day one.

- **Platform/DevOps:** repos, branching strategy, CI/CD skeletons, dev/staging/prod envs, secrets management, base infra (Nginx, MySQL, Redis, queue worker, scheduler), error tracking.
- **Architecture (all leads):** full **ERD & DB schema**, **OpenAPI 3.1 contract v1**, error envelope, auth model, RBAC matrix, pagination/filtering conventions, media strategy (local vs S3), i18n strategy.
- **Tooling:** mock API server from OpenAPI; generated Dart + TS client SDKs; design system / component tokens (shared across web & mobile from Figma).
- **Backend:** Laravel project skeleton, migrations baseline, settings store, seeders for categories/locations/currencies/languages.
- **Mobile & Web:** project scaffolds, navigation/layout shells, design system wiring, CI builds — all against the mock server.

**Interface contract frozen:** OpenAPI v1 envelope, auth flow, pagination, media URL shape.
**Exit criteria:** every squad can run its app locally, hit the mock API, and ship to staging via CI.

---

### Phase 1 — Identity, Catalog & Admin Core
**Goal:** accounts, categories, custom fields, locations, settings, and the admin shell.

- **Backend:** auth (register/login/social/OTP/reset), users, RBAC, categories (nested), custom fields, locations, currencies, languages, settings, media/watermark pipeline, i18n endpoints.
- **Admin:** admin login (+2FA), dashboard skeleton, category mgmt, custom field mgmt, staff + roles/permissions, location mgmt, currency mgmt, language mgmt, watermark + general/web/firebase/system-status settings.
- **Mobile:** splash, onboarding, login/register/OTP/reset, profile view/edit, settings (language/currency/theme), navigation shell.
- **Web:** layout/header (location, category dropdown, language), login modal, register/OTP/reset, profile/edit.

**Interface contract frozen:** auth, user, category, custom-field, location, currency, language schemas.
**Exit criteria:** a user can register/verify/login on app & web; admin can manage taxonomy, locations, languages, currencies, staff.

---

### Phase 2 — Listings & Discovery
**Goal:** the core marketplace loop — post, browse, search, view, favorite.

- **Backend:** ads CRUD, ad images, custom-field values, auto slugs, search/filter, geo/nearby (radius), favorites, saved searches, item-approval workflow, featured sections + sliders APIs.
- **Admin:** item/ad approval & moderation, featured section management, slider management, customer & seller management.
- **Mobile:** home (banners/categories/featured), category browse, search + advanced filters, map/nearby, ad detail (gallery/specs/related), full-screen gallery, post ad (multi-step), edit ad, My Ads, favorites, report ad.
- **Web:** home, category landing pages (SEO), search results + filter sidebar, ad detail (SSR + JSON-LD), seller profile page, post/edit ad, My Ads, favorites, sitemap/robots/structured data.

**Interface contract frozen:** ad, ad-image, custom-field-value, search/filter params, favorites schemas.
**Exit criteria:** end-to-end post→approve→browse→search→view→favorite works on app & web; SEO pages render server-side with metadata.

---

### Phase 3 — Engagement: Chat, Offers, Follow, Reviews, Notifications
**Goal:** trust and communication features that drive transactions.

- **Backend:** conversations/messages (real-time via WebSockets/Reverb or FCM data), offers, follow/unfollow, reviews (seller↔buyer + "who bought?"), reports, FCM push, notification fan-out, OTP provider switching.
- **Admin:** chat moderation, reviews moderation, reports management, push notification system (compose/target/history).
- **Mobile:** chat list (selling/buying) + conversation, make-offer flow, seller profile, followers/following, write review + buyer confirmation, notifications, report flows.
- **Web:** chat (list + window), seller follow, reviews (given/received), notifications, report flows.

**Interface contract frozen:** conversation/message/offer, follow, review, notification, report schemas + realtime event format.
**Exit criteria:** buyers & sellers can chat, negotiate offers, follow, review, and receive push/in-app notifications.

---

### Phase 4 — Monetization: Subscriptions, Payments, Featured Ads, AdMob
**Goal:** revenue engine.

- **Backend:** packages + category-based plans, subscriptions, featured/premium ad purchase, **payment gateway integrations** (Stripe, PayPal, Razorpay, Paystack, PhonePe, Flutterwave, PayTabs, DPO, Bank Transfer) behind one interface, webhooks, invoices, multi-currency pricing, tax/commission rules.
- **Admin:** package mgmt, subscriptions/orders, transactions & invoices, refunds, payment gateway settings, AdMob settings, tax/commission settings.
- **Mobile:** subscription plans, checkout + payment method, payment success/failure, transactions/invoices/receipts, featured boost, AdMob placements (banner/interstitial/native).
- **Web:** subscription page, checkout + payment + result, transactions/invoices, featured boost.

**Interface contract frozen:** package, subscription, transaction, invoice, payment-intent/webhook schemas.
**Exit criteria:** a seller can buy a category subscription and feature an ad via at least the primary gateways (sandbox verified); invoices generated; AdMob live in app.

---

### Phase 5 — Content, SEO, Verification, Jobs, CMS
**Goal:** growth, compliance, and content surfaces.

- **Backend:** blog/CMS, CMS pages, SEO meta + dynamic sitemaps + structured data, verification/KYC workflow, jobs + job applications, email templates, optional Gemini AI content, audit logs.
- **Admin:** blog mgmt, CMS pages mgmt, SEO management, verification/KYC approval, jobs mgmt, email templates, audit logs, analytics/reports, AI content settings.
- **Mobile:** blog list/detail, verification submission, static pages, jobs list + apply, delete-account flow, empty/error/offline states.
- **Web:** blog list/detail (SEO), static pages, verification, job applications, 404/500, full SEO audit.

**Interface contract frozen:** blog/page/seo, verification, job/application schemas.
**Exit criteria:** content is publishable; SEO surfaces validated (Rich Results/Sitemap); KYC and job-apply flows complete; account deletion compliant.

---

### Phase 6 — Hardening, QA & Launch
**Goal:** production readiness.

- **Security:** OWASP review, pen test, rate-limit/abuse review, secrets audit, PII/GDPR review.
- **Performance:** load testing, DB indexing/query tuning, caching, image/CDN optimization, Lighthouse/Core Web Vitals on web, app cold-start tuning.
- **i18n/RTL QA:** full pass incl. Arabic RTL.
- **Release:** Play Store + App Store submission (Fastlane), staged rollout; backend blue/green or zero-downtime deploy; backups, monitoring, alerting, runbooks.
- **Acceptance:** end-to-end UAT across roles; soft launch → production.

**Exit criteria:** all critical/high bugs closed; monitoring & backups live; apps approved in stores; production sign-off.

---

## 8. Dependency & Sequencing Notes

- **Phase 0 must complete first** — the OpenAPI contract + mock server are what allow Phases 1–5 to parallelize across squads.
- **Catalog (Phase 1)** blocks **Listings (Phase 2)**; listings block **Engagement (Phase 3)** and **Monetization featured ads (Phase 4)**.
- **Payments (Phase 4)** can start integration spikes during Phase 3 (sandbox accounts, webhook plumbing) to de-risk.
- **SEO (Phase 5)** depends on stable ad/category/blog URLs from Phase 2 — keep slug/URL schemes frozen early.
- **Notifications infra (Phase 3)** is reused by Monetization (renewal/expiry) and Content (announcements).

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 8 payment gateways = high integration surface | Schedule slip | Ship 2–3 primary gateways for launch; add rest post-launch behind the common interface |
| Real-time chat scaling | Reliability | Start with Laravel Reverb/Pusher or FCM data messages; isolate behind an interface; load test in Phase 6 |
| 2 vCPU / 2 GB baseline is too small for production scale | Outages | Treat as dev/demo floor; plan managed MySQL + horizontal app scaling + Redis + CDN for production |
| SEO requires SSR/ISR discipline | Lost organic traffic | Freeze URL schemes early; SSR ad/category/blog pages; automated structured-data tests |
| Multi-language/RTL regressions | UX defects | Pseudo-localization + RTL in CI; dedicated Phase 6 i18n pass |
| Contract drift across squads | Integration breakage | OpenAPI as source of truth + contract tests + generated SDKs |
| App store rejection (account deletion, ads, IAP rules) | Launch delay | Build delete-account + compliant IAP/AdMob early (Phases 4–5), pre-review checklist |

---

## 10. Definition of Done / Quality Gates (per feature)

- API endpoint matches OpenAPI; contract test green.
- Unit + feature tests for backend; widget/component tests for clients; critical-path E2E.
- i18n strings externalized; RTL-safe.
- Handles empty/error/loading/offline states.
- Authz enforced (role/permission) and validated server-side.
- Accessibility basics (labels, contrast, focus) on web.
- Observability: logs/metrics for new flows; errors reported to Sentry.
- Docs updated (API contract, admin help where relevant).

---

## 11. Immediate Next Steps (to kick off Phase 0)

1. Confirm repo strategy (polyrepo + shared contract repo) and provision repos + CI/CD.
2. Produce the **ERD** and **OpenAPI v1** draft (I can generate both next).
3. Stand up the **mock API server** and generate Dart/TS client SDKs.
4. Provision dev/staging infra (Nginx, MySQL, Redis, queue, storage bucket, FCM project, payment sandboxes).
5. Lock the **design system tokens** and shared component inventory from Figma.
6. Seed baseline data (categories, locations, currencies, languages, settings).

---

*Generated as the master plan. Tell me which artifact to produce next — the ERD, the OpenAPI v1 spec, the detailed Phase 0/Phase 1 backend task breakdown, or per-squad backlogs — and I'll create it.*
