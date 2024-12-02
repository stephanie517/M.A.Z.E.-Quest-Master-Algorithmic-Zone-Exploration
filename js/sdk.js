// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrRcf0Skm3KrAcHlhaTqGWtuRU8W0oFog",
  authDomain: "maze-56ae0.firebaseapp.com",
  databaseURL: "https://maze-56ae0-default-rtdb.firebaseio.com",
  projectId: "maze-56ae0",
  storageBucket: "maze-56ae0.firebasestorage.app",
  messagingSenderId: "786206316229",
  appId: "1:786206316229:web:83b908129dcba32f5702ac",
  measurementId: "G-9H2NB2VCSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);