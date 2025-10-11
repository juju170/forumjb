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
  deleteDoc,
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
        showToast("Anda telah keluar.");
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
    onSnapshot(q, (snapshot) => {
  renderPosts(snapshot, postList);
});
  }
}

// ======================================
// 📜 Fungsi Menampilkan Semua Postingan
// ======================================
function renderPosts(posts) {
  const postList = document.getElementById("postList");
  postList.innerHTML = "";

  posts.forEach((docSnap) => {
    const data = docSnap.data();
    const postId = docSnap.id;

    // ====== Buat Kartu Postingan ======
    const postCard = document.createElement("div");
    postCard.classList.add("post-card");
    postCard.dataset.id = postId;

    postCard.innerHTML = `
      <div class="post">
        <img src="${data.image || 'assets/no-image.png'}" alt="gambar" class="post-img" />
        <p class="post-text">${data.text || ""}</p>
        <p class="post-user">👤 ${data.user || "Anonim"}</p>
        <div class="post-actions">
          <button class="like-btn">❤️ ${data.likes?.length || 0}</button>
          <button class="comment-btn">💬 ${data.comments?.length || 0}</button>
          ${
            auth.currentUser?.email === data.userEmail
              ? `<button class="edit-btn">✏️</button>
                 <button class="delete-btn">🗑️</button>`
              : ""
          }
        </div>
        <div class="comment-section" style="display:none;">
          <div class="comment-list">
            ${
              (data.comments || [])
                .map((c) => {
                  const canEdit = c.userEmail === auth.currentUser?.email;
                  return `
                    <div class="comment-item fade-in">
                      <b>${c.user}</b>: <span class="comment-text">${c.text}</span>
                      ${
                        canEdit
                          ? `<span class="comment-actions">
                              <button class="edit-comment" title="Edit">✏️</button>
                              <button class="delete-comment" title="Hapus">🗑️</button>
                            </span>`
                          : ""
                      }
                      <br><small style="color:#888;">🕒 ${c.time || ""}</small>
                    </div>
                  `;
                })
                .join("") || "<p>Belum ada komentar</p>"
            }
          </div>
          <div class="comment-input">
            <input type="text" placeholder="Tulis komentar..." class="comment-textbox" />
            <button class="send-comment">Kirim</button>
          </div>
        </div>
      </div>
    `;
    postList.appendChild(postCard);

    // ==============================
    // ❤️ TOMBOL LIKE
    // ==============================
    const likeBtn = postCard.querySelector(".like-btn");
    likeBtn.addEventListener("click", async () => {
      const userEmail = auth.currentUser?.email;
      const likes = data.likes || [];
      const postRef = doc(db, "posts", postId);
      const alreadyLiked = likes.includes(userEmail);

      try {
        await updateDoc(postRef, {
          likes: alreadyLiked
            ? arrayRemove(userEmail)
            : arrayUnion(userEmail),
        });
        likeBtn.classList.add("pop");
        showToast(alreadyLiked ? "💔 Batal suka" : "❤️ Disukai!");
      } catch (err) {
        console.error("❌ Gagal update like:", err);
      }
    });

    // ==============================
    // 💬 TOMBOL KOMENTAR (MUNCUL/SEMBUNYI)
    // ==============================
    const commentBtn = postCard.querySelector(".comment-btn");
    const commentSection = postCard.querySelector(".comment-section");
    commentBtn.addEventListener("click", () => {
      commentSection.style.display =
        commentSection.style.display === "none" ? "block" : "none";
    });

    // ==============================
    // 💬 KIRIM KOMENTAR BARU
    // ==============================
    const sendBtn = postCard.querySelector(".send-comment");
    const textbox = postCard.querySelector(".comment-textbox");
    const commentList = postCard.querySelector(".comment-list");
    sendBtn.addEventListener("click", async () => {
      const text = textbox.value.trim();
      if (!text) return showToast("✏️ Tulis komentar dulu!");

      const now = new Date();
      const comment = {
        user:
          auth.currentUser?.displayName ||
          auth.currentUser?.email ||
          "Anonim",
        userEmail: auth.currentUser?.email || null,
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
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
          comments: arrayUnion(comment),
        });
        textbox.value = "";
        showToast("💬 Komentar terkirim!");
      } catch (err) {
        console.error("❌ Gagal kirim komentar:", err);
      }
    });

    // ==============================
    // ✏️ EDIT & 🗑️ HAPUS KOMENTAR
    // ==============================
    postCard.addEventListener("click", async (e) => {
      const target = e.target;
      const postRef = doc(db, "posts", postId);

      // EDIT KOMENTAR
      if (target.classList.contains("edit-comment")) {
        const commentItem = target.closest(".comment-item");
        const oldText = commentItem.querySelector(".comment-text").textContent;
        const newText = prompt("Ubah komentar:", oldText);
        if (!newText || newText.trim() === oldText) return;

        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updated = data.comments.map((c) =>
            c.userEmail === auth.currentUser?.email && c.text === oldText
              ? { ...c, text: newText.trim() }
              : c
          );
          await updateDoc(postRef, { comments: updated });
          commentItem.querySelector(".comment-text").textContent = newText.trim();
          showToast("✅ Komentar diperbarui!");
        } catch (err) {
          console.error("❌ Gagal edit komentar:", err);
        }
      }

      // HAPUS KOMENTAR
      if (target.classList.contains("delete-comment")) {
        if (!confirm("Yakin mau hapus komentar ini?")) return;
        const commentItem = target.closest(".comment-item");
        const textToDelete = commentItem.querySelector(".comment-text").textContent;

        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updated = data.comments.filter(
            (c) => !(c.userEmail === auth.currentUser?.email && c.text === textToDelete)
          );
          await updateDoc(postRef, { comments: updated });
          commentItem.remove();
          showToast("🗑️ Komentar dihapus!");
        } catch (err) {
          console.error("❌ Gagal hapus komentar:", err);
        }
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
  userDisplay: user?.displayName || user?.email || "Anonim",
  userPhoto: user?.photoURL || "assets/icons/profile.png",
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

// ==============================
// 🔔 Fungsi Notifikasi Visual (Toast)
// ==============================
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 20px)";
    setTimeout(() => toast.remove(), 600);
  }, 1500);
}
console.log("✅ app.js selesai dimuat");
