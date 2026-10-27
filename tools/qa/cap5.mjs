import { sleep, shot, tap, back, swipeUp, sh } from "./adb-ui.mjs";
const D = "../../store/raw/";
await swipeUp(1150); await sleep(2000);
await tap(264, 1320, 6000); shot(D + "08-buyer-detail.png");
await back(); await sleep(1500);
await tap(367, 2256, 5000); shot(D + "09-chat-list.png");
await tap(540, 420, 5000); shot(D + "10-chat-convo.png");
