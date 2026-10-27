import { sleep, shot, tap, back, sh, type, fields } from "./adb-ui.mjs";
const D = "../../store/raw/";
sh("service call notification 1"); await sleep(800);
await tap(535, 538, 5000); await tap(540, 446, 6000); shot(D + "11-category.png");
await back(); await back(); await sleep(1500);
await tap(540, 365, 3000);
const f = fields(); console.log(f);
if (f[0]) { await tap(f[0].x, f[0].y, 800); await type("iphone"); sh("input keyevent 66"); await sleep(6000); sh("input keyevent 4"); await sleep(800); }
shot(D + "12-search.png");
