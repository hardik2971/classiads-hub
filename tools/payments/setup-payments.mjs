/**
 * One-time payment setup from secret/prod.env:
 *   1. public key ids  → functions/.env
 *   2. secret keys     → Firebase Secret Manager (STRIPE_SECRET_KEY, RAZORPAY_KEY_SECRET, PAYPAL_CLIENT_SECRET)
 *   3. deploy the `api` + `housekeeping` functions (they read those secrets)
 *   4. enable Stripe / Razorpay / PayPal, disable Sandbox and Bank Transfer in Firestore `payment_gateways`
 *   5. rebuild + deploy the website (new hosted-checkout redirect/result pages)
 *
 *   cd tools/payments && node setup-payments.mjs            (all steps)
 *   node setup-payments.mjs --skip-deploy                     (steps 1, 2, 4 only)
 * Re-run any time prod.env changes (e.g. switching to live keys).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const skipDeploy = process.argv.includes("--skip-deploy");
const run = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

const env = Object.fromEntries(
  readFileSync(join(ROOT, "secret/prod.env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
for (const k of ["STRIPE_SECRET_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]) {
  if (!env[k]) throw new Error(`secret/prod.env is missing ${k}`);
}

// 1. Public ids → functions/.env (keeps every other line).
const PUBLIC = { RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID, PAYPAL_CLIENT_ID: env.PAYPAL_CLIENT_ID, PAYPAL_ENV: env.PAYPAL_ENV || "sandbox", STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY ?? "" };
const envFile = join(ROOT, "functions/.env");
const kept = readFileSync(envFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter((l) => l && !Object.keys(PUBLIC).some((k) => l.startsWith(`${k}=`)) && !l.startsWith("# Payments"));
writeFileSync(envFile, [...kept, "# Payments (public ids; secret keys live in Secret Manager)", ...Object.entries(PUBLIC).map(([k, v]) => `${k}=${v}`)].join("\n") + "\n");
console.log("✔ functions/.env updated");

// 2. Secrets → Secret Manager (values go through a temp file, never the command line).
const tmp = mkdtempSync(join(tmpdir(), "cah-"));
try {
  for (const k of ["STRIPE_SECRET_KEY", "RAZORPAY_KEY_SECRET", "PAYPAL_CLIENT_SECRET"]) {
    const f = join(tmp, k);
    writeFileSync(f, env[k]);
    run("firebase", ["functions:secrets:set", k, "--data-file", f, "--project", "classiadshub", "--force"]);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log("✔ secrets stored");

// 3. Deploy functions.
if (!skipDeploy) {
  process.env.FUNCTIONS_DISCOVERY_TIMEOUT = "900";
  process.env.NODE_OPTIONS = "--max-old-space-size=4096";
  run("firebase", ["deploy", "--only", "functions", "--project", "classiadshub"]);
}

// 4. Gateways in Firestore.
const require = createRequire(join(ROOT, "tools/migrate/package.json"));
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(readFileSync(join(ROOT, "secret/classiadshub-firebase.json"), "utf8"))), projectId: "classiadshub" });
const db = getFirestore();
const live = { stripe: !env.STRIPE_SECRET_KEY.startsWith("sk_test_"), razorpay: !env.RAZORPAY_KEY_ID.startsWith("rzp_test_"), paypal: PUBLIC.PAYPAL_ENV === "live" };
const WANT = {
  stripe: { is_active: true, name: "Card (Stripe)", sort_order: 1 },
  razorpay: { is_active: true, name: "Razorpay (UPI / Cards / Netbanking)", sort_order: 2 },
  paypal: { is_active: true, name: "PayPal", sort_order: 3 },
  sandbox: { is_active: false },
  bank_transfer: { is_active: false },
};
const snap = await db.collection("payment_gateways").get();
for (const d of snap.docs) {
  const code = d.data().code;
  if (!WANT[code]) continue;
  const mode = code in live ? { mode: live[code] ? "live" : "sandbox", is_manual: false } : {};
  await d.ref.set({ ...WANT[code], ...mode, updated_at: new Date() }, { merge: true });
  console.log(`  ${code}: ${WANT[code].is_active ? "enabled" : "disabled"}${mode.mode ? ` (${mode.mode})` : ""}`);
}
console.log("✔ payment gateways updated (the API caches them for ~30 s)");

// 5. Website.
if (!skipDeploy) {
  run("npm", ["run", "build"], join(ROOT, "web"));
  run("firebase", ["deploy", "--only", "hosting:web", "--project", "classiadshub"]);
}
console.log("✔ done — test with Stripe card 4242 4242 4242 4242, any future date, any CVC");
