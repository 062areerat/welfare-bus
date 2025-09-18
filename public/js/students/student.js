// js/students/student.js
import { auth, rtdb } from "../firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// ================== DOM Elements ==================
const emailInput = document.getElementById("student-email");
const passwordInput = document.getElementById("student-password");
const registerBtn = document.getElementById("student-register");
const loginBtn = document.getElementById("student-login");
const logoutBtn = document.getElementById("logout");
const mapSection = document.getElementById("map-section");
const authSection = document.getElementById("auth-section");
const etaDisplay = document.getElementById("eta");

// ================== Variables ==================
let map,
  studentPos = null;
let studentMarker = null;
let vehicleMarkers = {};
let vehiclePositions = {};
let vehicleRoutes = {};
let updateInterval = null;

const regionBounds = L.latLngBounds([8.0, 98.6], [11.2, 101.0]);

const studentIcon = L.icon({
  iconUrl: "img/user.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const busIcon = L.icon({
  iconUrl: "img/car.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

// ================== Token Check ตอนโหลดหน้า ==================
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("studentToken");
  if (token) {
    authSection.style.display = "none";
    mapSection.style.display = "block";
    initMap();
    listenVehicles();
    startStudentLocationUpdate();

    // ตรวจสอบ user auth state
    auth.onAuthStateChanged((user) => {
      if (!user) {
        localStorage.removeItem("studentToken");
        authSection.style.display = "block";
        mapSection.style.display = "none";
      }
    });
  }
});

// ================== Register ==================
registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    alert("ลงทะเบียนสำเร็จ");
  } catch (err) {
    alert(err.message);
  }
});

// ================== Login ==================
loginBtn.addEventListener("click", async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );

    // ✅ เก็บ token หลังล็อกอิน
    const token = await userCredential.user.getIdToken();
    localStorage.setItem("studentToken", token);

    authSection.style.display = "none";
    mapSection.style.display = "block";

    initMap();
    listenVehicles();
    startStudentLocationUpdate();
  } catch (err) {
    alert(err.message);
  }
});

// ================== Logout ==================
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);

  // ✅ ลบ token
  localStorage.removeItem("studentToken");

  authSection.style.display = "block";
  mapSection.style.display = "none";

  vehicleMarkers = {};
  vehiclePositions = {};
  vehicleRoutes = {};
  etaDisplay.innerHTML = "";
  if (studentMarker) {
    map.removeLayer(studentMarker);
    studentMarker = null;
  }

  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});

// ================== Init Map ==================
function initMap() {
  if (!navigator.geolocation) {
    alert("เบราว์เซอร์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      let lat = pos.coords.latitude;
      let lng = pos.coords.longitude;
      console.log("📍 Student GPS (init):", lat, lng);

      const studentLatLng = L.latLng(lat, lng);
      if (!regionBounds.contains(studentLatLng)) {
        alert("คุณอยู่นอกพื้นที่ของแอปพลิเคชัน ไม่สามารถใช้บริการได้");
        return;
      }

      studentPos = { lat, lng };
      map = L.map("map").setView([lat, lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      studentMarker = L.marker([lat, lng], { icon: studentIcon })
        .addTo(map)
        .bindPopup("คุณอยู่ที่นี่")
        .openPopup();

      L.rectangle(regionBounds, {
        color: "blue",
        weight: 2,
        fillOpacity: 0.05,
      }).addTo(map);
      map.fitBounds(regionBounds);
      map.regionBounds = regionBounds;
    },
    (err) => alert("ไม่สามารถเข้าถึงพิกัดคุณได้: " + err.message),
    { enableHighAccuracy: true }
  );
}

// ================== Update Student Location ==================
function startStudentLocationUpdate() {
  if (!navigator.geolocation) return;

  if (updateInterval) clearInterval(updateInterval);

  updateInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let lat = pos.coords.latitude;
        let lng = pos.coords.longitude;
        console.log("📍 Student GPS (update):", lat, lng);

        const studentLatLng = L.latLng(lat, lng);
        if (!regionBounds.contains(studentLatLng)) {
          console.warn("นักศึกษาอยู่นอกพื้นที่ →", lat, lng);
          return;
        }

        studentPos = { lat, lng };
        if (studentMarker) studentMarker.setLatLng([lat, lng]);
      },
      (err) => console.error("Student GPS Error:", err),
      { enableHighAccuracy: true }
    );
  }, 5000);
}

// ================== Haversine, ETA, Animate Marker ==================
// (คงโค้ดเดิมไว้ทั้งหมดตามที่คุณให้มา)

// ================== Listen Vehicles ==================
function shortenName(name, maxLength = 1) {
  if (!name) return "";
  return name.length > maxLength ? name.slice(0, maxLength) + "…" : name;
}

function listenVehicles() {
  const vehiclesRef = ref(rtdb, "vehicles");
  onValue(vehiclesRef, (snapshot) => {
    if (!studentPos) return;

    const vehicles = snapshot.val() || {};

    etaDisplay.innerHTML = "<h3>ETA รถสวัสดิการ</h3><ul id='etaList'></ul>";
    const etaList = document.getElementById("etaList");

    for (let uid in vehicleMarkers) {
      if (!vehicles[uid] || vehicles[uid].status !== "online") {
        map.removeLayer(vehicleMarkers[uid]);
        delete vehicleMarkers[uid];
      }
    }
    for (let uid in vehicleRoutes) {
      map.removeLayer(vehicleRoutes[uid]);
    }
    vehicleRoutes = {};

    for (let uid in vehicles) {
      const v = vehicles[uid];
      if (v.status !== "online" || v.lat == null || v.lng == null) continue;

      const vehicleLatLng = L.latLng(v.lat, v.lng);
      if (!map.regionBounds || !map.regionBounds.contains(vehicleLatLng))
        continue;

      const distanceKm = haversineDistance(
        studentPos.lat,
        studentPos.lng,
        v.lat,
        v.lng
      );
      const etaMin = calculateETA(distanceKm);

      const displayName = shortenName(v.name || uid, 1);

      if (!vehicleMarkers[uid]) {
        vehicleMarkers[uid] = L.marker([v.lat, v.lng], { icon: busIcon })
          .addTo(map)
          .bindPopup(`รถ ${displayName}<br>ETA: ${etaMin} นาที`);
      } else {
        animateMarker(uid, { lat: v.lat, lng: v.lng });
        vehicleMarkers[uid]
          .getPopup()
          .setContent(`รถ ${displayName}<br>ETA: ${etaMin} นาที`);
      }

      vehicleRoutes[uid] = L.polyline(
        [
          [v.lat, v.lng],
          [studentPos.lat, studentPos.lng],
        ],
        { color: "red" }
      ).addTo(map);

      const li = document.createElement("li");
      li.textContent = `🚍 ${displayName} - ETA: ${etaMin} นาที`;
      etaList.appendChild(li);
    }
  });
}
