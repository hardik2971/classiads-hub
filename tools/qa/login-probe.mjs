import { demoMode, tapText, type, shot, sleep, dump } from "./adb-ui.mjs";
demoMode();
await tapText(/Continue with Email/);
const xml = dump();
console.log([...xml.matchAll(/(text|content-desc)="([^"]+)"/g)].map((m) => m[2]).filter(Boolean).join(" | ").slice(0, 800));
shot("../../store/raw/probe.png");
