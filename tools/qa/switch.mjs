import { sleep, shot, tap, back, tapText, type, sh, find } from "./adb-ui.mjs";
await back(); await sleep(1000);
await tap(1016, 136, 2500);
await tapText(/^(Logout|Log out|Yes.*)$/i, { wait: 5000 });
const em = find(/Continue with Email/); if (em) await tapText(/Continue with Email/);
shot("../../store/raw/login-email.png");
