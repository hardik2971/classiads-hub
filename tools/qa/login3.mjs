import { tap, type, tapText, shot, sleep, sh } from "./adb-ui.mjs";
await tap(540, 636);
sh("input keyevent KEYCODE_MOVE_END");
sh("input keyevent " + Array(40).fill("67").join(" "));
await type("seller@classiads.test");
await tap(450, 851); await type("password");
sh("input keyevent 4"); await sleep(800);
await tapText(/^Continue$/, { wait: 10000 });
shot("../../store/raw/after-login.png");
