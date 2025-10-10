// ==============================
// 🔥 IMPORT & KONFIGURASI FIREBASE
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🧩 Konfigurasi Firebase kamu (pastikan sudah benar)
const firebaseConfig = {
  apiKey: "AIzaSyC8uiIvWOZPcSZOzCGnlRMA7WJ7TIQfy5s",
    authDomain: "tts-indonesia-bf14e.firebaseapp.com",
    projectId: "tts-indonesia-bf14e",
    storageBucket: "tts-indonesia-bf14e.firebasestorage.app",
    messagingSenderId: "240052198349",
    appId: "1:240052198349:web:112553f8ca408b2fcc4284",    
};

// 🔥 Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase terhubung!");

// ==============================
// 🌐 ELEMENT NAVIGASI & PEMUAT HALAMAN
// ==============================
const content = document.getElementById("content");
const buttons = document.querySelectorAll(".nav-btn");

// Fungsi muat halaman
async function loadPage(page) {
  try {
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    content.innerHTML = html;

    // Set tombol aktif
    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    // Jalankan logika halaman tertentu
    if (page === "auth") handleAuthEvents();
    if (page === "profile" && auth.currentUser) showUserProfile(auth.currentUser);
    if (page === "home") loadHomePage();

  } catch (e) {
    content.innerHTML = `<p style='text-align:center;color:red;'>Halaman gagal dimuat 😢</p>`;
    console.error("❌ Gagal memuat halaman:", e);
  }
}

// Klik tombol navigasi
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.getAttribute("data-page");
    loadPage(page);
  });
});

// ==============================
// 👤 HALAMAN LOGIN / REGISTER
// ==============================
function handleAuthEvents() {
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const msg = document.getElementById("msg");

  if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        msg.textContent = "✅ Akun berhasil dibuat!";
        setTimeout(() => (window.location.href = "../index.html"), 1000);
      } catch (e) {
        console.error("❌ Firebase error:", e);
        msg.textContent = "❌ Gagal daftar: " + e.code;
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      try {
        await signInWithEmailAndPassword(auth, email, password);
        msg.textContent = "✅ Login berhasil!";
        setTimeout(() => (window.location.href = "../index.html"), 1000);
      } catch (e) {
        console.error("❌ Firebase error:", e);
        msg.textContent = "❌ Gagal login: " + e.code;
      }
    });
  }
}

// ==============================
// 👤 PROFIL USER & LOGOUT
// ==============================
function showUserProfile(user) {
  const emailSpan = document.getElementById("userEmail");
  if (emailSpan) emailSpan.textContent = user.email;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        alert("Anda telah keluar.");
        window.location.href = "pages/auth.html";
      } catch (e) {
        console.error("❌ Gagal logout:", e);
      }
    });
  } else {
    console.warn("⚠️ Tombol logout belum ditemukan di halaman.");
  }
}

// ==============================
// 🏠 HALAMAN BERANDA (DUMMY POST)
// ==============================
function loadHomePage() {
  const postList = document.getElementById("postList");
  const btnMengikuti = document.getElementById("btnMengikuti");
  const btnJelajahi = document.getElementById("btnJelajahi");

  if (!postList || !btnMengikuti || !btnJelajahi) return;

  const postinganMengikuti = [
    {
      nama: "Budi RT 2",
      isi: "Panen cabai hari ini! Harga miring buat warga desa 🌶️",
      gambar: "https://placekitten.com/400/250"
    },
    {
      nama: "Siti RW 1",
      isi: "Ada pengajian rutin malam ini di mushola Nurul Huda 🕌",
      gambar: "https://placebear.com/400/250"
    }
  ];

  const postinganJelajahi = [
    {
      nama: "Andi RT 3",
      isi: "Jual bibit singkong unggul, murah meriah 🍃",
      gambar: "https://placekitten.com/401/250"
    },
    {
      nama: "Rina RW 5",
      isi: "Lomba kebersihan antar RT dimulai minggu depan! 💪",
      gambar: "https://placebear.com/401/250"
    }
  ];

  function renderPosts(list) {
    postList.innerHTML = list.map(
      p => `
      <div class="post-card">
        <div class="post-header">
          <img src="../assets/icons/profile.png" class="post-avatar">
          <span class="post-author">${p.nama}</span>
        </div>
        <p>${p.isi}</p>
        <img src="${p.gambar}" class="post-image">
      </div>
    `
    ).join("");
  }

  renderPosts(postinganMengikuti);

  btnMengikuti.addEventListener("click", () => {
    btnMengikuti.classList.add("active");
    btnJelajahi.classList.remove("active");
    renderPosts(postinganMengikuti);
  });

  btnJelajahi.addEventListener("click", () => {
    btnJelajahi.classList.add("active");
    btnMengikuti.classList.remove("active");
    renderPosts(postinganJelajahi);
  });
}

// ==============================
// 🚪 CEK STATUS LOGIN USER
// ==============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("👤 Login terdeteksi:", user.email);
    loadPage("home");
  } else {
    console.log("🚪 Belum login, arahkan ke halaman auth...");
    loadPage("auth");
  }
});
