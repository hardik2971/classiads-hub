import { Router } from "express";
import { auth } from "../lib/firebase";
import { me, optionalAuth, phoneAuthEmail, requireAuth } from "../lib/auth";
import { ApiError, fail, h, ok } from "../lib/http";
import { assertImage, deleteFile, storeFile } from "../lib/media";
import { fileFor, multipart } from "../lib/multipart";
import { sendOtp, verifyOtp } from "../lib/otp";
import { userRes } from "../lib/resources";
import { C, Doc, col, first, get, insert, update } from "../lib/store";
import { fieldError, validate } from "../lib/validate";

export const authRouter = Router();

const WEB_API_KEY = () => process.env.WEB_API_KEY ?? "";

/** Firebase uid for an app user (numeric id for API-created accounts, provider uid otherwise). */
export const authUid = (u: Doc) => String(u.auth_uid ?? u.id);

async function findByLogin(login: string): Promise<Doc | null> {
  return (await first(C.users, "email", login)) ?? (await first(C.users, "phone", login));
}

/** Verify an e-mail/password pair against Firebase Auth (Identity Toolkit REST). */
async function passwordMatches(email: string, password: string): Promise<boolean> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });
  return res.ok;
}

async function authEmailFor(u: Doc): Promise<string | null> {
  try {
    const rec = await auth.getUser(authUid(u));
    return rec.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Sessions are Firebase Auth sessions: the API verifies/provisions the account and returns
 * the e-mail the client signs in with (`signInWithEmailAndPassword(auth_email, password)`).
 * Phone-only accounts use a synthetic e-mail, so phone + password login keeps working.
 */
async function session(u: Doc, message: string, status = 200, extra: Record<string, unknown> = {}) {
  const authEmail = (await authEmailFor(u)) ?? u.email ?? (u.phone ? phoneAuthEmail(u.phone) : null);
  return { status, message, data: { user: userRes(u, { seller: true }), auth_email: authEmail, token: null, ...extra } };
}

authRouter.post(
  "/register",
  h(async (req, res) => {
    const d = validate(req.body, {
      name: "required|string|max:150",
      email: "nullable|email|max:191",
      phone: "nullable|string|max:32",
      password: "required|string|min:8|confirmed|raw",
    });
    if (!d.email && !d.phone) throw fieldError("email", "Either email or phone is required.");
    if (d.email && (await first(C.users, "email", d.email))) throw fieldError("email", "The email has already been taken.");
    if (d.phone && (await first(C.users, "phone", d.phone))) throw fieldError("phone", "The phone has already been taken.");

    const user = await insert(C.users, {
      name: d.name,
      email: d.email ?? null,
      phone: d.phone ?? null,
      status: "active",
      is_verified: false,
      roles: ["customer"],
      login_type: d.email ? "email" : "phone",
      auto_approve_ads: false,
    });
    try {
      await auth.createUser({ uid: String(user.id), email: d.email ?? phoneAuthEmail(d.phone), password: d.password, displayName: d.name });
    } catch (e: any) {
      await col(C.users).doc(String(user.id)).delete();
      throw new ApiError(e?.message ?? "Could not create account.", 422);
    }

    const identifier = d.email ?? d.phone;
    const channel = d.email ? "email" : "sms";
    const otp = await sendOtp(identifier, channel, "register");
    const s = await session(user, `Registered. Verify the OTP sent to your ${channel}.`, 201, { otp });
    ok(res, s.data, s.message, s.status);
  }),
);

authRouter.post(
  "/login",
  h(async (req, res) => {
    const d = validate(req.body, { login: "required|string", password: "required|string|raw", device: "nullable|string|max:191" });
    const user = await findByLogin(d.login);
    const email = user ? await authEmailFor(user) : null;
    if (!user || !email || !(await passwordMatches(email, d.password))) {
      throw fieldError("login", "These credentials do not match our records.");
    }
    if ((user.status ?? "active") !== "active") return fail(res, `Your account is ${user.status}.`, 403);
    await update(C.users, user.id, { last_login_at: new Date() });
    const s = await session(user, "Logged in.");
    ok(res, s.data, s.message);
  }),
);

authRouter.post(
  "/otp/send",
  h(async (req, res) => {
    const d = validate(req.body, { identifier: "required|string|max:191", channel: "required|in:sms,email", purpose: "required|in:register,login,reset,verify" });
    ok(res, await sendOtp(d.identifier, d.channel, d.purpose), "OTP sent.");
  }),
);

authRouter.post(
  "/otp/verify",
  h(async (req, res) => {
    const d = validate(req.body, { identifier: "required|string|max:191", purpose: "required|in:register,login,reset,verify", code: "required|string" });
    if (!(await verifyOtp(d.identifier, d.purpose, d.code))) throw fieldError("code", "Invalid or expired code.");
    const user = await findByLogin(d.identifier);
    if (user && ["register", "verify"].includes(d.purpose)) {
      const field = user.email === d.identifier ? "email_verified_at" : "phone_verified_at";
      await update(C.users, user.id, { [field]: new Date() });
      if (field === "email_verified_at") await auth.updateUser(authUid(user), { emailVerified: true }).catch(() => undefined);
    }
    ok(res, { verified: true }, "OTP verified.");
  }),
);

authRouter.post(
  "/password/forgot",
  h(async (req, res) => {
    const d = validate(req.body, { login: "required|string" });
    const user = await findByLogin(d.login);
    if (user) {
      const isEmail = user.email === d.login;
      const otp = await sendOtp(isEmail ? user.email : user.phone, isEmail ? "email" : "sms", "reset");
      return ok(res, otp, "If the account exists, a reset code has been sent.");
    }
    ok(res, null, "If the account exists, a reset code has been sent.");
  }),
);

authRouter.post(
  "/password/reset",
  h(async (req, res) => {
    const d = validate(req.body, { login: "required|string", code: "required|string", password: "required|string|min:8|confirmed|raw" });
    if (!(await verifyOtp(d.login, "reset", d.code))) throw fieldError("code", "Invalid or expired code.");
    const user = await findByLogin(d.login);
    if (!user) throw new ApiError("User not found.", 404);
    const uid = authUid(user);
    try {
      await auth.updateUser(uid, { password: d.password });
    } catch {
      await auth.createUser({ uid, email: user.email ?? phoneAuthEmail(user.phone), password: d.password, displayName: user.name });
    }
    await auth.revokeRefreshTokens(uid);
    ok(res, null, "Password reset. Please log in again.");
  }),
);

/** Provider sign-in (Google/Apple/Facebook) runs client-side with the Firebase SDK; /auth/me then provisions the profile. */
authRouter.post(
  "/social/:provider",
  h(async (_req, res) => fail(res, "Sign in with the Firebase Auth SDK for this provider, then call GET /auth/me.", 410)),
);

authRouter.get(
  "/me",
  requireAuth,
  h(async (req, res) => ok(res, userRes(me(req), { seller: true, extra: { address: me(req).address ?? null, login_type: me(req).login_type ?? null } }), "OK")),
);

authRouter.put(
  "/profile",
  multipart,
  requireAuth,
  h(async (req, res) => {
    const u = me(req);
    const d = validate(req.body, {
      name: "sometimes|string|max:150",
      email: "sometimes|nullable|email|max:191",
      phone: "sometimes|nullable|string|max:32",
      address: "sometimes|nullable|string|max:500",
      preferred_language: "sometimes|nullable|string|max:8",
      preferred_currency: "sometimes|nullable|string|max:8",
    });
    if (d.email && d.email !== u.email) {
      const other = await first(C.users, "email", d.email);
      if (other && other.id !== u.id) throw fieldError("email", "The email has already been taken.");
    }
    if (d.phone && d.phone !== u.phone) {
      const other = await first(C.users, "phone", d.phone);
      if (other && other.id !== u.id) throw fieldError("phone", "The phone has already been taken.");
    }
    const avatar = fileFor(req, "avatar");
    if (avatar) {
      try {
        assertImage(avatar, "avatar");
      } catch (e: any) {
        throw fieldError("avatar", e.message);
      }
      d.avatar_path = await storeFile(avatar, `avatars/${u.id}`);
      if (u.avatar_path) await deleteFile(u.avatar_path);
    }
    await update(C.users, u.id, d);
    if (d.name) await auth.updateUser(authUid(u), { displayName: d.name }).catch(() => undefined);
    const fresh = (await get(C.users, u.id))!;
    ok(res, userRes(fresh, { seller: true, extra: { address: fresh.address ?? null } }), "Profile updated.");
  }),
);

authRouter.post("/logout", requireAuth, h(async (_req, res) => ok(res, null, "Logged out.")));

authRouter.post(
  "/devices",
  requireAuth,
  h(async (req, res) => {
    const d = validate(req.body, { fcm_token: "required|string|max:4096|raw", platform: "required|in:android,ios,web", device_name: "nullable|string|max:191" });
    const id = Buffer.from(d.fcm_token).toString("base64url").slice(-200);
    await col(C.devices).doc(id).set({ user_id: me(req).id, fcm_token: d.fcm_token, platform: d.platform, device_name: d.device_name ?? null, last_active_at: new Date() }, { merge: true });
    ok(res, { device_id: id }, "Device registered.");
  }),
);

authRouter.delete(
  "/account",
  requireAuth,
  h(async (req, res) => {
    const u = me(req);
    const uid = authUid(u);
    const rec = await auth.getUser(uid).catch(() => null);
    const hasPassword = rec?.providerData.some((p) => p.providerId === "password");
    if (hasPassword && rec?.email) {
      const d = validate(req.body, { password: "required|string|raw" });
      if (!(await passwordMatches(rec.email, d.password))) throw fieldError("password", "Password is incorrect.");
    }
    await update(C.users, u.id, {
      email: u.email ? `deleted_${u.id}@deleted.local` : null,
      phone: null,
      name: "Deleted User",
      avatar_path: null,
      address: null,
      social: {},
      status: "banned",
      deleted_at: new Date(),
    });
    if (u.avatar_path) await deleteFile(u.avatar_path);
    const devices = await col(C.devices).where("user_id", "==", u.id).get();
    await Promise.all(devices.docs.map((x) => x.ref.delete()));
    await auth.deleteUser(uid).catch(() => undefined);
    ok(res, null, "Your account has been deleted.");
  }),
);

export { optionalAuth };
