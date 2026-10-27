# ClassiAds_Hub — Full Development Guide

> **Status:** Implementation in progress (mobile + admin shipped; web partial)
> **Last updated:** 2026-06-05
> **Type:** Combined technical implementation spec **+** task breakdown (full dev guide)
> **Coverage:** All four layers at equal depth — Laravel Backend · Admin Panel · Flutter Mobile · Next.js Web
> **Derived from:** [`ClassiAds_Hub_Master_Plan.md`](ClassiAds_Hub_Master_Plan.md) (strategy) and [`ClassiAds_Hub_implementation.txt`](ClassiAds_Hub_implementation.txt) (requirements)
> **For what's actually shipped vs pending:** jump to [Part D — Implementation Updates (2026-06-05)](#part-d--implementation-updates-2026-06-05).

---

## How to use this document

This is the **single buildable reference** for the engineering team. It has three parts:

- **Part A — Technical Specification** (the *how to build it*): repo/module structure, full database schema, the complete API endpoint catalog, shared conventions, service interfaces, and per-client architecture. Freeze these before writing feature code.
- **Part B — Development Task Breakdown** (the *what to build, in what order*): epics → stories → concrete tasks, each split across Backend / Admin / Mobile / Web, with acceptance criteria and dependencies, organized along the 6 phases from the master plan.
- **Part C — Execution** (the *who and when*): per-squad backlogs, cross-team sequencing, Definition of Done, and appendices (env matrix, naming conventions, seed data).

**Conventions in this doc**
- `✅` = covered by the original spec · `🆕` = added for production-completeness.
- Checkboxes `- [ ]` are real, trackable tasks — copy them into your issue tracker.
- Endpoint paths are all under `/api/v1`. `🔒` = authenticated, `👑` = admin/staff only, `🌐` = public.
- Table columns are written DDL-style: `name type [modifiers]`.

---

## Table of Contents

**Part A — Technical Specification**
- [A1. Repository & Module Structure](#a1-repository--module-structure)
- [A2. Database Schema](#a2-database-schema)
- [A3. API Conventions](#a3-api-conventions)
- [A4. API Endpoint Catalog](#a4-api-endpoint-catalog)
- [A5. Backend Service Interfaces](#a5-backend-service-interfaces)
- [A6. Flutter Mobile Architecture](#a6-flutter-mobile-architecture)
- [A7. Next.js Web Architecture](#a7-nextjs-web-architecture)
- [A8. Admin Panel Architecture](#a8-admin-panel-architecture)

**Part B — Development Task Breakdown**
- [B0. Phase 0 — Foundation](#b0-phase-0--foundation)
- [B1. Phase 1 — Identity, Catalog & Admin Core](#b1-phase-1--identity-catalog--admin-core)
- [B2. Phase 2 — Listings & Discovery](#b2-phase-2--listings--discovery)
- [B3. Phase 3 — Engagement](#b3-phase-3--engagement)
- [B4. Phase 4 — Monetization](#b4-phase-4--monetization)
- [B5. Phase 5 — Content, SEO, Verification, Jobs](#b5-phase-5--content-seo-verification-jobs)
- [B6. Phase 6 — Hardening & Launch](#b6-phase-6--hardening--launch)

**Part C — Execution**
- [C1. Per-Squad Backlogs](#c1-per-squad-backlogs)
- [C2. Cross-Team Sequencing](#c2-cross-team-sequencing)
- [C3. Definition of Done](#c3-definition-of-done)
- [C4. Appendices](#c4-appendices)

**Part D — Implementation Updates (2026-06-05)**
- [D1. Mobile — Firebase, Maps, Location, Screens](#d1-mobile--firebase-maps-location-screens)
- [D2. Admin Panel — Dashboard redesign](#d2-admin-panel--dashboard-redesign)
- [D3. Backend — CMS + seed data](#d3-backend--cms--seed-data)
- [D4. Outstanding / pending](#d4-outstanding--pending)

---
---

# Part A — Technical Specification

## A1. Repository & Module Structure

Four deliverables across a polyrepo, synchronized by a shared contract repo.

| Repo | Stack | Owner squad |
|---|---|---|
| `classiads-backend` | Laravel 11 (PHP 8.2+), MySQL 8, Redis | Backend/API + Admin |
| `classiads-mobile` | Flutter 3.38.3 (Dart 3) | Mobile |
| `classiads-web` | Next.js 14+ (App Router, React 18, TS) | Web |
| `classiads-api-contract` | OpenAPI 3.1 + generated Dart/TS SDKs | Platform/DevOps |

### A1.1 Backend (`classiads-backend`)

Domain-oriented layout — group by feature, not by Laravel artifact type.

```
app/
├── Domain/                      # Business logic, one folder per bounded context
│   ├── Auth/                    # registration, login, OTP, social, password reset
│   ├── Users/                   # profiles, devices, follows, verification (KYC)
│   ├── Catalog/                 # categories, custom fields
│   ├── Ads/                     # listings, images, custom-field values, slugs
│   ├── Search/                  # filters, geo/radius, saved searches
│   ├── Engagement/              # conversations, messages, offers, reviews, reports
│   ├── Monetization/            # packages, subscriptions, featured ads
│   ├── Payments/                # gateway interface + drivers, invoices, webhooks
│   ├── Notifications/           # FCM, in-app, email fan-out
│   ├── Localization/            # countries/states/cities, languages, currencies
│   ├── Content/                 # blog, CMS pages, sliders, featured sections, SEO
│   ├── Jobs/                    # job listings + applications
│   └── Settings/                # key/value settings, audit logs, system status
│       └── (each context) → Models/ Actions/ Services/ DTOs/ Events/ Policies/
├── Http/
│   ├── Controllers/Api/V1/      # thin controllers, one per resource
│   ├── Controllers/Admin/       # admin panel controllers (or Filament Resources)
│   ├── Requests/                # FormRequest validation per endpoint
│   ├── Resources/               # API Resources (response transformers → envelope)
│   └── Middleware/              # auth, locale, currency, rate-limit, role checks
├── Jobs/                        # queued: SendPush, ProcessImage, GenerateSitemap…
├── Providers/
└── Support/                     # cross-cutting helpers, the response envelope macro
config/                         # services.php holds all 3rd-party keys
database/
├── migrations/                  # one per table, ordered by FK dependency
├── seeders/                     # categories, locations, currencies, languages, roles
└── factories/
routes/
├── api.php                      # versioned /api/v1 route groups by domain
└── admin.php                    # admin panel routes
tests/
├── Feature/                     # endpoint + contract tests (per domain)
└── Unit/                        # service/action tests
```

**Key packages:** `laravel/sanctum` (API tokens), `spatie/laravel-permission` (RBAC), `spatie/laravel-medialibrary` or custom pipeline (media + watermark), `laravel/reverb` or Pusher (realtime chat), `spatie/laravel-sitemap` (SEO), `intervention/image` (watermark/resize), `league/flysystem-aws-s3-v3` (optional S3). Admin UI: **Filament 3** (recommended) or Blade+Vue.

### A1.2 Mobile (`classiads-mobile`)

Feature-first Flutter structure with Riverpod (or Bloc) + generated API client.

```
lib/
├── core/
│   ├── api/                     # Dio client, interceptors (auth, locale, currency)
│   ├── api_client/              # GENERATED Dart SDK from OpenAPI
│   ├── router/                  # go_router config + guards
│   ├── theme/                   # design tokens, light/dark, RTL support
│   ├── localization/            # l10n (.arb), currency/number formatting
│   ├── storage/                 # secure token store, prefs, cache
│   └── error/                   # failure mapping, global error states
├── features/                    # one folder per feature (mirrors screens)
│   ├── auth/                    # splash, onboarding, login, register, otp, reset
│   ├── home/                    # dynamic home layout, featured sections
│   ├── categories/              # browse, subcategory drill-down
│   ├── search/                  # results, advanced filters, map/nearby
│   ├── ad_detail/               # detail, gallery, related, report
│   ├── post_ad/                 # multi-step create + edit
│   ├── my_ads/                  # manage listings
│   ├── chat/                    # list (selling/buying), conversation, offers
│   ├── seller/                  # public profile, followers/following, reviews
│   ├── favorites/               # bookmarks grid, saved searches
│   ├── notifications/
│   ├── profile/                 # view/edit, settings (lang/currency/theme)
│   ├── subscription/            # plans, checkout, payment result, transactions
│   ├── verification/            # KYC submit
│   ├── blog/                    # list, detail
│   ├── jobs/                    # listing + apply
│   └── static/                  # about/terms/privacy/contact, delete account
│       └── (each feature) → data/ domain/ presentation/ providers
└── shared/                      # reusable widgets, ad card, empty/error/skeletons
```

**Key packages:** `dio`, `riverpod`/`flutter_bloc`, `go_router`, `google_maps_flutter` + `google_places`, `firebase_messaging` + `firebase_auth`, `google_mobile_ads` (AdMob), `cached_network_image`, payment SDKs (Stripe/Razorpay/etc.), `flutter_localizations`.

### A1.3 Web (`classiads-web`)

Next.js App Router, SSR/ISR for SEO surfaces, generated TS client.

```
src/
├── app/                         # App Router (route = folder)
│   ├── (public)/                # SSR/ISR, indexable
│   │   ├── page.tsx             # home
│   │   ├── [category]/          # category landing (SEO)
│   │   ├── ad/[slug]/           # ad detail (SSR + JSON-LD)
│   │   ├── seller/[id]/         # seller public profile
│   │   ├── blog/                # list + [slug] detail
│   │   └── (cms)/about|terms|privacy|contact|faq/
│   ├── (auth)/login|register|forgot-password/
│   ├── (dashboard)/             # 🔒 user dashboard (CSR/SSR-auth)
│   │   ├── my-ads/ favorites/ chat/ notifications/ profile/
│   │   ├── subscription/ transactions/ reviews/ job-applications/
│   │   ├── verification/ post-ad/ edit-ad/[id]/
│   ├── sitemap.ts robots.ts     # dynamic SEO
│   └── api/                     # route handlers (webhooks proxy, revalidate)
├── lib/
│   ├── api/                     # GENERATED TS SDK + fetch wrappers
│   ├── auth/                    # session, token handling
│   ├── seo/                     # metadata builders, JSON-LD schemas
│   ├── i18n/                    # next-intl config, RTL
│   └── currency/
├── components/                  # ui/ (design system) + feature components
└── styles/                      # tokens, Tailwind config
```

**Key packages:** `next-intl` (i18n+RTL), `@tanstack/react-query` (client data), `react-hook-form` + `zod`, `next-seo` or native metadata API, design system (Tailwind + shadcn/ui or MUI), maps via `@vis.gl/react-google-maps`.

### A1.4 Contract (`classiads-api-contract`)

```
openapi/
├── openapi.yaml                 # OpenAPI 3.1 — single source of truth
├── components/                  # reusable schemas, error envelope, params
└── paths/                       # one file per resource group
sdks/
├── dart/                        # generated → consumed by mobile
└── typescript/                  # generated → consumed by web
mock/                            # Prism/Stoplight mock server config
```

CI here regenerates SDKs and publishes them to the mobile/web repos on every merge. Contract tests (Spectator/Dredd) in the backend repo validate the live API against this spec.

---

## A2. Database Schema

MySQL 8, InnoDB, `utf8mb4`. All tables carry `id BIGINT UNSIGNED PK AUTO_INCREMENT`, `created_at`, `updated_at` unless noted. Soft deletes (`deleted_at`) on user-content tables (ads, users, reviews, blog). **Money is stored in minor units** (`amount BIGINT` = cents) with a `currency_code CHAR(3)`.

### A2.1 Identity & Access

**`users`**
```
id, name, email UNIQUE NULL, phone VARCHAR(20) UNIQUE NULL, password NULL,
role ENUM('customer','seller','staff','admin') DEFAULT 'customer',
avatar_path NULL, bio TEXT NULL, is_verified BOOL DEFAULT 0,   -- KYC badge
verified_at TIMESTAMP NULL, status ENUM('active','suspended','pending') DEFAULT 'active',
preferred_language_id FK→languages NULL, preferred_currency_code CHAR(3) NULL,
country_id FK NULL, state_id FK NULL, city_id FK NULL,
last_login_at NULL, email_verified_at NULL, phone_verified_at NULL,
deleted_at, created_at, updated_at
```
**`seller_profiles`** — `id, user_id FK UNIQUE, title VARCHAR, member_since DATE, rating_avg DECIMAL(3,2) DEFAULT 0, rating_count INT DEFAULT 0, followers_count INT DEFAULT 0, following_count INT DEFAULT 0`
**`roles`** / **`permissions`** / **`model_has_roles`** / **`role_has_permissions`** — provided by `spatie/laravel-permission` (migrations published).
**`user_devices`** — `id, user_id FK, fcm_token VARCHAR UNIQUE, platform ENUM('android','ios','web'), last_seen_at` (push targeting).
**`social_accounts`** — `id, user_id FK, provider ENUM('google','apple'), provider_user_id, UNIQUE(provider,provider_user_id)`.
**`verification_requests`** (KYC) — `id, user_id FK, doc_type, doc_front_path, doc_back_path NULL, selfie_path NULL, status ENUM('pending','approved','rejected') DEFAULT 'pending', reviewed_by FK→users NULL, reject_reason NULL, reviewed_at NULL`.
**`otp_codes`** — `id, identifier VARCHAR (email/phone), code VARCHAR, channel ENUM('sms','email'), provider ENUM('firebase','twilio','2factor'), expires_at, consumed_at NULL, attempts INT DEFAULT 0`.
**`password_reset_tokens`**, **`personal_access_tokens`** (Sanctum) — framework defaults.

### A2.2 Geography & Localization

**`countries`** — `id, name, iso2 CHAR(2), iso3 CHAR(3), phone_code, currency_code, flag_path, is_active BOOL`.
**`states`** — `id, country_id FK, name, code NULL, is_active`.
**`cities`** — `id, state_id FK, country_id FK, name, latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL, is_active`.
**`languages`** — `id, name, code VARCHAR(5) UNIQUE, flag_path, is_rtl BOOL DEFAULT 0, is_default BOOL DEFAULT 0, is_active, admin_file_path NULL, app_file_path NULL`.
**`translations`** — `id, language_id FK, group VARCHAR, key VARCHAR, value TEXT, UNIQUE(language_id,group,key)` (DB-driven strings; files optional).
**`currencies`** — `id, code CHAR(3) UNIQUE, symbol, name, decimal_places TINYINT DEFAULT 2, is_default BOOL, is_active`.
**`currency_rates`** — `id, base_code CHAR(3), target_code CHAR(3), rate DECIMAL(18,8), fetched_at, UNIQUE(base_code,target_code)`.

### A2.3 Catalog & Custom Fields

**`categories`** — `id, parent_id FK→categories NULL, name, slug UNIQUE, icon_path NULL, image_path NULL, type ENUM('standard','jobs','property','vehicle') DEFAULT 'standard', position INT DEFAULT 0, is_active BOOL, ads_count INT DEFAULT 0, INDEX(parent_id), INDEX(slug)`.
**`custom_fields`** — `id, name, slug, type ENUM('text','number','dropdown','radio','checkbox','date','boolean'), icon_path NULL, is_required BOOL, is_filterable BOOL DEFAULT 0, position INT`.
**`custom_field_options`** — `id, custom_field_id FK, label, value, position` (for dropdown/radio/checkbox).
**`category_custom_field`** — pivot `id, category_id FK, custom_field_id FK, is_required_override NULL, position, UNIQUE(category_id,custom_field_id)`.

### A2.4 Ads / Listings

**`ads`**
```
id, user_id FK, category_id FK, title VARCHAR, slug UNIQUE, description TEXT,
price BIGINT NULL (minor units), currency_code CHAR(3), price_type ENUM('fixed','negotiable','free','on_call') DEFAULT 'fixed',
phone VARCHAR NULL, video_url NULL,
country_id FK NULL, state_id FK NULL, city_id FK NULL,
address VARCHAR NULL, latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL,
status ENUM('draft','pending','active','rejected','sold','expired') DEFAULT 'pending',
reject_reason NULL, is_featured BOOL DEFAULT 0, featured_until TIMESTAMP NULL,
views_count INT DEFAULT 0, favorites_count INT DEFAULT 0,
published_at NULL, expires_at NULL, sold_at NULL, sold_to_user_id FK NULL,
deleted_at, created_at, updated_at,
INDEX(category_id,status), INDEX(status,published_at), INDEX(latitude,longitude), SPATIAL/FULLTEXT(title,description)
```
**`ad_images`** — `id, ad_id FK, path, thumb_path, position INT, is_primary BOOL DEFAULT 0`.
**`ad_custom_field_values`** — `id, ad_id FK, custom_field_id FK, value TEXT, UNIQUE(ad_id,custom_field_id), INDEX(custom_field_id,value(50))` (filtering).
**`favorites`** — `id, user_id FK, ad_id FK, UNIQUE(user_id,ad_id)`.
**`saved_searches`** — `id, user_id FK, name, query_json JSON, notify BOOL DEFAULT 1, last_run_at NULL`.
**`reports`** — `id, reporter_id FK→users, reportable_type, reportable_id (ad/user), reason, details TEXT NULL, status ENUM('open','reviewing','resolved','dismissed') DEFAULT 'open', resolved_by FK NULL, resolved_at NULL` (polymorphic).

### A2.5 Engagement

**`conversations`** — `id, ad_id FK NULL, buyer_id FK→users, seller_id FK→users, last_message_at, UNIQUE(ad_id,buyer_id,seller_id), INDEX(buyer_id), INDEX(seller_id)`.
**`messages`** — `id, conversation_id FK, sender_id FK→users, body TEXT NULL, attachment_path NULL, type ENUM('text','image','offer','system') DEFAULT 'text', read_at NULL, created_at`.
**`offers`** — `id, conversation_id FK, ad_id FK, from_user_id FK, amount BIGINT, currency_code, status ENUM('pending','accepted','rejected','countered','withdrawn') DEFAULT 'pending', parent_offer_id FK NULL`.
**`follows`** — `id, follower_id FK→users, seller_id FK→users, UNIQUE(follower_id,seller_id)`.
**`reviews`** — `id, ad_id FK NULL, reviewer_id FK→users, seller_id FK→users, rating TINYINT (1-5), comment TEXT NULL, is_buyer_confirmed BOOL DEFAULT 0, status ENUM('published','hidden') DEFAULT 'published', UNIQUE(ad_id,reviewer_id,seller_id)`.
**`notifications`** — Laravel default `notifications` table (`id UUID, type, notifiable_type, notifiable_id, data JSON, read_at`).

### A2.6 Monetization & Payments

**`packages`** — `id, name, slug, ios_product_id NULL, android_product_id NULL, price BIGINT, discount_percent DECIMAL(5,2) DEFAULT 0, final_price BIGINT, currency_code, image_path NULL, description TEXT, duration_days INT, ad_limit INT NULL (NULL=unlimited), is_featured_plan BOOL DEFAULT 0, position INT, is_active BOOL`.
**`package_category`** — pivot `id, package_id FK, category_id FK, UNIQUE(package_id,category_id)` (category-based plans).
**`subscriptions`** — `id, user_id FK, package_id FK, status ENUM('active','expired','cancelled','pending') DEFAULT 'pending', starts_at, ends_at, ads_used INT DEFAULT 0, ads_limit INT NULL, auto_renew BOOL DEFAULT 0, transaction_id FK NULL`.
**`featured_ads`** — `id, ad_id FK, user_id FK, starts_at, ends_at, transaction_id FK NULL` (boost purchases).
**`payment_gateways`** — `id, code VARCHAR UNIQUE (stripe/paypal/razorpay/...), name, is_active, mode ENUM('sandbox','live'), config JSON (encrypted keys), supported_currencies JSON, position`.
**`transactions`** — `id, user_id FK, gateway_code, gateway_ref VARCHAR NULL, purpose ENUM('subscription','featured_ad'), purchasable_type, purchasable_id, amount BIGINT, currency_code, status ENUM('pending','success','failed','refunded') DEFAULT 'pending', idempotency_key UNIQUE, raw_response JSON NULL, paid_at NULL`.
**`invoices`** — `id, transaction_id FK, user_id FK, number VARCHAR UNIQUE, amount BIGINT, currency_code, tax_amount BIGINT DEFAULT 0, pdf_path NULL, issued_at`.
**`webhook_events`** — `id, gateway_code, event_id VARCHAR UNIQUE, type, payload JSON, processed_at NULL` (idempotent webhook handling).
**`admob_settings`** — stored in `settings` (key/value) or dedicated: `id, placement ENUM('banner','interstitial','native'), platform, unit_id, is_active, frequency_cap INT NULL`.
**`tax_commission_rules`** — `id, scope ENUM('global','category'), category_id FK NULL, type ENUM('percent','flat'), value DECIMAL(10,2), applies_to ENUM('subscription','featured','sale')`.

### A2.7 Content, CMS & System

**`blog_posts`** — `id, blog_category_id FK NULL, author_id FK→users, title, slug UNIQUE, excerpt TEXT, body LONGTEXT, banner_path, status ENUM('draft','published') DEFAULT 'draft', published_at NULL, views_count INT DEFAULT 0, deleted_at`.
**`blog_categories`** — `id, name, slug UNIQUE, position`.
**`pages`** (CMS) — `id, key VARCHAR UNIQUE (about/terms/privacy/contact/faq), title, body LONGTEXT, is_published BOOL`.
**`sliders`** — `id, image_path, link_type ENUM('ad','category','external'), ad_id FK NULL, category_id FK NULL, external_url NULL, position, is_active`.
**`featured_sections`** — `id, title, filter_type ENUM('most_liked','most_viewed','category','latest'), category_id FK NULL, style VARCHAR (layout style key), position, is_active`.
**`seo_meta`** — `id, seoable_type, seoable_id NULL, route_key VARCHAR NULL, meta_title, meta_description, og_image_path NULL, structured_data JSON NULL, INDEX(seoable_type,seoable_id)`.
**`settings`** — `id, group VARCHAR, key VARCHAR, value TEXT, type ENUM('string','bool','int','json','file'), UNIQUE(group,key)` (the All-in-One settings hub backing store).
**`email_templates`** — `id, key UNIQUE, subject, body_html LONGTEXT, variables JSON, is_active`.
**`audit_logs`** — `id, user_id FK NULL, action, auditable_type, auditable_id, changes JSON NULL, ip, user_agent, created_at`.
**`jobs_listings`** — extends ads when `category.type='jobs'`; job-specific fields via custom fields, plus **`job_applications`** — `id, ad_id FK, applicant_id FK→users, cover_letter TEXT NULL, resume_path NULL, status ENUM('submitted','reviewed','shortlisted','rejected') DEFAULT 'submitted'`.
**`system_status`** — derived/live (queue, DB, cache health) — no table, exposed via endpoint; optionally `system_updates` — `id, version, notes, applied_at`.

### A2.8 Entity Relationship summary

```
users ──< ads >── categories ──< category_custom_field >── custom_fields ──< custom_field_options
  │        │  └─< ad_images                                    
  │        └─< ad_custom_field_values >── custom_fields
users ──< seller_profiles                 users ──< user_devices / social_accounts / verification_requests
users ──< favorites >── ads               users ──< follows >── users(seller)
conversations ─< messages                 conversations ─< offers
users ──< reviews >── users(seller)        users ──< reports >── (ads|users)
packages ──< package_category >── categories   packages ──< subscriptions >── users
transactions ─1:1─ invoices               transactions ──> (subscriptions|featured_ads)
countries ─< states ─< cities             languages ─< translations
blog_categories ─< blog_posts             sliders / featured_sections / pages / settings (standalone)
```

> Full ERD diagram is a Phase 0 deliverable (generate from these definitions). Keep migrations ordered by FK dependency: localization → users/roles → catalog → ads → engagement → monetization → content.

---

## A3. API Conventions

These are frozen in Phase 0 and apply to every endpoint. Clients code against them via generated SDKs.

**Base & versioning** — `https://{env}.classiads.app/api/v1`. Breaking changes bump to `/v2`.

**Response envelope** (success and error use the same shape):
```json
{ "success": true, "data": {}, "message": "Optional human string",
  "meta": { "pagination": { "current_page": 1, "per_page": 20, "total": 134, "last_page": 7 } },
  "errors": null }
```
Errors:
```json
{ "success": false, "data": null, "message": "The given data was invalid.",
  "meta": null, "errors": { "email": ["The email field is required."] } }
```

**HTTP status map** — `200` OK, `201` created, `204` no content, `401` unauth, `403` forbidden (role/policy), `404` not found, `422` validation, `429` rate-limited, `5xx` server. Always carry the envelope, even on errors.

**Auth** — `Authorization: Bearer {sanctum_token}`. Tokens issued on login/register/OTP-verify. Admin panel uses session guard, not the API.

**Headers clients send** — `Accept-Language: {code}` (drives translations), `X-Currency: {code}` (display currency), `X-Device-Id` / device registration for push.

**Pagination** — cursor or page-based via `?page=&per_page=`; metadata in `meta.pagination`. Default `per_page=20`, max `100`.

**Filtering & sorting** — standardized query params: `?filter[category_id]=5&filter[price_min]=100&filter[city_id]=...&sort=-published_at`. Custom-field filters: `?cf[breed]=labrador`. Geo: `?lat=&lng=&radius_km=`.

**Idempotency** — payment-creating endpoints require `Idempotency-Key` header.

**Rate limiting** — `throttle:api` (60/min default); auth/OTP endpoints stricter (e.g. 5/min). Surfaced via `429` + `Retry-After`.

**Localization of content** — list/detail responses return values already resolved to `Accept-Language`; admin write endpoints accept translatable fields as `{ "en": "...", "ar": "..." }` where applicable.

---

## A4. API Endpoint Catalog

Grouped by domain. `🌐` public · `🔒` auth · `👑` admin/staff. Admin endpoints live under `/api/v1/admin/*` **or** are served by the Filament panel directly (see A8) — listed here for completeness of the contract.

### A4.1 Auth & Account
| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | Create account (email/phone) |
| POST | `/auth/login` | 🌐 | Email/phone + password → token |
| POST | `/auth/social` | 🌐 | Google/Apple token exchange |
| POST | `/auth/otp/send` | 🌐 | Send OTP (provider-routed) |
| POST | `/auth/otp/verify` | 🌐 | Verify OTP → token / verify phone |
| POST | `/auth/forgot-password` | 🌐 | Trigger reset |
| POST | `/auth/reset-password` | 🌐 | Set new password with token |
| POST | `/auth/logout` | 🔒 | Revoke current token |
| GET | `/me` | 🔒 | Current user + profile |
| PUT | `/me` | 🔒 | Update profile |
| PUT | `/me/preferences` | 🔒 | Language/currency/theme/notif prefs |
| POST | `/me/devices` | 🔒 | Register FCM token |
| DELETE | `/me/devices/{id}` | 🔒 | Unregister device |
| DELETE | `/me` | 🔒 | Delete account (GDPR/store compliance) |

### A4.2 Verification (KYC)
| POST | `/verification/requests` | 🔒 | Submit KYC docs |
| GET | `/verification/requests/me` | 🔒 | My request status |
| GET | `/admin/verification/requests` | 👑 | List requests |
| PUT | `/admin/verification/requests/{id}` | 👑 | Approve/reject |

### A4.3 Catalog (Categories & Custom Fields)
| GET | `/categories` | 🌐 | Nested tree (cached) |
| GET | `/categories/{slug}` | 🌐 | Category + children + filterable fields |
| GET | `/categories/{id}/custom-fields` | 🌐 | Fields for posting form |
| POST/PUT/DELETE | `/admin/categories[/{id}]` | 👑 | CRUD + reorder + toggle |
| POST/PUT/DELETE | `/admin/custom-fields[/{id}]` | 👑 | CRUD + options + attach to category |

### A4.4 Ads / Listings
| GET | `/ads` | 🌐 | List/search (filters, sort, geo, pagination) |
| GET | `/ads/{slug}` | 🌐 | Detail (increments views) + related |
| GET | `/ads/{id}/related` | 🌐 | Related listings |
| POST | `/ads` | 🔒 | Create (multi-step persisted as draft→pending) |
| PUT | `/ads/{id}` | 🔒 | Edit (owner) |
| DELETE | `/ads/{id}` | 🔒 | Delete (owner) |
| POST | `/ads/{id}/images` | 🔒 | Upload images (queued watermark/resize) |
| DELETE | `/ads/{id}/images/{imageId}` | 🔒 | Remove image |
| PUT | `/ads/{id}/status` | 🔒 | Mark sold / renew / boost-request |
| GET | `/me/ads` | 🔒 | My ads (active/pending/sold/expired) |
| POST | `/admin/ads/{id}/approve` | 👑 | Approve listing |
| POST | `/admin/ads/{id}/reject` | 👑 | Reject with reason |
| GET | `/admin/ads` | 👑 | Moderation queue (filters) |

### A4.5 Favorites & Saved Searches
| GET | `/me/favorites` | 🔒 | Bookmarked ads |
| POST | `/ads/{id}/favorite` | 🔒 | Add |
| DELETE | `/ads/{id}/favorite` | 🔒 | Remove |
| GET/POST/DELETE | `/me/saved-searches[/{id}]` | 🔒 | Manage saved searches/alerts |

### A4.6 Reports
| POST | `/reports` | 🔒 | Report ad/user |
| GET | `/admin/reports` | 👑 | List |
| PUT | `/admin/reports/{id}` | 👑 | Resolve/dismiss |

### A4.7 Engagement — Chat, Offers, Follow, Reviews
| GET | `/conversations?tab=selling|buying` | 🔒 | Chat list |
| POST | `/conversations` | 🔒 | Start (ad + seller) |
| GET | `/conversations/{id}/messages` | 🔒 | Messages (paginated) |
| POST | `/conversations/{id}/messages` | 🔒 | Send message/image |
| POST | `/conversations/{id}/read` | 🔒 | Mark read |
| POST | `/conversations/{id}/offers` | 🔒 | Make/counter offer |
| PUT | `/offers/{id}` | 🔒 | Accept/reject/withdraw |
| POST | `/sellers/{id}/follow` / DELETE | 🔒 | Follow/unfollow |
| GET | `/sellers/{id}` | 🌐 | Public seller profile + live ads + ratings |
| GET | `/sellers/{id}/followers` `/following` | 🌐 | Lists |
| POST | `/sellers/{id}/reviews` | 🔒 | Submit review (rate seller) |
| GET | `/sellers/{id}/reviews` | 🌐 | Reviews list |
| GET | `/ads/{id}/buyers` | 🔒 | "Who bought?" candidate list (seller) |
| POST | `/ads/{id}/confirm-buyer` | 🔒 | Seller confirms buyer |
| GET/PUT/DELETE | `/admin/{reviews\|conversations}` | 👑 | Moderation |

> **Realtime:** chat/offers/notifications delivered via Laravel Reverb (WebSockets) channels `private-conversation.{id}`, `private-user.{id}`; FCM data messages as fallback. Event payload format frozen in Phase 0.

### A4.8 Notifications
| GET | `/me/notifications` | 🔒 | List |
| POST | `/me/notifications/{id}/read` | 🔒 | Mark read |
| POST | `/me/notifications/read-all` | 🔒 | Mark all |
| POST | `/admin/notifications/push` | 👑 | Compose + send (user/all/segment) |
| GET | `/admin/notifications/history` | 👑 | Sent history |

### A4.9 Monetization & Payments
| GET | `/packages?category_id=` | 🌐 | Plans (category-based) |
| GET | `/me/subscriptions` | 🔒 | Active/past |
| POST | `/checkout/subscription` | 🔒 | Create subscription intent (Idempotency-Key) |
| POST | `/checkout/featured-ad` | 🔒 | Boost an ad |
| POST | `/payments/{gateway}/intent` | 🔒 | Create payment intent/session |
| POST | `/payments/{gateway}/confirm` | 🔒 | Confirm (where applicable) |
| POST | `/webhooks/{gateway}` | 🌐 | Gateway webhook (signature-verified, idempotent) |
| GET | `/me/transactions` | 🔒 | History |
| GET | `/me/invoices/{id}` | 🔒 | Invoice/receipt (PDF link) |
| CRUD | `/admin/packages`, `/admin/subscriptions`, `/admin/transactions`, `/admin/payment-gateways`, `/admin/tax-rules` | 👑 | Management + refunds |

### A4.10 Localization & Geo
| GET | `/countries` `/states?country_id=` `/cities?state_id=` | 🌐 | Cascading selectors |
| GET | `/languages` | 🌐 | Active languages (+RTL flags) |
| GET | `/translations/{lang}` | 🌐 | App string bundle |
| GET | `/currencies` | 🌐 | Active currencies + rates |
| GET | `/places/autocomplete?q=` | 🔒 | Google Places proxy |
| CRUD | `/admin/{countries\|states\|cities\|languages\|currencies}` | 👑 | Management + rate refresh |

### A4.11 Content, CMS & SEO
| GET | `/home` | 🌐 | Dynamic home layout (sliders + featured sections + categories) |
| GET | `/sliders` | 🌐 | Active sliders |
| GET | `/featured-sections` | 🌐 | Configured sections w/ resolved items |
| GET | `/blog` `/blog/{slug}` | 🌐 | Posts list/detail |
| GET | `/pages/{key}` | 🌐 | CMS page (about/terms/privacy/contact/faq) |
| GET | `/seo?route=` | 🌐 | Meta for a route (web SSR) |
| GET | `/sitemap` data + `/robots` | 🌐 | SEO surfaces (web generates files) |
| CRUD | `/admin/{blog\|pages\|sliders\|featured-sections\|seo\|email-templates}` | 👑 | Content management |

### A4.12 Jobs
| GET | `/jobs` `/jobs/{slug}` | 🌐 | Job listings (category.type='jobs') |
| POST | `/jobs/{id}/apply` | 🔒 | Submit application (resume/cover) |
| GET | `/me/job-applications` | 🔒 | My applications |
| GET | `/admin/job-applications` | 👑 | Manage |

### A4.13 Settings & System
| GET | `/settings/public` | 🌐 | Client-needed settings (admob ids, feature flags, branding) |
| GET | `/admin/settings/{group}` PUT | 👑 | All-in-one settings hub |
| GET | `/admin/audit-logs` | 👑 | Activity log |
| GET | `/admin/system-status` | 👑 | Health (queue/db/cache) |
| GET | `/admin/reports/analytics` | 👑 | Revenue/sales/engagement reports |

---

## A5. Backend Service Interfaces

Pluggable boundaries so drivers can be swapped via admin config without touching feature code. Each is a PHP interface with config-selected implementations.

**`PaymentGatewayInterface`**
```php
interface PaymentGatewayInterface {
    public function createIntent(Transaction $txn): PaymentIntentDTO;   // session/intent/redirect URL
    public function confirm(string $reference): PaymentResultDTO;
    public function handleWebhook(Request $r): WebhookResultDTO;        // signature-verified, idempotent
    public function refund(Transaction $txn, ?int $amount = null): RefundResultDTO;
    public function supportedCurrencies(): array;
}
```
Drivers: `Stripe`, `PayPal`, `Razorpay`, `Paystack`, `PhonePe`, `Flutterwave`, `PayTabs`, `DPO`, `BankTransfer`. Resolved by `payment_gateways.code`; keys from encrypted `config` JSON. **Launch with Stripe + Razorpay + Bank Transfer; add the rest behind the interface post-launch.**

**`OtpProviderInterface`**
```php
interface OtpProviderInterface {
    public function send(string $identifier, string $code, string $channel): void;
}
```
Drivers: `Firebase`, `Twilio`, `TwoFactor`. Active provider from `settings('otp.provider')`.

**`NotificationChannelInterface`** — fan-out to `fcm` (push), `database` (in-app), `mail` (templated). Triggered by domain events: `MessageSent`, `OfferMade`, `AdApproved`, `AdExpiring`, `NewFollower`, `SubscriptionRenewing`, `PaymentSucceeded`.

**`MediaPipeline`** — `store → (optional) watermark → resize variants → optimize → local|s3 → CDN URL`. Runs in a queued `ProcessImage` job. Watermark + storage driver from settings.

**`SearchEngineInterface`** — default `DatabaseSearch` (indexed SQL + FULLTEXT); swap to `MeilisearchSearch` at scale. Same filter/sort/geo contract.

**`CurrencyConverter`** — converts minor-unit amounts using `currency_rates`; scheduled job refreshes rates.

**`SeoService`** — resolves `seo_meta` per route, builds JSON-LD (`Product`, `Article`, `BreadcrumbList`, `Organization`), feeds dynamic sitemap generation.

---

## A6. Flutter Mobile Architecture

**Pattern:** feature-first + clean-ish layering (`data` → `domain` → `presentation`), Riverpod for state, `go_router` for navigation, generated Dart SDK for all I/O.

**Layering per feature**
- `data/` — repository implementations calling the generated API client; DTO ↔ entity mappers; local cache.
- `domain/` — entities + repository interfaces + use-cases (keeps presentation testable).
- `presentation/` — screens, widgets, Riverpod providers/notifiers.

**Cross-cutting**
- **Networking:** Dio with interceptors injecting `Authorization`, `Accept-Language`, `X-Currency`; auto token-refresh; maps API errors → typed `Failure`s → UI states.
- **Routing & guards:** `go_router` with an auth guard; deep links to `ad/{slug}`, `seller/{id}`, `chat/{id}` (also FCM notification taps).
- **State:** Riverpod (`AsyncNotifier`) — every async screen handles `loading / data / empty / error / offline` (Screen #39 in inventory is this contract, applied everywhere).
- **Realtime:** WebSocket (Reverb) client for chat/offers; FCM `onMessage`/`onBackgroundMessage` for push + data sync.
- **i18n/RTL:** `flutter_localizations` + `.arb`; `Directionality` driven by selected language `is_rtl`; intl number/currency formatting.
- **Theming:** design tokens (colors/spacing/typography) shared with web from Figma; light/dark.
- **Payments:** native SDKs (Stripe/Razorpay) + redirect/webview gateways; success/failure result screens reconcile against `/me/transactions`.
- **AdMob:** `google_mobile_ads` banner/interstitial/native; unit IDs + frequency cap from `/settings/public`; remotely toggleable.
- **Maps:** `google_maps_flutter` for nearby/radius + ad-detail map; Places autocomplete via backend proxy.

**Screen → feature mapping** (full list in master plan §4.1): 40 screens across `auth, home, categories, search, ad_detail, post_ad, my_ads, chat, seller, favorites, notifications, profile, subscription, verification, blog, jobs, static`.

**Testing:** widget tests per screen; provider/use-case unit tests; integration test for the post→browse→chat critical path; golden tests for the ad card + key screens.

---

## A7. Next.js Web Architecture

**Pattern:** App Router with a clear split between **public SEO surfaces** (SSR/ISR, indexable) and the **authenticated dashboard** (auth-gated, mostly client-driven with React Query).

**Rendering strategy**
| Surface | Strategy | Why |
|---|---|---|
| Home, category landing, ad detail, seller profile, blog, CMS pages | **SSR or ISR** | SEO — metadata, JSON-LD, crawlable HTML |
| Dashboard (my-ads, chat, favorites, profile, subscription, transactions…) | **SSR-auth shell + CSR data** | Personalized, behind login |
| Sitemap / robots | **Dynamic route handlers** (`sitemap.ts`, `robots.ts`) | Always-fresh from API |

**SEO discipline (frozen early)**
- URL schemes locked in Phase 2 and never broken: `/{category-slug}`, `/ad/{ad-slug}`, `/seller/{id}`, `/blog/{post-slug}`.
- `generateMetadata()` per route pulls from `/seo?route=`; JSON-LD via `SeoService` schemas (`Product`, `Article`, `BreadcrumbList`).
- ISR `revalidate` on content; on-demand revalidation webhook from backend when admin publishes.
- Core Web Vitals budget enforced in CI (Lighthouse).

**Cross-cutting**
- **Data:** server components fetch via the generated TS SDK; client mutations via React Query; forms with `react-hook-form` + `zod` (schemas mirror backend validation).
- **Auth:** token in httpOnly cookie; middleware guards `(dashboard)` routes; SSR fetches use the session token.
- **i18n/RTL:** `next-intl` with locale segment or cookie; `dir="rtl"` for RTL languages; currency formatting from user pref.
- **Realtime:** WebSocket (Reverb) for chat/notifications in dashboard.
- **Payments:** gateway SDKs/redirects on checkout; success/failure pages reconcile with `/me/transactions`; webhooks handled server-side (backend), web only polls/refreshes.
- **Error handling:** route-level `error.tsx`/`not-found.tsx`; global 404/500.
- **Design system:** shared tokens with mobile (Tailwind config generated from Figma tokens); component library in `components/ui`.

**Page → route mapping:** master plan §4.2 (26 pages). Public group is the SEO money — prioritize SSR correctness there.

---

## A8. Admin Panel Architecture

**Recommended:** **Filament 3** on the Laravel backend (fastest path to 42 management screens with RBAC, tables, forms, and dashboards built in). Alternative: Blade + Vue/Inertia if the team prefers full UI control.

**Structure (Filament)**
- **Resources** (one per managed entity): Categories, CustomFields, Ads (moderation), Packages, Sliders, FeaturedSections, Staff/Users, Roles, Languages, Currencies, Countries/States/Cities, BlogPosts, Pages, PaymentGateways, Subscriptions, Transactions, Verification, Reports, Reviews, Conversations (moderation), EmailTemplates, Jobs/Applications, SeoMeta.
- **Pages** (custom, non-CRUD): Insightful Dashboard (KPI widgets + geo map + featured table), Push Notification composer, All-in-One Settings hub (grouped setting pages), SEO management, Tax/Commission, Watermark settings, System Status, System Updates, Audit Logs, Analytics/Reports, AI (Gemini) settings.
- **Widgets:** stat cards (Total Customers/Ads/Categories/Custom Fields), most-viewed geo map, revenue charts.
- **Auth:** dedicated admin guard + **2FA**; `spatie/laravel-permission` gates every Resource/Page by permission; staff roles (support, tech, content, editor) map to permission sets.
- **Settings hub:** each settings card (General, Web, Notification, OTP, AdMob, Payment Gateways, About/Terms/Privacy/Contact, Firebase, System Status, Languages) is a settings page writing to the `settings` table; sensitive keys encrypted.

**Admin screen list:** master plan §4.3 (42 screens). All management endpoints in A4 (`/admin/*`) are either Filament-native or exposed for the contract.

---
---

# Part B — Development Task Breakdown

Each phase = a set of **epics**. Each epic lists tasks split across **Backend · Admin · Mobile · Web**, plus **Acceptance criteria** and **Depends on**. Tasks are checkboxes — copy them into Jira/Linear/GitHub Issues. Phases overlap; within a phase, the four client tracks run concurrently against the frozen contract.

## B0. Phase 0 — Foundation

> **Goal:** every squad can build in parallel from day one against a mock API. Nothing below this line is "feature work" — it is enablement and must land first.

### Epic 0.1 — Platform & environments
- [ ] Provision repos: `classiads-backend`, `classiads-mobile`, `classiads-web`, `classiads-api-contract`.
- [ ] Branching strategy (trunk + short-lived feature branches), PR templates, CODEOWNERS per squad.
- [ ] CI/CD skeletons per repo: lint → test → build → deploy to staging.
- [ ] Environments: local → dev → staging → prod, each with isolated DB, Redis, storage bucket, FCM project, payment sandbox keys.
- [ ] Base infra: Nginx, MySQL 8, Redis, queue worker, scheduler, error tracking (Sentry), centralized logs.
- [ ] Secrets management (vault/`.env` per env, never committed).

### Epic 0.2 — Contract & data model (the synchronization point)
- [ ] Author **OpenAPI 3.1** spec covering A4 endpoint catalog (request/response schemas, auth scopes, error envelope).
- [ ] Produce the **ERD** from A2; review with all leads; lock migration order.
- [ ] Freeze: response envelope, auth flow, pagination, filtering grammar, media URL shape, realtime event format.
- [ ] Stand up **mock server** (Prism/Stoplight) from the spec.
- [ ] Generate **Dart + TypeScript SDKs**; wire CI to regenerate on contract merge.
- [ ] Contract-test harness in backend (Spectator/Dredd) — red until endpoints exist.

### Epic 0.3 — Backend skeleton
- [ ] Laravel project, domain folder structure (A1.1), response-envelope macro + exception handler.
- [ ] Sanctum + spatie/permission installed; RBAC matrix (super-admin, staff perms, seller, customer).
- [ ] Baseline migrations (localization → users/roles), seeders for categories, locations, currencies, languages, roles.
- [ ] Filament installed with admin guard + 2FA scaffold.

### Epic 0.4 — Client scaffolds & design system
- [ ] Flutter scaffold: folder structure, Dio + interceptors, go_router shell, Riverpod, theme tokens, l10n setup, generated SDK wired, CI build → mock.
- [ ] Next.js scaffold: App Router, route groups, TS SDK wired, next-intl, Tailwind tokens, auth middleware stub, CI build → mock.
- [ ] **Design system tokens** locked from Figma (colors, type, spacing) and exported to both Tailwind and Flutter theme.
- [ ] Shared component inventory agreed (ad card, buttons, inputs, empty/error/skeleton states).

**Acceptance criteria (Phase 0 exit):** every squad runs its app locally, hits the mock API, and ships to staging via CI. Contract + ERD frozen and published.

---

## B1. Phase 1 — Identity, Catalog & Admin Core

> **Goal:** accounts, taxonomy, locations, settings, and the admin shell. **Depends on:** Phase 0 contract.

### Epic 1.1 — Authentication & accounts
- **Backend:**
  - [ ] register/login (email+phone), password hashing, Sanctum token issue.
  - [ ] OTP send/verify behind `OtpProviderInterface` (Firebase/Twilio/2Factor), throttled.
  - [ ] Social login (Google/Apple) token exchange → `social_accounts`.
  - [ ] Forgot/reset password; email via templated mail.
  - [ ] `/me`, `/me/preferences`, device register/unregister, **delete account** (GDPR cascade/anonymize).
  - [ ] FormRequests + API Resources + contract tests green for all of A4.1.
- **Admin:** [ ] Admin login + **2FA**; staff CRUD; roles & permissions UI (A4: staff/roles).
- **Mobile:** [ ] Splash (version/force-update, session bootstrap), onboarding carousel, login (email/phone/Google/Apple), register, OTP, forgot/reset, profile view/edit.
- **Web:** [ ] Login modal, register + OTP, forgot/reset, profile/edit page, auth cookie/session + middleware.
- **Acceptance:** a user can register → verify (OTP) → login on app **and** web; can edit profile and delete account; admin can log in with 2FA and manage staff/roles.
- **Depends on:** 0.2, 0.3.

### Epic 1.2 — Catalog (categories & custom fields)
- **Backend:** [ ] nested categories API (tree, cached), custom fields + options + category attach, filterable flags.
- **Admin:** [ ] Category management (nested, reorder, toggle, icons, ad counts); Custom Field management (type, options, attach to categories, filter by category/type).
- **Mobile:** [ ] category browse / subcategory drill-down; dynamic custom-field rendering used later in post-ad.
- **Web:** [ ] category dropdown in header; category data wired for landing pages (built in Phase 2).
- **Acceptance:** admin builds a nested category tree with custom fields; clients fetch the tree and a category's fields. **Contract frozen:** category + custom-field schemas.
- **Depends on:** 1.1 (RBAC).

### Epic 1.3 — Localization & geo
- **Backend:** [ ] countries/states/cities cascading APIs; languages (+RTL, translation files/DB); currencies + rates + scheduled refresh; `Accept-Language`/`X-Currency` middleware.
- **Admin:** [ ] Location management (countries/states/cities); Language management (add, RTL, upload admin/app translation files); Currency management (multi-currency + rates).
- **Mobile:** [ ] Settings screen (language, currency, theme, notif prefs); apply RTL + number/currency formatting app-wide.
- **Web:** [ ] locale + currency selectors in header; RTL layout switch.
- **Acceptance:** switching language/currency changes UI strings, direction, and price formatting on both clients; admin manages all locale data.
- **Depends on:** 1.1.

### Epic 1.4 — Settings hub & media pipeline
- **Backend:** [ ] `settings` store + `/settings/public`; media pipeline (`store→watermark→resize→optimize→local|s3→CDN`) as queued job; watermark + storage driver from settings.
- **Admin:** [ ] All-in-One Settings hub scaffold (General, Web, Firebase, System Status) + Watermark settings.
- **Mobile/Web:** [ ] consume `/settings/public` (branding, feature flags) at bootstrap.
- **Acceptance:** uploading an image runs the watermark/resize pipeline; admin toggles core settings; clients read public settings.
- **Depends on:** 0.3.

**Phase 1 exit:** register/verify/login works on app & web; admin manages taxonomy, locations, languages, currencies, staff, core settings.

---

## B2. Phase 2 — Listings & Discovery

> **Goal:** the core marketplace loop — post → approve → browse → search → view → favorite. **Depends on:** Phase 1 catalog. **This is the product's spine — freeze URL/slug schemes here for SEO.**

### Epic 2.1 — Ad posting & management
- **Backend:** [ ] ads CRUD; auto-slug; multi-step persistence (draft→pending); ad images upload (queued pipeline); custom-field value capture/validation against category; ad status transitions (sold/renew); `/me/ads`.
- **Admin:** [ ] Item/Ad approval & moderation queue (filters: featured/country/city; approve/reject with reason; status toggle).
- **Mobile:** [ ] Post Ad multi-step (category → details → extra/custom fields → images → location), Edit Ad, My Ads (active/pending/sold/expired; renew/boost-request/mark sold), full-screen gallery.
- **Web:** [ ] Post Ad (multi-step), Edit Ad, My Ads management dashboard section.
- **Acceptance:** seller posts an ad with images + custom fields + location; it enters pending; admin approves; it goes live. **Contract frozen:** ad, ad-image, custom-field-value schemas.
- **Depends on:** 1.2, 1.4.

### Epic 2.2 — Search, filters & geo discovery
- **Backend:** [ ] `/ads` list with filters (category/price/location/custom-field), sort, pagination; geo/nearby radius search; Google Places autocomplete proxy; `SearchEngineInterface` (DB default).
- **Admin:** [ ] (none specific — moderation covers data quality).
- **Mobile:** [ ] Search results + advanced filters; Map / nearby ads (KM radius); sort + grid/list toggle.
- **Web:** [ ] Search results + filter sidebar (Smart Search by Category); sort + grid/list views.
- **Acceptance:** filtering by category/price/location/custom field returns correct results on both clients; nearby radius works on mobile. **Contract frozen:** search/filter param grammar.
- **Depends on:** 2.1.

### Epic 2.3 — Ad detail & favorites
- **Backend:** [ ] ad detail (+views increment, related ads); favorites add/remove/list; reports submit.
- **Mobile:** [ ] Ad detail (gallery, specs, seller card, map, related, report); Favorites grid; Report ad form.
- **Web:** [ ] Ad detail page (SSR + JSON-LD `Product`), Favorites, Report flow.
- **Acceptance:** ad detail renders full info + related; users favorite/unfavorite; users report an ad.
- **Depends on:** 2.1.

### Epic 2.4 — Home & SEO surfaces
- **Backend:** [ ] `/home` (sliders + featured sections + categories); sliders + featured-sections APIs; `seo_meta` resolution; sitemap data.
- **Admin:** [ ] Slider management; Featured Section management (filters: most-liked/most-viewed/category; layout style; reorder); Customer & Seller management.
- **Mobile:** [ ] Dynamic Home (location, search, banners/sliders, categories, featured sections).
- **Web:** [ ] Home (modernized), **Category landing pages (SSR/ISR + metadata)**, Seller public profile page, `sitemap.xml` / `robots.txt` / structured data.
- **Acceptance:** home renders dynamic layout from admin config; web category/ad/seller pages render server-side with correct metadata + JSON-LD; sitemap lists live URLs. **Contract frozen:** home/slider/featured-section schemas; **URL schemes locked.**
- **Depends on:** 2.1, 2.3.

**Phase 2 exit:** end-to-end post → approve → browse → search → view → favorite works on app & web; SEO pages render server-side with metadata.

---

## B3. Phase 3 — Engagement

> **Goal:** trust + communication that drive transactions — chat, offers, follow, reviews, notifications. **Depends on:** Phase 2 listings.

### Epic 3.1 — Real-time chat & offers
- **Backend:** [ ] conversations + messages; realtime via Laravel Reverb channels (`private-conversation.{id}`) with FCM data fallback; offers (make/counter/accept/reject/withdraw); read receipts.
- **Admin:** [ ] Chat moderation (view conversations, flag/remove).
- **Mobile:** [ ] Chat list (Selling/Buying tabs, by product), Chat conversation (product card, message bubbles, timestamps), Make-an-Offer flow + offer messages.
- **Web:** [ ] Chat (list + window) in dashboard with realtime.
- **Acceptance:** buyer and seller exchange messages in real time; an offer can be made, countered, accepted; unread indicators work. **Contract frozen:** conversation/message/offer schemas + realtime event format.
- **Depends on:** 2.1, 1.1.

### Epic 3.2 — Follow, seller profiles & reviews
- **Backend:** [ ] follow/unfollow + counts; public seller profile (live ads, ratings); reviews (seller↔buyer); "Who bought?" buyer confirmation flow.
- **Admin:** [ ] Reviews & ratings moderation.
- **Mobile:** [ ] Seller public profile (live ads, ratings, follow), Followers/Following lists, Write/submit review, "Who bought?" seller confirmation.
- **Web:** [ ] Seller profile follow action, Reviews (given/received) in dashboard.
- **Acceptance:** a buyer follows a seller and leaves a review after the seller confirms the buyer; ratings aggregate on the seller profile.
- **Depends on:** 2.4 (seller profile), 3.1.

### Epic 3.3 — Reports & notifications
- **Backend:** [ ] reports management workflow; notification fan-out (`NotificationChannelInterface`) on domain events (message, approval, expiry, offer, follow); FCM push; in-app + email.
- **Admin:** [ ] Reports management; Push Notification system (compose, target user/all/segment, history).
- **Mobile:** [ ] Notifications list; report flows; FCM handling + deep links.
- **Web:** [ ] Notifications in dashboard; report flows.
- **Acceptance:** key events generate push + in-app notifications; admin sends a targeted push and sees history; reports can be resolved. **Contract frozen:** notification + report schemas.
- **Depends on:** 3.1, 0.1 (FCM project).

**Phase 3 exit:** buyers & sellers can chat, negotiate offers, follow, review, and receive push/in-app notifications.

---

## B4. Phase 4 — Monetization

> **Goal:** the revenue engine — subscriptions, payments, featured ads, AdMob. **Depends on:** Phase 2 listings. **De-risk:** start gateway spikes (sandbox + webhook plumbing) during Phase 3.

### Epic 4.1 — Packages & subscriptions
- **Backend:** [ ] packages + category-based plans (`package_category`); subscriptions lifecycle (start/expire/cancel, ad-limit enforcement on posting); renewal/expiry notifications.
- **Admin:** [ ] Package management (price/discount/final, duration, ad limit, iOS/Android product IDs, category mapping); Subscriptions/orders management.
- **Mobile:** [ ] Subscription plans (category-based), plan selection.
- **Web:** [ ] Subscription page (category-based).
- **Acceptance:** a seller picks a category plan; posting enforces the plan's ad limit/duration. **Contract frozen:** package + subscription schemas.
- **Depends on:** 2.1.

### Epic 4.2 — Payments & invoices
- **Backend:** [ ] `PaymentGatewayInterface` + drivers (launch: Stripe, Razorpay, Bank Transfer; then PayPal, Paystack, PhonePe, Flutterwave, PayTabs, DPO); payment intents; **webhooks** (signature-verified, idempotent via `webhook_events`); transactions + invoices (PDF); multi-currency pricing; tax/commission rules; refunds.
- **Admin:** [ ] Payment gateway settings (per-gateway sandbox/live, keys, supported currencies); Transactions & invoices (view, refund); Tax/commission settings.
- **Mobile:** [ ] Checkout + payment method selection, payment success/failure screens, transactions/invoices/receipts, featured boost purchase.
- **Web:** [ ] Checkout + payment + result, transactions/invoices, featured boost.
- **Acceptance:** seller buys a subscription and features an ad via at least the primary gateways (sandbox verified); invoice generated; webhook reconciles transaction status idempotently. **Contract frozen:** transaction, invoice, payment-intent/webhook schemas.
- **Depends on:** 4.1.

### Epic 4.3 — Featured ads & AdMob
- **Backend:** [ ] featured/premium ad purchase → `featured_ads` + ad flagging + expiry job; AdMob settings exposure via `/settings/public`.
- **Admin:** [ ] AdMob settings (banner/interstitial/native unit IDs, frequency cap, toggle).
- **Mobile:** [ ] AdMob placements (banner/interstitial/native), remotely toggleable; "boost ad" entry points.
- **Web:** [ ] featured ad styling on listings/home.
- **Acceptance:** a featured ad shows promoted placement until expiry; AdMob ads render in app per remote config and frequency cap.
- **Depends on:** 4.2, 2.4.

**Phase 4 exit:** a seller can buy a category subscription and feature an ad via primary gateways (sandbox verified); invoices generated; AdMob live in app.

---

## B5. Phase 5 — Content, SEO, Verification, Jobs

> **Goal:** growth, compliance, content surfaces. **Depends on:** stable URLs from Phase 2.

### Epic 5.1 — Blog & CMS
- **Backend:** [ ] blog posts + categories; CMS pages (about/terms/privacy/contact/faq); email templates.
- **Admin:** [ ] Blog/CMS management (create/edit posts, categories); CMS pages management; Email template management.
- **Mobile:** [ ] Blog list + detail; static pages (about/terms/privacy/contact).
- **Web:** [ ] Blog list + detail (SSR + JSON-LD `Article`); static pages; FAQ.
- **Acceptance:** admin publishes a blog post and edits CMS pages; both clients render them; web blog/pages are indexable.
- **Depends on:** 1.4.

### Epic 5.2 — SEO management
- **Backend:** [ ] `seo_meta` CRUD; JSON-LD builders (`Product`, `Article`, `BreadcrumbList`, `Organization`); dynamic sitemap generation job; on-demand revalidation webhook to web.
- **Admin:** [ ] SEO management (per-route/entity meta, OG images, structured-data toggles).
- **Web:** [ ] `generateMetadata` wired to `/seo`; sitemap.ts/robots.ts; full SEO audit (Rich Results, sitemap validation).
- **Acceptance:** ad/category/blog pages pass Google Rich Results test; sitemap submitted; metadata editable from admin.
- **Depends on:** 2.4, 5.1.

### Epic 5.3 — Verification (KYC)
- **Backend:** [ ] KYC submission + admin review workflow → `is_verified` badge.
- **Admin:** [ ] Verification/KYC requests (approve/reject with reason).
- **Mobile:** [ ] Verification submission (docs/selfie), badge display.
- **Web:** [ ] Verification/KYC flow in dashboard.
- **Acceptance:** user submits KYC; admin approves; verified badge appears on profile and listings.
- **Depends on:** 1.1.

### Epic 5.4 — Jobs vertical
- **Backend:** [ ] jobs as `category.type='jobs'`; job applications (resume/cover) + status.
- **Admin:** [ ] Job applications management.
- **Mobile:** [ ] Job listing + apply flow; My applications.
- **Web:** [ ] Job applications in dashboard.
- **Acceptance:** a user applies to a job listing; seller/admin sees applications.
- **Depends on:** 2.1.

### Epic 5.5 — Saved searches, AI, audit, analytics
- **Backend:** [ ] saved searches + new-match alerts (scheduled); optional Gemini AI content generation; audit logs; analytics aggregation.
- **Admin:** [ ] AI content settings (Gemini); Audit logs viewer; Reports & analytics (revenue/sales/engagement); System updates/version management.
- **Mobile:** [ ] Saved searches/alerts; empty/error/offline/loading polish across app.
- **Web:** [ ] 404/500 + error boundaries; saved searches.
- **Acceptance:** saved search notifies on new matches; admin views analytics + audit log; AI generation optional and gated.
- **Depends on:** 2.2, 3.3.

**Phase 5 exit:** content publishable; SEO surfaces validated; KYC + job-apply flows complete; account deletion compliant.

---

## B6. Phase 6 — Hardening & Launch

> **Goal:** production readiness. **Depends on:** all feature phases substantially complete.

### Epic 6.1 — Security
- [ ] OWASP ASVS review + pen test; rate-limit/abuse review; secrets audit; PII/GDPR review (incl. delete-account verification); signed media URLs.

### Epic 6.2 — Performance
- [ ] Load testing (chat + search hotspots); DB indexing/query tuning; caching strategy; image/CDN optimization; Lighthouse/Core Web Vitals on web; app cold-start tuning.

### Epic 6.3 — i18n / RTL QA
- [ ] Full localization pass incl. Arabic RTL on both clients; pseudo-localization in CI.

### Epic 6.4 — Release
- [ ] Play Store + App Store submission (Fastlane), staged rollout; backend blue/green / zero-downtime deploy; backups, monitoring, alerting, runbooks; store-compliance checklist (account deletion, ads, IAP).

### Epic 6.5 — Acceptance
- [ ] End-to-end UAT across roles (customer/seller/staff/admin); soft launch → production sign-off.

**Phase 6 exit:** all critical/high bugs closed; monitoring & backups live; apps approved in stores; production sign-off.

---
---

# Part C — Execution

## C1. Per-Squad Backlogs

Same work as Part B, re-sliced by who owns it. Use this to staff and load-balance.

### Platform/DevOps (1–2)
Phase 0 owner. Repos, CI/CD, environments, infra (Nginx/MySQL/Redis/queue/scheduler), secrets, observability (Sentry, logs, uptime), the **OpenAPI contract tooling + mock server + SDK generation**. Ongoing: keep SDKs regenerating, run contract tests in CI, manage staging/prod deploys, backups.

### Backend/API (2–3)
Owns every `Domain/*` context and the public API.
- P1: auth/OTP/social, users, RBAC, catalog, locations, currencies, languages, settings, media pipeline.
- P2: ads CRUD, search/geo, favorites, home/sliders/featured, approval workflow.
- P3: chat/offers (Reverb), follow, reviews, reports, notifications fan-out.
- P4: packages/subscriptions, `PaymentGatewayInterface` + drivers, webhooks, invoices, tax.
- P5: blog/CMS, SEO service, KYC, jobs, saved searches, audit, analytics, optional Gemini.

### Admin Panel (1–2)
Owns the Filament panel (42 screens). Tracks each backend domain one step behind: taxonomy + staff/roles + locale + settings (P1) → moderation + sliders + featured + user/seller mgmt (P2) → chat/review/report moderation + push composer (P3) → packages/subscriptions/transactions/gateways/tax (P4) → blog/CMS/SEO/KYC/jobs/email-templates/audit/analytics/AI (P5).

### Mobile — Flutter (2)
Owns 40 screens. P1: splash/onboarding/auth/profile/settings shell. P2: home/browse/search/map/ad-detail/post-ad/my-ads/favorites/report. P3: chat/offers/seller/follow/reviews/notifications. P4: subscription/checkout/payments/transactions/AdMob. P5: blog/static/verification/jobs/saved-searches/delete-account + global states. P6: store submission via Fastlane.

### Web — Next.js (1–2)
Owns 26 pages, **owns SEO**. P1: layout/header/auth/profile. P2: home + **SSR category/ad/seller pages** + search + my-ads + favorites + sitemap/robots. P3: chat/reviews/notifications dashboard. P4: subscription/checkout/transactions. P5: blog/static (SSR) + verification + jobs + SEO audit + error pages. P6: Core Web Vitals.

### QA/Automation (1)
Contract tests (with Platform), feature/widget/component test standards, critical-path E2E (post→approve→browse→chat→pay), release QA, i18n/RTL pass, security/load test coordination in P6.

---

## C2. Cross-Team Sequencing

```
P0 Foundation ─────────────────────────────────────────────► (blocks everything)
   └─ contract + mock + SDKs frozen
        │
        ▼
P1 Identity/Catalog/Admin-core ──► P2 Listings/Discovery ──► P3 Engagement
                                          │                       │
                                          ├──► P4 Monetization ◄──┘ (gateway spikes start in P3)
                                          │
                                          └──► P5 Content/SEO/KYC/Jobs (needs frozen URLs from P2)
                                                       │
                                                       ▼
                                                 P6 Hardening & Launch
```

**Hard rules**
- Phase 0 contract + mock server are what let P1–P5 parallelize. Do not start feature code before the envelope/auth/pagination are frozen.
- Catalog (P1) blocks Listings (P2); Listings block Engagement (P3) and Featured ads (P4).
- Freeze slug/URL schemes in P2 — SEO (P5) and all crawlable pages depend on them never breaking.
- Notification infra (P3) is reused by Monetization (renewal/expiry) and Content (announcements) — build it generic.
- Payments (P4): begin sandbox + webhook spikes during P3 to de-risk the 8-gateway surface; launch 2–3 gateways, add the rest behind the interface post-launch.

---

## C3. Definition of Done (per feature)

A task/story is done only when **all** hold:
- [ ] API endpoint matches OpenAPI; **contract test green**.
- [ ] Unit + feature tests (backend); widget/component tests (clients); critical-path covered by E2E.
- [ ] i18n strings externalized; RTL-safe.
- [ ] Handles empty / error / loading / offline states.
- [ ] Authorization enforced (role/permission) and validated server-side.
- [ ] Accessibility basics on web (labels, contrast, focus).
- [ ] Observability: logs/metrics for new flows; errors → Sentry.
- [ ] Money in minor units; amounts currency-tagged; idempotency on payment paths.
- [ ] Docs updated (contract, admin help where relevant).

---

## C4. Appendices

### C4.1 Environment matrix
| Concern | local | dev | staging | prod |
|---|---|---|---|---|
| DB | local MySQL | isolated | isolated | managed/replicated |
| Payments | sandbox | sandbox | sandbox | live |
| FCM | dev project | dev | staging | prod |
| Storage | local disk | bucket | bucket | bucket + CDN |
| OTP | log/stub | sandbox | sandbox | live |
| Maps key | dev (restricted) | dev | staging | prod (restricted) |

### C4.2 Naming & convention cheatsheet
- **Routes:** `/api/v1/{resource}` plural, kebab; admin under `/api/v1/admin/*`.
- **DB:** snake_case tables (plural) & columns; FKs `{singular}_id`; pivots `{a}_{b}` alphabetical.
- **JSON fields:** snake_case (matches DB; SDKs map to language idioms).
- **Slugs:** lowercase, hyphenated, unique per type; immutable once published.
- **Money:** `amount` (BIGINT minor units) + `currency_code` (CHAR(3)) — never floats.
- **Enums:** lowercase string enums, documented in OpenAPI.
- **Events:** PascalCase (`AdApproved`); queues by priority (`high`, `default`, `media`).

### C4.3 Seed data (Phase 0)
- Roles + permissions (super-admin, staff perms, seller, customer).
- Categories (the spec's set: Home Appliances, Furniture & Home/Garden, Clothing & Accessories, Pets, Electronics, Cameras & Imaging, Jewelry & Watches, Mobile Phones & Tablets, Consoles & Video Games, Jobs, Musical Instruments, Sports Equipment, Cars & Vehicles, Real Estate) with sample custom fields (Breed, Behavior, Registration, Health Condition, Vaccination Status, Size; Kilometer, Fuel Type, Body Type, Transmission; Screen Size; etc.).
- Locations (seed countries/states/cities incl. Bhuj/Surat/Gujarat/India, Dubai/UAE, Toronto/Canada for parity with spec screens).
- Currencies (USD, INR, AED, EUR…) + default; Languages (EN default + AR for RTL test).
- Default settings, email templates, CMS pages (about/terms/privacy/contact/faq).

### C4.4 Open decisions to confirm
- Admin UI: **Filament 3** (recommended) vs Blade+Vue/Inertia.
- Realtime: **Laravel Reverb** (self-host WS) vs Pusher vs FCM-data-only.
- Search: DB FULLTEXT for launch vs Meilisearch from day one.
- Launch payment gateways (recommend Stripe + Razorpay + Bank Transfer) and launch regions/currencies.
- Storage: local+CDN vs AWS S3 at launch.

---

*This development guide operationalizes [`ClassiAds_Hub_Master_Plan.md`](ClassiAds_Hub_Master_Plan.md). Next concrete artifacts I can generate on request: the **OpenAPI 3.1 spec** (from A4), the **ERD diagram** (from A2), the **Laravel migration set**, or a **sprint-loaded backlog** (Part B tasks mapped to 2-week sprints).*

---
---

# Part D — Implementation Updates (2026-06-05)

> Living log of what's actually been built since the spec was frozen. Sections A–C above describe the **target architecture**; this section documents the **current code on disk** with file paths and caveats. When the two disagree, **this section wins** until A–C are revised.

## D1. Mobile — Firebase, Maps, Location, Screens

### D1.1 Package additions

[`mobile/pubspec.yaml`](mobile/pubspec.yaml) now declares the full Firebase suite + maps/geolocation/local-notifications stack:

| Package | Version | Purpose |
|---|---|---|
| `firebase_core` | `^3.8.0` | Required base for every FlutterFire plugin |
| `firebase_auth` | `^5.4.0` | Google / Apple social sign-in |
| `cloud_firestore` | `^5.5.0` | NoSQL data (unused yet — wired for future use) |
| `firebase_storage` | `^12.3.6` | File bucket (unused yet) |
| `firebase_messaging` | `^15.1.5` | FCM push + foreground bridge |
| `firebase_analytics` | `^11.3.5` | Event tracking (unused yet) |
| `firebase_crashlytics` | `^4.1.5` | Mobile-only crash reporting (web no-op) |
| `firebase_remote_config` | `^5.1.5` | Feature flags (unused yet) |
| `flutter_local_notifications` | `^19.0.0` | Foreground push UI + ad-hoc local notifs |
| `google_maps_flutter` | `^2.12.1` | Real maps (replaces faux `_LocationMap`) |
| `geolocator` | `^14.0.0` | Device GPS |
| `geocoding` | `^4.0.0` | Reverse-geocode lat/lng → "City, Country" |

### D1.2 Centralised secrets

[`mobile/lib/core/config/app_config.dart`](mobile/lib/core/config/app_config.dart) — `AppConfig.googleMapsApiKey` constant, overridable at build time via `--dart-define=GOOGLE_MAPS_KEY=…`. Same key is duplicated in `AndroidManifest.xml`, `AppDelegate.swift`, and `web/index.html`; to rotate, search-and-replace the value across those four files.

### D1.3 New shared services

| File | Purpose |
|---|---|
| [`mobile/lib/core/services/location_service.dart`](mobile/lib/core/services/location_service.dart) | `currentPosition()` (returns null on permission deny — no try/catch needed at call-sites), `describe(lat,lng)` reverse-geocode. Exposed via `locationServiceProvider`. |
| [`mobile/lib/core/services/notification_service.dart`](mobile/lib/core/services/notification_service.dart) | Single init point. Creates Android channel `classiads_default`, requests iOS + Android-13 permission, bridges `FirebaseMessaging.onMessage` → local notifications (FCM hides foreground pushes by default), routes cold-launch/background/in-app taps through `taps` stream. Web-safe (no-ops where `flutter_local_notifications` has no backend). |
| [`mobile/lib/core/firebase/firebase_providers.dart`](mobile/lib/core/firebase/firebase_providers.dart) | One Riverpod `Provider<…>` per FlutterFire instance (`firebaseAuthProvider`, `firestoreProvider`, …). `authStateProvider` is a `StreamProvider<User?>`. Crashlytics provider returns `null` on web. |
| [`mobile/lib/core/firebase/firebase_auth_service.dart`](mobile/lib/core/firebase/firebase_auth_service.dart) | `signInWithGoogle()`, `signInWithApple()`, `signOut()`. Uses `signInWithProvider` natively on iOS/Android (no `google_sign_in` dep), `signInWithPopup` on Web. Returns `FirebaseSignInResult` carrying `idToken` for backend exchange. |

### D1.4 Bootstrap wiring

[`mobile/lib/main.dart`](mobile/lib/main.dart) now does, in order:
1. `WidgetsFlutterBinding.ensureInitialized()`
2. `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`
3. `FlutterError.onError` → `FirebaseCrashlytics.recordFlutterFatalError` (skipped on web)
4. `PlatformDispatcher.instance.onError` → `Crashlytics.recordError(fatal: true)` (skipped on web)
5. Top-level `@pragma('vm:entry-point')` background message handler registered with `FirebaseMessaging.onBackgroundMessage`
6. `SharedPreferences.getInstance()`
7. Bootstraps a `ProviderContainer` and calls `notificationServiceProvider.initialize()` **before** `runApp` so push permission is requested at first launch
8. `runApp(UncontrolledProviderScope(container: container, child: ClassiAdsApp()))`

### D1.5 Native platform config

**Android — [`mobile/android/app/src/main/AndroidManifest.xml`](mobile/android/app/src/main/AndroidManifest.xml)**

| Permission | Required by |
|---|---|
| `INTERNET` | Always |
| `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` | `google_maps_flutter` + `geolocator` |
| `POST_NOTIFICATIONS` | `flutter_local_notifications` on Android 13+ |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE` | Scheduled local notifs survive reboots |

| `<meta-data>` | Value |
|---|---|
| `com.google.android.geo.API_KEY` | `AIzaSyB53YOSHYscLVfwIVnAhnK8XsjYGD9vc1Y` (Maps SDK for Android) |
| `com.google.firebase.messaging.default_notification_channel_id` | `classiads_default` (matches `NotificationService._defaultChannel.id`) |

**iOS — [`mobile/ios/Runner/AppDelegate.swift`](mobile/ios/Runner/AppDelegate.swift)** imports `GoogleMaps` and calls `GMSServices.provideAPIKey(...)` in `didFinishLaunchingWithOptions`.

**iOS — [`mobile/ios/Runner/Info.plist`](mobile/ios/Runner/Info.plist)** adds:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `io.flutter.embedded_views_preview = true`

**Web — [`mobile/web/index.html`](mobile/web/index.html)** adds:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIza…&libraries=places&loading=async"></script>
```

### D1.6 Real Google Map replaces the faux painter

[`mobile/lib/features/ads/screens/ad_detail_screen.dart`](mobile/lib/features/ads/screens/ad_detail_screen.dart) `_LocationMap`:
- **Removed:** `_RoadPainter` `CustomPaint` (faux roads + navy radius circle).
- **Added:** `GoogleMap` widget at 200dp, marker at `ad.latitude/longitude`, tap-to-open in external Google Maps, white pill label bottom-left. Graceful fallback card (`Icons.location_off_outlined` + city name) when an ad has no coords.

### D1.7 Google sign-in on the login screen

[`mobile/lib/features/auth/screens/login_screen.dart`](mobile/lib/features/auth/screens/login_screen.dart) — "Continue with Google" now calls `_continueWithGoogle()` which routes through `firebaseAuthServiceProvider.signInWithGoogle()`. On success the user is signed into **Firebase only** (not Laravel) and pushed to `/home` with a snack. A `TODO(backend)` is left in code: ship `POST /auth/firebase` that accepts `result.idToken`, verifies it server-side with Firebase Admin SDK, and returns a Laravel session token so the two identities can be linked.

### D1.8 Post-login location prompt + nearby GPS

[`mobile/lib/features/auth/screens/location_prompt_screen.dart`](mobile/lib/features/auth/screens/location_prompt_screen.dart) — "What's your location?" screen, shown once after first authentication (gated by `appPrefs.locationPrompted`). "Find My Location" → `LocationService.currentPosition()` → reverse-geocode → save label → navigate `/home`. CustomPainter illustration (person + giant pin) keeps the screen asset-free.

[`mobile/lib/features/ads/screens/nearby_screen.dart`](mobile/lib/features/ads/screens/nearby_screen.dart) — initState bootstraps device GPS; falls back to Mumbai (`19.0760, 72.8777`) on permission deny. Icon flips between `my_location` and `location_off`; helper hint text appears in fallback mode.

### D1.9 New profile + onboarding screens

| Screen | File | Route | Notes |
|---|---|---|---|
| Onboarding (3 slides) | [`onboarding_screen.dart`](mobile/lib/features/auth/screens/onboarding_screen.dart) | `/onboarding` | Uses `assets/slide1.png` … `slide3.png`. Language pill + amber Skip pill in header. |
| Featured Ads | [`featured_ads_screen.dart`](mobile/lib/features/profile/screens/featured_ads_screen.dart) | `/featured-ads` | Filters `myAdsProvider` to `is_featured == true`; empty state uses `emty-data.png`. |
| Reviews received | [`reviews_screen.dart`](mobile/lib/features/profile/screens/reviews_screen.dart) | `/reviews` | `withFallback()` → `/reviews/received` with 3 dummy entries. 5-star (half-star supported). |
| Job Applications | [`job_applications_screen.dart`](mobile/lib/features/profile/screens/job_applications_screen.dart) | `/applications` | `withFallback()` → `/job-applications/mine`; status pill (pending/reviewing/accepted/rejected) with semantic color. |
| Language | [`language_screen.dart`](mobile/lib/features/profile/screens/language_screen.dart) | `/language` | Persists via `appPrefs.setLanguage()`; checkmark on active. |
| Categories grid | [`categories_screen.dart`](mobile/lib/features/home/screens/categories_screen.dart) | `/categories` | 3-col grid with 3-2 tint stripe. |

All registered in [`mobile/lib/core/router/app_router.dart`](mobile/lib/core/router/app_router.dart) `_protected` list where appropriate.

### D1.10 Subscriptions screen — Ad Listing Plan layout

[`mobile/lib/features/monetization/subscriptions_screen.dart`](mobile/lib/features/monetization/subscriptions_screen.dart) — full rewrite. Category card (Classifieds w/ edit pencil → category bottom sheet), 3 plan cards (hexagon tier badge + name + radio button), ads/days line, discount pill + strikethrough price, Features List + Categories Included with **View More** expansion, sticky bottom **Purchase** button (disabled until selection) → routes to `/checkout`. Dummy package data in [`mobile/lib/core/dummy/dummy_data.dart`](mobile/lib/core/dummy/dummy_data.dart) extended with `tier`, `features[]`, `categories_included[]`, `original_price_display`, `discount_percent`.

---

## D2. Admin Panel — Dashboard redesign

### D2.1 Welcome widget (replaces `AccountWidget`)

[`backend/app/Filament/Widgets/WelcomeWidget.php`](backend/app/Filament/Widgets/WelcomeWidget.php) + [`backend/resources/views/filament/widgets/welcome.blade.php`](backend/resources/views/filament/widgets/welcome.blade.php) — minimal card showing only avatar (navy circle with name initial) and "Welcome, {name}". Stripped Filament's default "Super Admin" subtitle and "Sign out" button (still available in the topbar user menu).

Registered in [`AdminPanelProvider.php`](backend/app/Providers/Filament/AdminPanelProvider.php) instead of `AccountWidget::class`; `AccountWidget` + `FilamentInfoWidget` imports removed.

### D2.2 Dashboard widget layout

Sort + columnSpan flow on the dashboard:

| Widget | Sort | columnSpan | Row |
|---|---|---|---|
| `WelcomeWidget` | 0 | `full` | 1 |
| `StatsOverviewWidget` | 1 | (default) | 2 |
| [`RevenueChartWidget`](backend/app/Filament/Widgets/RevenueChartWidget.php) | 2 | `['default' => 'full', 'md' => 'half']` | 3 left |
| [`AdsByLocationChartWidget`](backend/app/Filament/Widgets/AdsByLocationChartWidget.php) | 3 | `['default' => 'full', 'md' => 'half']` | 3 right |
| [`AdsMapWidget`](backend/app/Filament/Widgets/AdsMapWidget.php) | 4 | `full` | 4 |
| [`LatestPendingAdsWidget`](backend/app/Filament/Widgets/LatestPendingAdsWidget.php) | 5 | `full` | 5 |

Revenue and Ads-by-location now share row 3 as half-width (6/12) on `md` and up; stack on mobile.

### D2.3 Stats overview — current state ⚠️

[`backend/app/Filament/Widgets/StatsOverviewWidget.php`](backend/app/Filament/Widgets/StatsOverviewWidget.php) — currently **on disk** as the standard Filament `StatsOverviewWidget` extending `BaseWidget` with `getStats()` returning four `Stat::make()` instances. Description icons (`heroicon-m-users`, `…-megaphone`, `…-rectangle-stack`, `…-banknotes`) render inline next to the description text.

A gradient-hero custom Blade view ([`stats-overview.blade.php`](backend/resources/views/filament/widgets/stats-overview.blade.php), with `.stat-hero` CSS class and animated icon badges) **still exists on disk but is currently orphaned** — no PHP class references it. To re-enable that styling, swap the class back to a plain `Widget` subclass with `protected string $view = 'filament.widgets.stats-overview';` and a `getViewData()` method returning `$stats`.

### D2.4 Filament theming

[`AdminPanelProvider.php`](backend/app/Providers/Filament/AdminPanelProvider.php) injects 5 render hooks:
- `TOPBAR_START` — logo with link to `/admin`
- `STYLES_AFTER` — global CSS overrides (navy sidebar `#272757`, white-on-navy hover, page bg `#E4E4EE`, navy `.fi-btn`)
- `AUTH_LOGIN_FORM_BEFORE`, `AUTH_REGISTER_FORM_BEFORE`, `AUTH_PASSWORD_RESET_*_BEFORE` — auth-page logo

Panel theme is locked to `Light` via `defaultThemeMode(ThemeMode::Light)`. `brandName('')` removes the text-logo from the topbar so the image is the only brand element.

### D2.5 Revenue chart palette

[`RevenueChartWidget.php`](backend/app/Filament/Widgets/RevenueChartWidget.php) uses brand navy: `borderColor: '#272757'`, `backgroundColor: 'rgba(39, 39, 87, 0.15)'`.

---

## D3. Backend — CMS + seed data

### D3.1 CMS pages

[`backend/database/seeders/ContentSeeder.php`](backend/database/seeders/ContentSeeder.php) seeds rich HTML bodies for `about`, `contact`, `faq`, `terms`, `privacy`, `refund`. Heredoc syntax (`<<<'HTML' … HTML;`) keeps escapes minimal.

### D3.2 Package dummy data

[`backend/`](backend/) is the source of truth in prod, but the **mobile** dummy fixture at [`mobile/lib/core/dummy/dummy_data.dart`](mobile/lib/core/dummy/dummy_data.dart) — used by `withFallback()` when the API is down — was extended with the richer fields (`tier`, `features`, `categories_included`, `original_price_display`, `discount_percent`). The backend `Package` model + `PackageResource` need matching columns when the actual `/packages` endpoint is brought online so the UI stays compatible.

---

## D4. Outstanding / pending

These were intentionally left for follow-up turns. Each is small and self-contained.

### D4.1 Critical blockers (build won't pass until done)

- [ ] **`mobile/lib/firebase_options.dart` is missing.** Generated by `flutterfire configure`. Until it exists, `flutter analyze lib/main.dart` reports 3 errors (URI not found, `DefaultFirebaseOptions` undefined ×2). The Google account `hardik.disolutions@gmail.com` was identified earlier as the owner of the `classiads-hub` Firebase project; the user must run `firebase login:add` (browser flow), then:
  ```powershell
  flutterfire configure --account=hardik.disolutions@gmail.com --project=classiads-hub --yes --platforms=android,ios,web --out=lib/firebase_options.dart
  ```

### D4.2 Native config still needed for full feature parity

- [ ] **Crashlytics Android Gradle plugin** — add `id("com.google.firebase.crashlytics")` to `android/app/build.gradle.kts` plugins block + `classpath("com.google.firebase:firebase-crashlytics-gradle:3.0.2")` in root `build.gradle.kts`. Required to upload symbol mappings for de-obfuscated crash reports.
- [ ] **iOS push capabilities** — open `ios/Runner.xcworkspace` in Xcode → Signing & Capabilities → add **Push Notifications** + **Background Modes (Remote notifications)**. Generate an APNs auth key (.p8) in the Apple Developer portal and upload it to Firebase console → Cloud Messaging.
- [ ] **Web FCM service worker** — drop `mobile/web/firebase-messaging-sw.js` to receive pushes on web. Until then, web pushes do not fire.
- [ ] **Android notification icon** — currently uses `@mipmap/ic_launcher`. Production should ship a dedicated `res/drawable/ic_stat_notification.png` (white-on-transparent) for proper status-bar rendering.

### D4.3 Backend endpoints referenced by mobile but not yet implemented

- [ ] `POST /auth/firebase` — exchanges a Firebase ID token (from `FirebaseSignInResult.idToken`) for a Laravel Sanctum session token. Without this, Google sign-in works against Firebase but the user remains anonymous to the Laravel API.
- [ ] `/reviews/received` — feeds the My Reviews screen (currently dummy data via `withFallback()`).
- [ ] `/job-applications/mine` — feeds the My Job Applications screen (currently dummy data).
- [ ] `/packages` — return shape needs to include the new fields (`tier`, `features`, `categories_included`, `original_price_display`, `discount_percent`) the redesigned Subscriptions screen expects.

### D4.4 Admin polish

- [ ] **Re-enable the gradient-hero stat cards.** [`stats-overview.blade.php`](backend/resources/views/filament/widgets/stats-overview.blade.php) is on disk but orphaned (see D2.3). Either rewrite `StatsOverviewWidget.php` to extend plain `Widget` + reference the view, or delete the orphaned Blade to avoid confusion.

### D4.5 API-key hygiene (before prod)

- [ ] The Google Maps key `AIzaSyB…vc1Y` is currently unrestricted and committed in four places. In the Google Cloud Console, lock it by app bundle ID / SHA-1 (Android), bundle ID (iOS), and HTTP referrer (Web). Consider building the prod APK/IPA with `--dart-define=GOOGLE_MAPS_KEY=…` so the key isn't grep-able from a decompiled bundle.

---

*If A6 (Mobile Architecture) or A8 (Admin Architecture) drift further from on-disk reality, fold the deltas from D1/D2 back into those sections during the next planning cycle. This Part D is meant to be transient — a working journal, not a permanent spec.*

