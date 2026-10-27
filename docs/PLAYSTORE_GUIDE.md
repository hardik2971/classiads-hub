# ClassiAds Hub — Google Play release guide

Everything needed to publish the Android app, in order. Files referenced here are in this repo.

| Item | Value |
|---|---|
| App name | ClassiAds Hub |
| Package (applicationId) | `com.classiads.classiads_hub` — permanent once uploaded |
| Version | `1.0.0` (versionCode `1`) — from `mobile/pubspec.yaml` `version: 1.0.0+1` |
| Release bundle | `store/playstore/classiadshub-1.0.0-1.aab` (copy of `mobile/build/app/outputs/bundle/release/app-release.aab`, signed with the upload key) |
| Upload keystore | `secret/classiadshub-upload.jks` (alias `upload`, passwords in `secret/classiadshub-upload.properties`) |
| Store assets | `store/playstore/` |
| Privacy policy | https://classiadshub.web.app/page/privacy |
| Account deletion | In app: Profile → Delete Account. Web: https://classiadshub.web.app/dashboard/profile |

---

## 0. Before you start

**The app has no in-app purchases.** Premium plans, featured-ad checkout and transaction history were removed from the Android app, so Google Play Billing rules do not apply. Paid plans and featured ads are sold only on the website, through Stripe, Razorpay and PayPal (§8).

1. **Turn on the website payment gateways:** run `node tools/payments/setup-payments.mjs` once (§8). It also switches off the Sandbox and Bank Transfer options.
2. **Fix the map on Android:** do §9.1 (Google Maps key).
3. **Turn on Google sign-in:** do §9.2.
4. **Clean QA test data from the live database** (conversations/offers/reviews left by the QA run):
   ```bash
   cd tools/qa
   GOOGLE_APPLICATION_CREDENTIALS=../../secret/classiadshub-firebase.json node cleanup-qa-data.js --dry   # preview
   GOOGLE_APPLICATION_CREDENTIALS=../../secret/classiadshub-firebase.json node cleanup-qa-data.js         # delete
   ```
   It keeps the migrated data, demo ads 1–6 and the demo conversation #17.
5. **Image credits.** Demo ads 2, 4, 5 and 6 use CC-BY photos (see `docs/IMAGE_CREDITS.md`). Credit them or replace the photos if the demo ads stay public.

---

## 1. Back up the upload key (do this today)

Copy **`secret/classiadshub-upload.jks`** and **`secret/classiadshub-upload.properties`** to two safe places, for example a password manager and an offline drive.

With Play App Signing a lost upload key can be reset through Google support, but it takes days. Never commit these files.

Upload-key fingerprints (already registered in Firebase):
- SHA-1 `10:A9:18:AB:9B:4A:F0:4C:18:07:60:3F:10:1A:6C:0E:81:13:FA:FF`
- SHA-256 `C5:E3:4D:7B:18:84:54:91:F7:A4:FA:7D:91:CF:AA:B6:0A:E2:E6:44:A6:DC:5E:03:2E:C6:D6:4B:0C:9E:5D:56`

## 2. Build the release bundle

```bash
cd mobile
flutter clean && flutter pub get
flutter build appbundle --release
```
- Signing is automatic: `android/app/build.gradle.kts` reads `android/key.properties`. If that file is missing, the build silently falls back to the **debug** key, and Play rejects debug-signed bundles.
- Confirm the bundle is signed with the upload key:
  ```bash
  keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab
  ```
  The output must show SHA-1 `10:A9:18:…:FA:FF`.
- For every later release, bump `version:` in `pubspec.yaml`. The number after `+` (versionCode) must always increase, e.g. `1.0.1+2`.

## 3. Create the app in Play Console

1. https://play.google.com/console → **Create app**.
   - Name `ClassiAds Hub`, default language English, App, Free.
   - Accept the declarations.
2. Left menu **Test and release → Setup → App signing**: keep **Google-managed app signing** (Play App Signing).
3. Once the first bundle is uploaded, the same page shows the **App signing key certificate** SHA-1 and SHA-256. Add both to Firebase:
   - Firebase Console → Project settings → Your apps → Android app `com.classiads.classiads_hub` → **Add fingerprint**.
   - Add the same SHA-1 to the Maps API key restriction.

   **Without this, phone OTP / Google sign-in and Maps fail in the Play-installed app** even though they work in local builds.

## 4. Store listing (Grow users → Store presence → Main store listing)

**Short description (80 chars max)**
```
Buy & sell cars, phones, homes and more near you. Chat, offer and deal fast.
```

**Full description**
```
ClassiAds Hub is the simple way to buy and sell locally.

Find great deals
• Browse cars, mobiles, electronics, property, jobs and more
• Smart categories, filters and search
• Featured and most-viewed listings, ads near you

Sell in under a minute
• Post an ad with photos, price and location
• Manage, edit, renew or mark ads as sold from My Ads

Deal with confidence
• Chat with sellers in-app and make offers
• Verified seller badges and seller ratings
• Report suspicious ads; our team reviews every report

Stay updated
• Instant notifications for new messages and offers
• Save favourites and follow sellers

Your account, your control: delete your account and data any time from Profile → Delete Account.
```

**Graphics** (all in `store/playstore/`):

| Play Console field | File | Spec |
|---|---|---|
| App icon | `icon-512.png` | 512×512 PNG |
| Feature graphic | `feature-graphic.png` | 1024×500 |
| Phone screenshots | `phone-screenshots/01…08-*.png` | 8 × 1080×1920 (9:16) |
| Video | `promo-30s.mp4` | 28 s screen recording; see below |

**Video.** Play only accepts a **YouTube URL**:
1. Upload `promo-30s.mp4` to YouTube as **Public** or **Unlisted** (not Private), ads off.
2. Paste the link.

To re-record it, start the emulator, log in as `customer@classiads.test`, then:
```bash
cd tools/qa
node clear-notifs.mjs
node video.mjs
```

Screenshot order tells the story: home → deals → detail → categories → chat → post ad → listing detail → my ads. To regenerate them after UI changes:
1. Capture new raw shots into `store/raw/`.
2. Run `node store/compose.mjs`.

**Category:** Shopping. **Tags:** Classifieds, Marketplace. **Contact email:** your support address. **Website:** https://classiadshub.web.app

## 5. App content (Policy → App content)

Answer each section:

| Section | Answer |
|---|---|
| Privacy policy | https://classiadshub.web.app/page/privacy. Make sure the page text names ClassiAds Hub, what is collected (below), and how to delete the account. |
| Ads | **No**, the app shows no third-party ads. Banner ads managed in admin are your own promotions; if you add AdMob later, change this. |
| App access | **All or some functionality is restricted** → add test login: `customer@classiads.test` / its password, with the note "Email login: tap Continue with Email". |
| Content rating | Questionnaire category **"All other app types"**. User-generated content: **Yes** (users post ads and chat). Users can interact: **Yes**. Shares location: **Yes**. Digital purchases: **No**. Expect roughly Teen / PEGI 12. |
| Target audience | **18 and over** (marketplace with chat between strangers). Avoids Families-policy requirements. |
| News app | No |
| Data safety | See next table |
| Government app | No |
| Financial features | None of the listed (it is not a financial-services app) |
| Health | No |
| Account deletion | **Yes, in app**, plus web URL https://classiadshub.web.app/dashboard/profile. Deleting removes profile, phone, address, social links and avatar; ads/messages are anonymised. |

**Data safety form.** All data is encrypted in transit (HTTPS / Firebase). Users can request deletion.

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name | Yes | No | Account management, App functionality | Required |
| Email address | Yes | No | Account management | Required (or phone) |
| Phone number | Yes | No | Account management (OTP login), App functionality | Optional |
| Approximate & precise location | Yes | No | App functionality (ads near you, ad location) | Optional |
| Photos | Yes | No | App functionality (ad photos, avatar) | Optional |
| Messages (in-app chat) | Yes | No | App functionality | Optional |
| User IDs / Device IDs (FCM token) | Yes | No | App functionality (push), Analytics | Required |
| App interactions (Firebase Analytics) | Yes | No | Analytics | Required |
| Crash logs, diagnostics (Crashlytics) | Yes | No | App functionality / Analytics | Required |
| Files & docs (KYC/verification documents, resumes) | Yes | No | App functionality (seller verification, job applications) | Optional |

"Shared" is No because Firebase/Google act as your service providers, not third parties.

## 6. Upload and test

1. **Test and release → Testing → Internal testing**:
   - Create a testers email list.
   - Click **Create new release**, upload `app-release.aab`, release name `1.0.0 (1)`.
   - Release notes: "First release."
2. Save → Review → **Start rollout to Internal testing**. Testers install from the opt-in link within minutes.
3. On a real phone, check:
   - email login, phone OTP, Google sign-in (if enabled);
   - map on ad detail;
   - push notification on a new chat message;
   - post an ad with a photo;
   - delete account.
4. New **personal** developer accounts must run a **closed test with at least 12 testers for 14 continuous days** before production access is granted. Organisation accounts skip this.
5. **Production → Create new release**. Promote the tested release, choose countries, and use a staged rollout (e.g. 20%). Then **Send for review**. The first review usually takes from a few days up to about a week.

## 7. After launch

- **Crashlytics** (Firebase Console) for crashes; **Play Console → Android vitals** for ANRs.
- Reply to reviews in Play Console.
- **Each update:**
  1. Bump `version:`.
  2. Run `flutter build appbundle --release`.
  3. Create a new release in the same track.
- Keep the Firebase SHA fingerprints and Maps key restriction up to date if you ever change signing keys.

## Pre-submission checklist

- [ ] `setup-payments.mjs` run; website test payment passes (§8)
- [ ] Maps SDK for Android enabled and key restricted (§9.1)
- [ ] Google provider enabled, new google-services.json, AAB rebuilt (§9.2)
- [ ] QA test data cleaned (§0)
- [ ] Upload key backed up in 2 places (§1)
- [ ] AAB signed with the upload key, not debug (§2)
- [ ] Play App Signing SHA-1/256 added to Firebase and the Maps key (§3)
- [ ] Listing text, icon, feature graphic, 8 screenshots, YouTube video (§4)
- [ ] Privacy policy page reviewed; all App content sections green (§5)
- [ ] Internal test passed on a real device (§6)

---

## 8. Website payments (Stripe, Razorpay, PayPal)

The website sends buyers to the gateway's own secure payment page (Stripe Checkout, a Razorpay Payment Link, or PayPal). After paying, the buyer comes back to `/checkout/result`. The server then asks the gateway whether the payment really went through, and checks the amount and currency, before it activates the plan or featured ad. If the buyer closes the tab before coming back, the hourly `housekeeping` job settles the payment instead.

**Where the keys live**
- `secret/prod.env`: your keys. The current ones are **test/sandbox** keys.
- `functions/.env`: the public IDs (`RAZORPAY_KEY_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_ENV`).
- Firebase Secret Manager: the secret keys (`STRIPE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, `PAYPAL_CLIENT_SECRET`).

**Setup**: one command, run from the repo root while logged in to the Firebase CLI:
```bash
node tools/payments/setup-payments.mjs
```
It writes the IDs, stores the secrets, deploys the functions, enables the three gateways (and disables Sandbox and Bank Transfer), then rebuilds and deploys the website.

**Test it** at https://classiadshub.web.app → Dashboard → Subscriptions → choose a plan:

| Gateway | Test details |
|---|---|
| Stripe | Card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP |
| Razorpay | Choose Card `4111 1111 1111 1111` (or UPI `success@razorpay`), then click **Success** on the test bank page |
| PayPal | Log in with a sandbox *personal* account from developer.paypal.com → Testing tools → Sandbox accounts |

The plan should become active and the transaction should show as completed in Admin → Transactions.

**Going live**:
1. Put the live keys (`sk_live_…`, `rzp_live_…`, PayPal live client ID/secret and `PAYPAL_ENV=live`) in `secret/prod.env`.
2. Re-run the script. Gateways switch to "live" mode automatically when it sees live keys.
3. For Razorpay, also enable international payments in its dashboard if buyers will pay in USD.

---

## 9. Google Maps and Google sign-in

### 9.1 Google Maps (fixes the blank map on ad detail)

The Android app uses the Maps key in `mobile/android/app/src/main/AndroidManifest.xml` (`AIzaSyB53YOS…`).

1. Open https://console.cloud.google.com and select the project that owns this key: APIs & Services → **Credentials**. It is the key whose value starts `AIzaSyB53`. If you can't find it, create a new key in project **classiadshub** and put it in the manifest.
2. Go to APIs & Services → **Library** → search **Maps SDK for Android** → **Enable**. Billing must be on for the project; `classiadshub` is already on the Blaze plan.
3. Back in Credentials, click the key:
   - **Application restrictions** → **Android apps** → **Add**: package `com.classiads.classiads_hub` with each SHA-1:
     - upload key `10:A9:18:AB:9B:4A:F0:4C:18:07:60:3F:10:1A:6C:0E:81:13:FA:FF`
     - debug key, from `cd mobile/android && ./gradlew signingReport` (variant debug)
     - **Play App Signing key**, from Play Console → Test and release → App integrity, after the first upload
   - **API restrictions** → Restrict key → tick **Maps SDK for Android** → Save.
4. Changes take up to 5 minutes. Reinstall the app and open any ad: the map should show the pin.
5. If you created a new key in step 1, rebuild the AAB: `flutter build appbundle --release`.

### 9.2 Google sign-in ("Continue with Google")

The app already has the button. It signs in through Firebase's Google provider, which only needs turning on.

1. Firebase Console → project **classiadshub** → **Authentication** → **Sign-in method** → **Add new provider** → **Google** → Enable.
   - Pick a **support email** and click Save. Firebase creates the OAuth clients automatically.
2. Firebase Console → **Project settings** → **Your apps** → Android `com.classiads.classiads_hub`. Under **SHA certificate fingerprints**, make sure all three are listed: upload, debug and Play App Signing (the last one after the first Play upload).
3. On the same page, download the new **google-services.json** and replace `mobile/android/app/google-services.json`. The new file contains the OAuth client that Google sign-in needs.
4. Authentication → **Settings** → **Authorized domains** must include `classiadshub.web.app` and `classiadshub.firebaseapp.com` (they are there by default).
5. Google Cloud Console → APIs & Services → **OAuth consent screen**:
   - App name **ClassiAds Hub**, support email, logo `store/playstore/icon-512.png`.
   - App domain: https://classiadshub.web.app, privacy policy https://classiadshub.web.app/page/privacy, terms https://classiadshub.web.app/page/terms.
   - Publishing status **In production**, so any Google user can sign in.
6. Rebuild and upload:
   ```bash
   cd mobile && flutter build appbundle --release
   ```
   Bump `version:` in `pubspec.yaml` first if a build is already uploaded to Play.
7. Test on a real phone: Login → **Continue with Google** → pick an account. You should land on Home, and the user should appear in Admin → Users.

**If it fails:**
- `DEVELOPER_ERROR` or code 10 means a missing SHA-1 (step 2), or the app still has the old google-services.json (step 3).
- Works locally but not from Play means the Play App Signing SHA-1 was never added.
