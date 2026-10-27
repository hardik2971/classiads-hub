import { sh, sleep, shot } from "./adb-ui.mjs";
sh("am broadcast -a com.android.systemui.demo -e command network -e mobile hide -e wifi show -e level 4");
sh("input swipe 540 700 540 1500 400"); await sleep(9000);
shot("../../store/raw/home.png");
