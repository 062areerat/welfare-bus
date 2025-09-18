// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkJ-fMHjgoaM7sgz7Nlck0FtFx8-s7dU4",
  authDomain: "welfare-bus-tracking.firebaseapp.com",
  databaseURL:
    "https://welfare-bus-tracking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "welfare-bus-tracking",
  storageBucket: "welfare-bus-tracking.appspot.com",
  messagingSenderId: "468508185996",
  appId: "1:468508185996:web:2695abc0cedb0a41a272a9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
