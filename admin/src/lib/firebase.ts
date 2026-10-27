import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

const config = {
  apiKey: "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M",
  authDomain: "classiadshub.firebaseapp.com",
  projectId: "classiadshub",
  storageBucket: "classiadshub.firebasestorage.app",
  messagingSenderId: "76485180630",
  appId: "1:76485180630:web:0502a02da1fe5e6a465d77",
};

export const app = getApps().length ? getApp() : initializeApp(config);
export const auth = getAuth(app);
if (typeof window !== "undefined") void setPersistence(auth, browserLocalPersistence);
