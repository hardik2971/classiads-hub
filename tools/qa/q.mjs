// node q.mjs <email|-> METHOD PATH [jsonBody]
import { signIn, call } from "./lib.mjs";
const [who, method, path, body] = process.argv.slice(2);
const token = who === "-" ? undefined : await signIn(who, process.env.PW ?? "password");
const r = await call(method, path, { token, body: body ? JSON.parse(body) : undefined });
console.log(JSON.stringify(r, null, 1).slice(0, Number(process.env.MAX ?? 4000)));
