/**
 * Minimal adb UI driver for capturing store media.
 *   import { tapText, type, shot, swipeUp, back, sleep, demoMode } from "./adb-ui.mjs"
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ADB = `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
const env = { ...process.env, MSYS_NO_PATHCONV: "1" };
export const adb = (...args) => execFileSync(ADB, args, { env, maxBuffer: 64 * 1024 * 1024 });
export const sh = (cmd) => adb("shell", cmd).toString();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function dump() {
  sh("uiautomator dump /sdcard/ui.xml >/dev/null");
  return adb("exec-out", "cat", "/sdcard/ui.xml").toString();
}

/** Centre of the first node whose text or content-desc matches. */
export function find(re, xml = dump()) {
  for (const m of xml.matchAll(/<node [^>]*?>/g)) {
    const n = m[0];
    const text = (n.match(/ text="([^"]*)"/)?.[1] ?? "") + " " + (n.match(/content-desc="([^"]*)"/)?.[1] ?? "");
    if (re.test(text.trim())) {
      const [, x1, y1, x2, y2] = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).map(Number);
      return { x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), text: text.trim() };
    }
  }
  return null;
}

export async function tapText(re, { wait = 1500, tries = 6 } = {}) {
  for (let i = 0; i < tries; i++) {
    const p = find(re);
    if (p) {
      sh(`input tap ${p.x} ${p.y}`);
      await sleep(wait);
      return p;
    }
    await sleep(1000);
  }
  throw new Error(`not found: ${re}`);
}

export const tap = async (x, y, wait = 1200) => {
  sh(`input tap ${x} ${y}`);
  await sleep(wait);
};
export const type = async (s) => {
  sh(`input text ${JSON.stringify(s.replace(/ /g, "%s"))}`);
  await sleep(500);
};
export const back = async () => {
  sh("input keyevent 4");
  await sleep(1200);
};
export const swipeUp = async (dist = 900, ms = 450) => {
  sh(`input swipe 540 1800 540 ${1800 - dist} ${ms}`);
  await sleep(900);
};
export const shot = (file) => writeFileSync(file, adb("exec-out", "screencap", "-p"));

/** Clean status bar (09:41, full battery/signal, no notifications). */
export function demoMode(on = true) {
  if (!on) return sh("am broadcast -a com.android.systemui.demo -e command exit");
  sh("settings put global sysui_demo_allowed 1");
  const b = (extra) => sh(`am broadcast -a com.android.systemui.demo ${extra}`);
  b("-e command enter");
  b("-e command clock -e hhmm 0941");
  b("-e command battery -e level 100 -e plugged false");
  b("-e command network -e wifi show -e level 4 -e mobile show -e datatype none -e level 4");
  b("-e command notifications -e visible false");
}

/** Centres of all editable fields on screen, top to bottom. */
export function fields(xml = dump()) {
  return [...xml.matchAll(/<node [^>]*class="android\.widget\.EditText"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)].map((m) => ({ x: (+m[1] + +m[3]) >> 1, y: (+m[2] + +m[4]) >> 1 }));
}

/** Clear a focused field and type a value. */
export async function fill(p, value) {
  await tap(p.x, p.y, 700);
  sh("input keyevent KEYCODE_MOVE_END");
  sh("input keyevent " + Array(45).fill("67").join(" "));
  await type(value);
}

export async function emailLogin(email, password) {
  if (find(/Continue with Email/)) await tapText(/Continue with Email/, { wait: 2500 });
  let f = fields();
  await fill(f[0], email);
  f = fields();
  await fill(f[1], password);
  sh("input keyevent 4");
  await sleep(800);
  await tapText(/^Continue$/, { wait: 10000 });
}
