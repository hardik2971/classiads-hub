import { sh, sleep, shot, swipeUp, tapText, tap, back } from "./adb-ui.mjs";
const D = "../../store/raw/";
shot(D + "01-home.png");
await swipeUp(1150); await sleep(2500); shot(D + "02-listings.png");
