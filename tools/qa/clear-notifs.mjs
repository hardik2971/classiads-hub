import { sh, sleep, find, tap, demoMode, shot } from "./adb-ui.mjs";
sh("cmd statusbar expand-notifications"); await sleep(1500);
const c = find(/Clear all/i);
console.log("clear all:", c);
if (c) await tap(c.x, c.y, 1500);
sh("cmd statusbar collapse"); await sleep(800);
demoMode(false); await sleep(500); demoMode(); await sleep(800);
shot("C:/Users/di/AppData/Local/Temp/claude/f--DI-PMS-Project-classify/6e713f18-fded-4e6b-ac43-234a9ad86b60/scratchpad/top.png");
