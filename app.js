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

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🧩 Konfigurasi Firebase kamu (ganti dengan punyamu)
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
// 🌐 SISTEM NAVIGASI HALAMAN
// ==============================
const content = document.getElementById("content");
const buttons = document.querySelectorAll(".nav-btn");

async function loadPage(page) {
  try {
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    content.innerHTML = html;

    // Navigasi aktif
    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    // Jalankan logika per halaman
    if (page === "auth") handleAuthEvents();
    if (page === "profile" && auth.currentUser) showUserProfile(auth.currentUser);
    if (page === "home") loadHomePage();
    if (page === "post") loadPostPage();

  } catch (e) {
    content.innerHTML = `<p style="color:red;text-align:center;">Halaman gagal dimuat 😢</p>`;
    console.error("❌ Gagal memuat halaman:", e);
  }
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.getAttribute("data-page");
    loadPage(page);
  });
});

// ==============================
// 👥 LOGIN & REGISTER
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
        msg.textContent = "❌ Gagal daftar: " + e.code;
        console.error(e);
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
        msg.textContent = "❌ Gagal login: " + e.code;
        console.error(e);
      }
    });
  }
}

// ==============================
// 👤 PROFIL USER
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
  }
}

// ==============================
// 🏠 HALAMAN BERANDA (REALTIME FIRESTORE)
// ==============================
function loadHomePage() {
  const postList = document.getElementById("postList");
  const btnMengikuti = document.getElementById("btnMengikuti");
  const btnJelajahi = document.getElementById("btnJelajahi");

  if (!postList) return;

  // ==============================
  // 🧠 Fungsi render posting
  // ==============================
  function renderPosts(snapshot) {
    if (snapshot.empty) {
      postList.innerHTML = "<p style='text-align:center;color:#777;'>Belum ada postingan 😢</p>";
      return;
    }

    // Bersihkan list lama
    postList.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const user = data.user || "Anonim";
      const text = data.text || "";
      const image = data.image || "";
      const time = data.createdAt
        ? new Date(data.createdAt.seconds * 1000).toLocaleString()
        : "Baru saja";

      // Buat tampilan kartu posting
      const postHTML = `
        <div class="post-card">
          <div class="post-header">
            <img src="../assets/icons/profile.png" class="post-avatar" alt="avatar">
            <span class="post-author">${user}</span>
          </div>
          <p class="post-text">${text}</p>
          ${image ? `<img src="${image}" class="post-image" alt="gambar posting">` : ""}
          <div class="post-footer">
            <small style="color:#888;">📅 ${time}</small>
          </div>
        </div>
      `;
      postList.insertAdjacentHTML("beforeend", postHTML);
    });
  }

  // ==============================
  // 🔥 Ambil data Firestore realtime
  // ==============================
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    renderPosts(snapshot);
  });

  // ==============================
  // 🔘 Tombol Filter (sementara dummy)
  // ==============================
  if (btnMengikuti && btnJelajahi) {
    btnMengikuti.addEventListener("click", () => {
      btnMengikuti.classList.add("active");
      btnJelajahi.classList.remove("active");
    });

    btnJelajahi.addEventListener("click", () => {
      btnJelajahi.classList.add("active");
      btnMengikuti.classList.remove("active");
    });
  }
}

// ==============================
// ➕ HALAMAN POST (UPLOAD & FIRESTORE)
// ==============================
function loadPostPage() {
  const postText = document.getElementById("postText");
  const postImage = document.getElementById("postImage");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadMsg = document.getElementById("uploadMsg");
  const previewBox = document.getElementById("previewBox");

  if (!postText || !postImage || !uploadBtn) return;

  // Preview gambar
  postImage.addEventListener("change", () => {
    const file = postImage.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      previewBox.innerHTML = `<img src="${e.target.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
  });

  // Upload gambar ke Cloudinary + simpan ke Firestore
  uploadBtn.addEventListener("click", async () => {
    const text = postText.value.trim();
    const file = postImage.files[0];
    const user = auth.currentUser;

    if (!text && !file) {
      uploadMsg.textContent = "❗ Harap isi teks atau upload gambar.";
      return;
    }

    uploadMsg.textContent = "⏳ Mengupload...";

    try {
      let imageUrl = "";

      if (file) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "forumjb");
        data.append("cloud_name", "dvjfrrusn");

        const res = await fetch("https://api.cloudinary.com/v1_1/dvjfrrusn/image/upload", {
          method: "POST",
          body: data
        });

        const json = await res.json();
        imageUrl = json.secure_url || "";
      }

      await addDoc(collection(db, "posts"), {
        user: user ? user.email : "Anonim",
        text: text,
        image: imageUrl,
        createdAt: serverTimestamp()
      });

      uploadMsg.textContent = "✅ Postingan berhasil disimpan!";
      console.log("📦 Postingan tersimpan ke Firestore.");

      postText.value = "";
      postImage.value = "";
      previewBox.innerHTML = "";

    } catch (e) {
      console.error("❌ Gagal upload/post:", e);
      uploadMsg.textContent = "❌ Gagal upload atau simpan posting.";
    }
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
