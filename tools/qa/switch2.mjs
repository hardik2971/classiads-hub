import { sleep, shot, tap, tapText, type, sh, find, dump } from "./adb-ui.mjs";
// the dialog title is also "Sign out"; the button is the last match
const xml = dump(); const nodes = [...xml.matchAll(/<node [^>]*text="Sign out"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)];
const b = nodes[nodes.length - 1]; await tap((+b[1] + +b[3]) / 2, (+b[2] + +b[4]) / 2, 6000);
if (find(/Continue with Email/)) await tapText(/Continue with Email/, { wait: 2500 });
shot("../../store/raw/login-email.png");
