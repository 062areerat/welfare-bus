import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Firebase Config
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
const db = getDatabase(app);

// ข้อมูลเริ่มต้นของรถ
let vehicles = {
  "driver-uid-001": { lat: 13.7563, lng: 100.5018 },
  "driver-uid-002": { lat: 13.759, lng: 100.51 },
};

// ฟังก์ชันจำลองการเคลื่อนที่
function updateVehicles() {
  for (let uid in vehicles) {
    // สุ่มเลื่อนพิกัดเล็กน้อย
    vehicles[uid].lat += (Math.random() - 0.5) * 0.0005;
    vehicles[uid].lng += (Math.random() - 0.5) * 0.0005;

    // อัปเดต Realtime Database
    set(ref(db, "vehicles/" + uid), {
      lat: vehicles[uid].lat,
      lng: vehicles[uid].lng,
      timestamp: Date.now(),
      status: "online",
    });
  }
}

// อัปเดตทุก 5 วินาที
setInterval(updateVehicles, 5000);
