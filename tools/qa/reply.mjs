const KEY = "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M", B = "https://us-central1-classiadshub.cloudfunctions.net/api/v1";
const tok = async (e) => (await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: "password", returnSecureToken: true }) })).json()).idToken;
const s = await tok("seller@classiads.test");
const H = { Authorization: `Bearer ${s}`, "Content-Type": "application/json" };
const list = (await (await fetch(`${B}/conversations?tab=selling`, { headers: H })).json()).data;
const c = list.find((x) => x.ad?.id === 5 && x.counterpart?.name === "John Buyer");
console.log("convo", c?.id, c?.last_message);
for (const body of ["Hi John! Yes, it's still available 😊", "Saturday 11 AM works for a viewing. I'll share the exact location here."]) {
  const r = await fetch(`${B}/conversations/${c.id}/messages`, { method: "POST", headers: H, body: JSON.stringify({ body }) });
  console.log(r.status);
  await new Promise((r) => setTimeout(r, 1200));
}
