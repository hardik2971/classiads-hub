# ClassiAds_Hub — Database Schema (implementation reference)

> Phase 0 deliverable. Each table below maps 1:1 to a Laravel migration.
> Conventions: `id` = BIGINT unsigned PK; timestamps `created_at`/`updated_at`;
> soft deletes (`deleted_at`) where noted; money stored in **minor units** (BIGINT) + `currency_code`.
> Engine InnoDB, charset `utf8mb4`, collation `utf8mb4_unicode_ci`.

Legend: 🔑 PK · 🔗 FK · ⚑ indexed · ∅ nullable

---

## Phase 1 — Identity, Access, Catalog, Geo, Settings

### Identity & Access

**users**
| col | type | notes |
|---|---|---|
| id | bigint 🔑 | |
| name | varchar(150) | |
| email | varchar(191) ∅ | unique (where not null) ⚑ |
| phone | varchar(32) ∅ | unique (where not null) ⚑ |
| email_verified_at | timestamp ∅ | |
| phone_verified_at | timestamp ∅ | |
| password | varchar(255) ∅ | nullable for social-only |
| avatar_path | varchar(255) ∅ | |
| status | enum(active,suspended,banned) | default active ⚑ |
| is_verified | boolean | KYC verified badge, default false |
| preferred_language | varchar(8) ∅ | |
| preferred_currency | varchar(8) ∅ | |
| last_login_at | timestamp ∅ | |
| created_at/updated_at/deleted_at | | soft deletes |

**seller_profiles** (1:1 user, optional)
| col | type | notes |
|---|---|---|
| id | bigint 🔑 | |
| user_id | bigint 🔗 users ⚑ unique | |
| display_name | varchar(150) ∅ | |
| bio | text ∅ | |
| business_name | varchar(191) ∅ | |
| website | varchar(191) ∅ | |
| rating_avg | decimal(3,2) | default 0 |
| rating_count | int | default 0 |
| member_since | date ∅ | |

**social_accounts** (Google/Apple)
- id, user_id 🔗⚑, provider enum(google,apple), provider_user_id varchar(191), unique(provider, provider_user_id), timestamps

**user_devices** (FCM tokens)
- id, user_id 🔗⚑, fcm_token varchar(255) ⚑, platform enum(android,ios,web), last_active_at, timestamps

**otp_verifications**
- id, identifier varchar(191) ⚑ (email/phone), channel enum(sms,email), provider enum(firebase,twilio,twofactor), code_hash varchar(255), attempts tinyint default 0, expires_at, consumed_at ∅, timestamps

> RBAC tables (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`) come from **spatie/laravel-permission** migration. Roles seeded: `super-admin`, `admin`, `staff`, `seller`, `customer`.

Laravel built-ins: `password_reset_tokens`, `personal_access_tokens` (Sanctum), `sessions`, `jobs`, `job_batches`, `failed_jobs`, `cache`.

### Catalog

**categories** (self-referencing, nested)
| col | type | notes |
|---|---|---|
| id | bigint 🔑 | |
| parent_id | bigint ∅ 🔗 categories ⚑ | |
| name | varchar(150) | |
| slug | varchar(191) | unique ⚑ |
| icon_path | varchar(255) ∅ | |
| image_path | varchar(255) ∅ | |
| type | enum(standard,job,property) | default standard — drives custom flows |
| sort_order | int | default 0 ⚑ |
| is_active | boolean | default true ⚑ |
| ads_count | int | denormalized counter, default 0 |
| created_at/updated_at | | |

**custom_fields**
- id, name varchar(150), code varchar(100) ⚑, type enum(text,number,dropdown,radio,checkbox,boolean,date), icon_path ∅, is_required bool, is_filterable bool, sort_order int, timestamps

**custom_field_options** (for dropdown/radio/checkbox)
- id, custom_field_id 🔗⚑, label varchar(150), value varchar(150), sort_order int, timestamps

**category_custom_field** (pivot, which fields apply to which category)
- id, category_id 🔗⚑, custom_field_id 🔗⚑, is_required bool ∅ (override), sort_order int, unique(category_id, custom_field_id)

### Geography & Localization

**countries** — id, name, iso2 char(2) ⚑, iso3 char(3), phone_code varchar(8), currency_code varchar(8) ∅, is_active bool, timestamps
**states** — id, country_id 🔗⚑, name, code varchar(16) ∅, is_active bool, timestamps
**cities** — id, state_id 🔗⚑, country_id 🔗⚑, name, latitude decimal(10,7) ∅, longitude decimal(10,7) ∅, is_active bool, timestamps
**languages** — id, name, code varchar(8) ⚑ unique, flag_path ∅, is_rtl bool default false, is_default bool default false, is_active bool, timestamps
**currencies** — id, code varchar(8) ⚑ unique, symbol varchar(8), name, is_default bool default false, decimal_digits tinyint default 2, is_active bool, timestamps
**currency_rates** — id, base_code varchar(8) ⚑, quote_code varchar(8) ⚑, rate decimal(18,8), fetched_at, unique(base_code, quote_code)

### Settings & System

**settings** — id, group varchar(64) ⚑, key varchar(128) ⚑, value longtext ∅, type enum(string,int,bool,json,secret) default string, unique(group, key)
**email_templates** — id, code varchar(100) ⚑ unique, subject varchar(191), body_html longtext, variables json ∅, is_active bool, timestamps
**audit_logs** — id, user_id ∅ 🔗⚑, action varchar(100) ⚑, auditable_type varchar(191) ∅, auditable_id bigint ∅, changes json ∅, ip varchar(45) ∅, created_at ⚑

---

## Phase 2+ (designed now, migrated later)

- **ads**, **ad_images**, **ad_custom_field_values**, **ad_slugs**, **favorites**, **saved_searches**, **featured_sections**, **sliders**
- **conversations**, **messages**, **offers**, **follows**, **reviews**, **reports**, **notifications**
- **packages**, **package_category**, **subscriptions**, **transactions**, **invoices**, **payment_gateways**, **featured_ads**, **admob_settings**
- **blog_posts**, **blog_categories**, **pages**, **seo_meta**, **verification_requests**, **jobs_listings**, **job_applications**

(Full columns added when each phase is implemented — see Master Plan §3 & §7.)
