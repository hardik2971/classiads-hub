import { emailLogin, shot } from "./adb-ui.mjs";
await emailLogin("customer@classiads.test", "password");
shot("../../store/raw/cust-home.png");
