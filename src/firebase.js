// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDeOPtIKHfic0lTQgrF-H3ZJmteU6Ig9kE",
  authDomain: "keyvia-real-estate.firebaseapp.com",
  projectId: "keyvia-real-estate",
  storageBucket: "keyvia-real-estate.firebasestorage.app",
  messagingSenderId: "838736214830",
  appId: "1:838736214830:web:70a82558437469e406d8bf",
  measurementId: "G-STXHJQLX6G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth();