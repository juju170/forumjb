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
    storageBucket: "tts-indonesia-bf14e.firebasestorage.app",
    messagingSenderId: "240052198349",
    appId: "1:240052198349:web:112553f8ca408b2fcc4284"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase terhubung!");

// ==============================
// 🧭 SISTEM NAVIGASI HALAMAN
// ==============================
const content = document.getElementById("content");
const buttons = document.querySelectorAll(".nav-btn");

buttons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const page = btn.dataset.page;
    try {
      const res = await fetch(`pages/${page}.html`);
      const html = await res.text();
      content.innerHTML = html;
      console.log(`➡️ Pindah ke halaman: ${page}`);
    } catch (e) {
      content.innerHTML = `<p style='text-align:center;color:red;'>Halaman gagal dimuat 😢</p>`;
    }
  });
});
