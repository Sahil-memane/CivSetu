import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaiE2Pt-pwX8JzC4QCFiWVmN85KVxBh54",
  authDomain: "civsetu-c18ea.firebaseapp.com",
  projectId: "civsetu-c18ea",
  storageBucket: "civsetu-c18ea.firebasestorage.app",
  messagingSenderId: "488924381458",
  appId: "1:488924381458:web:50a33a929aa364e33c33cb",
  measurementId: "G-7161PXJJHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
