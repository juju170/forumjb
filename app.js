// ==============================
// 🔥 FIREBASE CONFIG (versi ringan)
// ==============================

// Import Firebase Modular SDK dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Konfigurasi dari project Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyC8uiIvWOZPcSZOzCGnlRMA7WJ7TIQfy5s",
    authDomain: "tts-indonesia-bf14e.firebaseapp.com",
    projectId: "tts-indonesia-bf14e",
    storageBucket: "tts-indonesia-bf14e.appspot.com",    messagingSenderId: "240052198349",
    appId: "1:240052198349:web:112553f8ca408b2fcc4284"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ==========================
// 🔐 SISTEM LOGIN & REGISTER
// ==========================

async function handleAuthEvents() {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const msg = document.getElementById("authMessage");

  if (!loginBtn || !registerBtn) return; // jika bukan di halaman auth.html

  // Login
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      msg.textContent = "✅ Login berhasil!";
      setTimeout(() => loadPage("home"), 1000);
    } catch (e) {
      msg.textContent = "❌ Gagal login: " + e.message;
    }
  });

  // Register
  registerBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      msg.textContent = "✅ Akun berhasil dibuat!";
      setTimeout(() => loadPage("home"), 1000);
    } catch (e) {
      msg.textContent = "❌ Gagal daftar: " + e.message;
    }
  });
}

console.log("✅ Firebase terhubung!");

// ==============================
// 🧭 SISTEM NAVIGASI HALAMAN
// ==============================
const content = document.getElementById("content");
const buttons = document.querySelectorAll(".nav-btn");

async function loadPage(page) {
  try {
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    content.innerHTML = html;
    handleAuthEvents(); // aktifkan listener login/register kalau di halaman auth
  } catch (e) {
    content.innerHTML = `<p style='text-align:center;color:red;'>Halaman gagal dimuat 😢</p>`;
  }
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => loadPage(btn.dataset.page));
});
