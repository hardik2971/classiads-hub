import { sleep, shot, tap, tapText, type, sh, find } from "./adb-ui.mjs";
await tap(770, 1346, 6000);
if (find(/Continue with Email/)) await tapText(/Continue with Email/, { wait: 2500 });
await tap(540, 636); await type("customer@classiads.test");
await tap(450, 851); await type("password"); sh("input keyevent 4"); await sleep(800);
await tapText(/^Continue$/, { wait: 10000 });
shot("../../store/raw/cust-home.png");
