// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCc56PQIP57V9KQo3vDvjseRi8Ge6hJTTY",
  authDomain: "ilm-plus-be482.firebaseapp.com",
  projectId: "ilm-plus-be482",
  storageBucket: "ilm-plus-be482.firebasestorage.app",
  messagingSenderId: "385083019954",
  appId: "1:385083019954:web:dcfa2e53886bd713b0efab",
  measurementId: "G-RSMCH8RB8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);