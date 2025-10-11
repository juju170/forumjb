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
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🧩 Konfigurasi Firebase kamu
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
// 🏠 HALAMAN BERANDA
// ==============================
function loadHomePage() {
  const postList = document.getElementById("postList");
  const btnMengikuti = document.getElementById("btnMengikuti");
  const btnJelajahi = document.getElementById("btnJelajahi");

  if (!postList) {
    console.error("❌ Elemen #postList tidak ditemukan di halaman home.html");
    return;
  }

  // ✅ Ambil postingan dari Firestore realtime
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    console.log("📦 Jumlah posting terbaca:", snapshot.size);
    renderPosts(snapshot, postList);
  });

  // 🔘 Tombol filter (sementara dummy)
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
// 🧩 RENDER POSTINGAN LENGKAP
// ==============================
function renderPosts(snapshot, postList) {
  if (!postList) return;

  if (snapshot.empty) {
    postList.innerHTML = `
      <p style="text-align:center;color:#777;margin-top:40px;">
        Belum ada postingan 😢
      </p>`;
    return;
  }

  postList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const postId = docSnap.id;
    const user = data.user || "Anonim";
    const text = data.text || "";
    const image = data.image || "";
    const likes = data.likes || [];
    const comments = data.comments || [];
    const isLiked = likes.includes(auth.currentUser?.email);
    const time = data.createdAt
      ? new Date(data.createdAt.seconds * 1000).toLocaleString()
      : "Baru saja";

    // ✅ Struktur tampilan postingan
    const postHTML = `
      <div class="post-card" data-id="${postId}">
        <div class="post-header">
          <img src="${data.userPhoto || 'assets/icons/profile.png'}" class="post-avatar" alt="User">
          <div class="post-author">${user}</div>
        </div>

        <p class="post-text">${text}</p>

        ${image ? `<img src="${image}" alt="gambar" class="post-img" loading="lazy" />` : ""}

        <div class="post-footer">
          <button class="like-btn ${isLiked ? "liked" : ""}">❤️ ${likes.length}</button>
          <button class="comment-btn">💬 ${comments.length}</button>
          <small style="float:right;color:#888;">📅 ${time}</small>
        </div>

        <div class="comment-box hidden">
          <input type="text" class="comment-input" placeholder="Tulis komentar..." />
          <button class="send-comment">Kirim</button>
          <div class="comment-list">
  ${comments
    .map((c) => `
      <p>
        <b>${c.user}</b>: ${c.text}<br>
        <small style="color:#888;">🕒 ${c.time || ""}</small>
      </p>
    `)
    .join("")}
</div>
        </div>
      </div>
    `;

    postList.insertAdjacentHTML("beforeend", postHTML);
  });

  // ==============================
  // ❤️ LIKE & 💬 KOMENTAR EVENT
  // ==============================
  const likeBtns = document.querySelectorAll(".like-btn");
  const commentBtns = document.querySelectorAll(".comment-btn");
  const sendBtns = document.querySelectorAll(".send-comment");

  // ❤️ Sistem Like
  likeBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return alert("Login dulu untuk menyukai postingan!");

      const isLiked = btn.classList.contains("liked");

      try {
        await updateDoc(postRef, {
          likes: isLiked ? arrayRemove(userEmail) : arrayUnion(userEmail),
        });
      } catch (err) {
        console.error("❌ Gagal update like:", err);
      }
    });
  });

  // 💬 Tampilkan/Sembunyikan kolom komentar
  commentBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".post-card").querySelector(".comment-box");
      box.classList.toggle("hidden");
    });
  });

  // ✍️ Kirim komentar baru
  sendBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const input = postCard.querySelector(".comment-input");
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
const comment = {
  user: auth.currentUser?.email || "Anonim",
  text,
  time: now.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
};

try {
  await updateDoc(doc(db, "posts", postId), {
    comments: arrayUnion(comment),
  });

        // 🔥 Langsung tampil di bawah tanpa reload
        const commentList = postCard.querySelector(".comment-list");
        const newComment = document.createElement("p");
        newComment.innerHTML = `<b>${comment.user}</b>: ${comment.text}`;
        commentList.appendChild(newComment);

        input.value = "";
      } catch (err) {
        console.error("❌ Gagal kirim komentar:", err);
      }
    });
  });
}

// ==============================
// ➕ HALAMAN POST
// ==============================
function loadPostPage() {
  const postText = document.getElementById("postText");
  const postImage = document.getElementById("postImage");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadMsg = document.getElementById("uploadMsg");
  const previewBox = document.getElementById("previewBox");

  if (!postText || !postImage || !uploadBtn) return;

  postImage.addEventListener("change", () => {
    const file = postImage.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      previewBox.innerHTML = `<img src="${e.target.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
  });

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
        text,
        image: imageUrl,
        createdAt: serverTimestamp()
      });

      uploadMsg.textContent = "✅ Postingan berhasil disimpan!";
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
// 🔥 CEK STATUS LOGIN FIREBASE
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

console.log("✅ app.js selesai dimuat");
