import { tapText, shot, sleep, dump } from "./adb-ui.mjs";
shot("../../store/raw/before-continue.png");
await tapText(/^Continue$/, { wait: 10000 });
shot("../../store/raw/after-login.png");
