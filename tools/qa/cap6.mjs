import { sleep, shot, tap, back, swipeUp, sh, type, fields, dump } from "./adb-ui.mjs";
sh("input keyevent 4"); await sleep(800);
await tap(126 * 1.2, 2256, 3000); // Home
sh("input swipe 540 700 540 1600 300"); await sleep(1500);
await swipeUp(1150); await sleep(2000);
await tap(264, 1320, 6000); // villa
await tap(797, 2242, 6000); // Chat
const f = fields(); console.log("fields", f);
await tap(f[f.length - 1].x, f[f.length - 1].y);
await type("Hi Emma, is the villa still available? Can we visit this weekend?");
sh("input keyevent 4"); await sleep(500);
shot("../../store/raw/chat-typed.png");
