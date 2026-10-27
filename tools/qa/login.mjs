import { tap, type, tapText, shot, sleep, sh } from "./adb-ui.mjs";
await tap(540, 795); await type("seller@classiads.test"); sh("input keyevent 111");
await tap(450, 1000); await type("password"); sh("input keyevent 111"); await sleep(600);
await tapText(/^Continue $|^Continue$/, { wait: 9000 });
shot("../../store/raw/after-login.png");
