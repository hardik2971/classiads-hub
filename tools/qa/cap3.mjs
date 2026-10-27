import { sleep, shot, tap, back } from "./adb-ui.mjs";
const D = "../../store/raw/";
await back(); await sleep(1500);
await tap(713, 2256, 5000); shot(D + "04-my-ads.png");
await tap(540, 2168, 4000); shot(D + "05-post-ad.png");
await back(); await sleep(1500);
await tap(929, 2256, 4000); shot(D + "06-profile.png");
