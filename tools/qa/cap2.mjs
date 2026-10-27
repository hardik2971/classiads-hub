import { sleep, shot, tap, swipeUp } from "./adb-ui.mjs";
const D = "../../store/raw/";
await tap(264, 564, 6000); shot(D + "03-ad-detail.png");
await swipeUp(1000); await sleep(2000); shot(D + "03b-ad-detail-scroll.png");
