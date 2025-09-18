// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD33sh80picSyFd1-r1bVyQH1UdFdAXyes",
  authDomain: "jejudb.firebaseapp.com",
  projectId: "jejudb",
  storageBucket: "jejudb.firebasestorage.app",
  messagingSenderId: "39776551937",
  appId: "1:39776551937:web:5d9bfbc12ce5c300866c00",
  measurementId: "G-WFLFG1XJY3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);