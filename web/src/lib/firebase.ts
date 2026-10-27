import { getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
} from "firebase/auth";

const config = {
  apiKey: "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M",
  authDomain: "classiadshub.firebaseapp.com",
  projectId: "classiadshub",
  storageBucket: "classiadshub.firebasestorage.app",
  messagingSenderId: "76485180630",
  appId: "1:76485180630:web:0502a02da1fe5e6a465d77",
};

export const app = getApps().length ? getApp() : initializeApp(config);
/**
 * Persistence is fixed at initialisation. (`getAuth()` + a later `setPersistence()` raced on page
 * load: the stored user was being migrated between IndexedDB and localStorage while the first
 * auth-state event fired with `null`, so full page loads right after login bounced to /login.)
 */
function createAuth(): Auth {
  if (typeof window === "undefined") return getAuth(app);
  try {
    return initializeAuth(app, { persistence: browserLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  } catch {
    return getAuth(app); // already initialised (fast refresh)
  }
}
export const auth = createAuth();

/** Resolves once Firebase has restored (or ruled out) a persisted session. */
export const authReady: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise((resolve) => {
        const off = onAuthStateChanged(auth, () => {
          off();
          resolve();
        });
      });
