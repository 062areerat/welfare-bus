// js/auth.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export async function registerUser(email, password, role) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      role: role,
      createdAt: serverTimestamp(),
    });
    alert("สมัครสมาชิกสำเร็จ!");
    return userCredential.user;
  } catch (err) {
    alert("เกิดข้อผิดพลาด: " + err.message);
    return null;
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (err) {
    alert("เข้าสู่ระบบล้มเหลว: " + err.message);
    return null;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    alert("ออกจากระบบเรียบร้อย");
  } catch (err) {
    alert("ออกจากระบบล้มเหลว: " + err.message);
  }
}

export function onAuthStateChanged(callback) {
  auth.onAuthStateChanged(callback);
}
