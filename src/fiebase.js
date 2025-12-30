// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAP-cKIU2o9Y7pOpvk624uoIQxMeJg5Vjo",
  authDomain: "keyvia-auth.firebaseapp.com",
  projectId: "keyvia-auth",
  storageBucket: "keyvia-auth.firebasestorage.app",
  messagingSenderId: "248346397570",
  appId: "1:248346397570:web:e1e328007abe34b8481d9b",
  measurementId: "G-GML23W7Z48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);