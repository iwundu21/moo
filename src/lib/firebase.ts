// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// IMPORTANT: Do not remove this object
const firebaseConfig = {
    apiKey: "AIzaSyBARqwkgamSoLTFMZEfhELp28FJs1zU1ng",
    authDomain: "moo-tele-2.firebaseapp.com",
    projectId: "moo-tele-2",
    storageBucket: "moo-tele-2.appspot.com",
    messagingSenderId: "778910858623",
    appId: "1:778910858623:web:67cccbc7373c0012ae6e4a"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);


export { app, db, functions };
