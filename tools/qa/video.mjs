// Records a ~30 s promo walkthrough on the emulator → store/playstore/promo-30s.mp4
// Before running: clear/snooze notifications (see clear-notifs step in docs/PLAYSTORE_GUIDE.md).
import { spawn } from "node:child_process";
import { adb, sh, sleep, tap, back, demoMode, find } from "./adb-ui.mjs";

const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
const swipe = async (from, to, ms, wait = 1200) => {
  sh(`input swipe 540 ${from} 540 ${to} ${ms}`);
  await sleep(wait);
};
const toTop = async () => {
  for (let i = 0; i < 3; i++) await swipe(700, 1800, 250, 500);
  await sleep(800);
};
const tapFound = async (re, wait) => {
  const p = find(re);
  if (!p) throw new Error(`not on screen: ${re}`);
  await tap(p.x, p.y, wait);
};
// Scroll Home until the villa card is visible, then tap it. The warm-up pass looks the card up
// (uiautomator dumps take ~1.5 s); the recorded pass reuses that position.
let villa = null;
const openVilla = async (wait) => {
  await swipe(1700, 1100, 900, 1300);
  await swipe(1700, 1150, 900, 1300);
  villa ??= find(/Dream Villa/);
  if (!villa) throw new Error("villa card not on screen");
  await tap(villa.x, villa.y, wait);
};
const CHAT_BUTTON = [797, 2243];

demoMode();
// Fresh start on Home, whatever screen the app was left on.
sh("am force-stop com.classiads.classiads_hub");
sh("am start -n com.classiads.classiads_hub/.MainActivity");
await sleep(9000);
// Warm-up pass so images and the conversation are cached (no spinners on camera).
await tap(151, 2256, 2000);
await toTop();
await openVilla(5000);
await tapFound(/^Chat$/, 9000);
await back();
await back();
await tap(151, 2256, 1500);
await toTop();

const rec = spawn(ADB, ["shell", "screenrecord", "--time-limit", "30", "--bit-rate", "12000000", "/sdcard/promo.mp4"], { env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
const t0 = Date.now();
await sleep(1800); // home hero
await openVilla(3000); // featured → most viewed → villa detail
await tap(...CHAT_BUTTON, 9000); // chat with seller (detail stays up while the API opens it)
await back();
await back();
await tap(540, 2168, 2400); // post ad
await back();
await tap(713, 2256, 2200); // my ads
await tap(929, 2256, 2200); // profile
console.log("script took", ((Date.now() - t0) / 1000).toFixed(1), "s");
if (rec.exitCode === null) await new Promise((r) => rec.on("exit", r));
await sleep(1500);
adb("pull", "/sdcard/promo.mp4", "../../store/playstore/promo-30s.mp4");
console.log("saved");
