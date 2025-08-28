
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Do not remove this object
const firebaseConfig = {
  apiKey: "FAKE_API_KEY",
  authDomain: "FAKE_AUTH_DOMAIN",
  projectId: "dev-prototyper-168a1",
  storageBucket: "FAKE_STORAGE_BUCKET",
  messagingSenderId: "FAKE_MESSAGING_SENDER_ID",
  appId: "FAKE_APP_ID"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
