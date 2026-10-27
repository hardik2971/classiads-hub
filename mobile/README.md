# ClassiAds_Hub — Mobile App (Flutter)

Native Android/iOS buyer-seller marketplace client (Master Plan §4.1), consuming
the Laravel API (`/api/v1`). Flutter 3.41 · **Riverpod 3 · Dio · go_router · flutter_secure_storage**.

## Run

```bash
# Ensure the backend API is running (see ../backend/README.md) on :8000
cd F:\DI_PMS_Project\classify\mobile
flutter pub get
flutter run                # pick an Android emulator / device / Chrome
```

API base URL auto-selects per platform (`lib/core/config/app_config.dart`):
- Android emulator → `http://10.0.2.2:8000/api/v1`
- everything else → `http://127.0.0.1:8000/api/v1`
- override: `flutter run --dart-define=API_BASE_URL=https://api.example.com/api/v1`

## Architecture

- **State**: Riverpod 3 (`Notifier`, `FutureProvider`, `Provider`).
- **Networking**: `ApiClient` (Dio) unwraps the `{success,data,message,meta,errors}`
  envelope → `ApiException`; bearer token injected from `flutter_secure_storage`.
- **Routing**: `go_router` with auth-gated `redirect` + `StatefulShellRoute`
  bottom nav (Home · Chat · ➕ · My Ads · Profile).
- **Session**: `AuthController` (`Notifier<AuthState>`) bootstraps the stored token
  and exposes login/register/logout; the router reacts to auth changes.
- **Theme**: Material 3 light/dark (`AppTheme`), mode persisted in prefs.

## Screens — all 40 of §4.1

Splash · Onboarding · Login · Register · OTP · Forgot/Reset · Home (location,
search, **banners/sliders**, categories, featured) · Category browse · Search +
advanced filters · **Map/Nearby (KM radius)** · Ad detail (gallery, specs, seller,
map card, related, report) · **Full-screen pinch-zoom gallery** · Post Ad
(multi-step + **photo upload**) · **Edit Ad** · My Ads (renew/mark-sold/delete) ·
**Make Offer** · Chat list · Chat conversation · Seller profile + follow ·
**Followers/Following** · **Write review** · **"Who bought?"** · **Report form** ·
Favorites · Notifications · Profile · Edit Profile · Subscription plans ·
**Checkout (payment method)** · **Payment success/failure** · **Transactions/
invoices** · **KYC Verification** · **Saved searches** · Settings · Blog list ·
Blog detail · **Static CMS pages** · **Jobs + apply** · Delete account · global
loading/empty/error states · **AdMob banner placement**.

## Dummy-data fallback

Every repository/provider is wrapped with `withFallback(fetch, dummy)`
(`core/utils/fallback.dart`): if the API can't be reached, the screen renders
**sample data** from `core/dummy/dummy_data.dart` instead of an error — so every
screen always shows content (great for demos/offline). Real data is used whenever
the backend responds.

## Status

**All 40 §4.1 screens implemented.** `flutter analyze` → 0 errors (style lints
only); `flutter build web` → success (full compilation). Photo upload uses
`image_picker` (works on Android/iOS/web). AdMob is a placeholder widget — swap in
`google_mobile_ads` once an AdMob account + ad-unit IDs exist (the SDK isn't
web-compatible, so the placeholder keeps the app building everywhere).
