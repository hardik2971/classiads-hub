// Enables Firebase Auth sign-in providers + authorised domains for the hosted sites.
const { applicationDefault } = require("firebase-admin/app");
(async () => {
  const { access_token } = await applicationDefault().getAccessToken();
  const base = "https://identitytoolkit.googleapis.com/admin/v2/projects/classiadshub/config";
  const H = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json", "X-Goog-User-Project": "classiadshub" };
  const cur = await (await fetch(base, { headers: H })).json();
  console.log("before:", JSON.stringify({ signIn: cur.signIn, domains: cur.authorizedDomains }));
  const domains = [...new Set([...(cur.authorizedDomains ?? []), "localhost", "classiadshub.web.app", "classiadshub.firebaseapp.com", "classiadshub-admin.web.app", "classiadshub-admin.firebaseapp.com"])];
  const r = await fetch(`${base}?updateMask=signIn.email.enabled,signIn.email.passwordRequired,signIn.phoneNumber.enabled,authorizedDomains`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true }, phoneNumber: { enabled: true } }, authorizedDomains: domains }),
  });
  const j = await r.json();
  console.log(r.status, JSON.stringify({ signIn: j.signIn, domains: j.authorizedDomains, error: j.error }));
})();
