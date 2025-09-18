import { auth, rtdb } from "../../public/js/firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  // ================== DOM Elements ==================
  const registerBtn = document.getElementById("driver-register");
  const loginBtn = document.getElementById("driver-login");
  const logoutBtn = document.getElementById("logout");
  const startTrackingBtn = document.getElementById("start-tracking");
  const stopTrackingBtn = document.getElementById("stop-tracking");
  const trackingSection = document.getElementById("tracking-section");
  const authSection = document.getElementById("auth-section");
  const emailInput = document.getElementById("driver-email");
  const passwordInput = document.getElementById("driver-password");
  const mapContainer = document.getElementById("driver-map");

  let map,
    driverMarker = null;
  let updateInterval = null;

  const busIcon = L.icon({
    iconUrl: "img/car.png",
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });

  // ================== ตรวจสอบ token ตอนโหลดหน้า ==================
  const token = localStorage.getItem("driverToken");
  if (token) {
    // Token มีค่า → แสดงหน้าติดตามรถ
    authSection.style.display = "none";
    trackingSection.style.display = "block";

    // ตรวจสอบผู้ใช้ Firebase
    auth.onAuthStateChanged((user) => {
      if (user) {
        initMap();
      } else {
        // ถ้า token ไม่ถูกต้อง → ลบ token
        localStorage.removeItem("driverToken");
        authSection.style.display = "block";
        trackingSection.style.display = "none";
      }
    });
  }

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
      localStorage.setItem("driverToken", token);

      authSection.style.display = "none";
      trackingSection.style.display = "block";
      initMap();
    } catch (err) {
      alert(err.message);
    }
  });

  // ================== Logout ==================
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);

    // ✅ ลบ token
    localStorage.removeItem("driverToken");

    authSection.style.display = "block";
    trackingSection.style.display = "none";

    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    if (driverMarker) {
      map.removeLayer(driverMarker);
      driverMarker = null;
    }

    const user = auth.currentUser;
    if (user) {
      set(ref(rtdb, `vehicles/${user.uid}`), {
        driverUid: user.uid,
        lat: null,
        lng: null,
        timestamp: Date.now(),
        status: "offline",
        name: user.email.split("@")[0],
      });
    }
  });

  // ================== Init Map ==================
  function initMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map = L.map("driver-map").setView([latitude, longitude], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(map);
        },
        (err) => {
          console.error("ไม่สามารถอ่านพิกัดได้:", err);
          map = L.map("driver-map").setView([9.14, 99.33], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
          }).addTo(map);
        },
        { enableHighAccuracy: true }
      );
    }
  }

  // ================== Start Tracking ==================
  startTrackingBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }

    if (updateInterval) clearInterval(updateInterval);

    updateInterval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const user = auth.currentUser;
        if (user) {
          await set(ref(rtdb, `vehicles/${user.uid}`), {
            driverUid: user.uid,
            lat: latitude,
            lng: longitude,
            timestamp: Date.now(),
            status: "online",
            name: user.email.split("@")[0],
          });

          const driverPos = { lat: latitude, lng: longitude };
          if (!driverMarker) {
            driverMarker = L.marker(driverPos, { icon: busIcon })
              .addTo(map)
              .bindPopup("🚍 รถของคุณ")
              .openPopup();
          } else {
            driverMarker.setLatLng(driverPos);
          }
          map.setView(driverPos, 16);
        }
      });
    }, 5000);
  });

  // ================== Stop Tracking ==================
  stopTrackingBtn.addEventListener("click", () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    const user = auth.currentUser;
    if (user) {
      set(ref(rtdb, `vehicles/${user.uid}`), {
        driverUid: user.uid,
        lat: null,
        lng: null,
        timestamp: Date.now(),
        status: "offline",
        name: user.email.split("@")[0],
      });
    }

    if (driverMarker) {
      map.removeLayer(driverMarker);
      driverMarker = null;
    }
  });
});
