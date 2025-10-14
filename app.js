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
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
  getDoc
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

    buttons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add("active");

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
        setTimeout(() => (window.location.href = "index.html"), 1000);
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
        setTimeout(() => (window.location.href = "index.html"), 1000);
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
  const jelajahiSelect = document.getElementById("jelajahiFilter");

  if (!postList) {
    console.error("❌ Elemen #postList tidak ditemukan di halaman home.html");
    return;
  }

  if (btnMengikuti && btnJelajahi && jelajahiSelect) {
    btnMengikuti.addEventListener("click", () => {
      btnMengikuti.classList.add("active");
      btnJelajahi.classList.remove("active");
      jelajahiSelect.style.display = "none";
      loadPosts("mengikuti");
    });

    btnJelajahi.addEventListener("click", () => {
      btnMengikuti.classList.remove("active");
      btnJelajahi.classList.add("active");
      jelajahiSelect.style.display = "inline-block";
      loadPosts(jelajahiSelect.value || "terbaru");
    });

    jelajahiSelect.addEventListener("change", () => {
      loadPosts(jelajahiSelect.value);
    });
  }

  loadPosts("mengikuti");
}

// =====================================
// 🔄 LOAD POSTING SESUAI FILTER
// =====================================
async function loadPosts(filterType = "mengikuti") {
  const postList = document.getElementById("postList");
  if (!postList) return;

  postList.innerHTML = `<p style="text-align:center;color:#777;">⏳ Memuat postingan...</p>`;

  try {
    const postsRef = collection(db, "posts");
    let q;

    if (filterType === "mengikuti") {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        postList.innerHTML = `<p style="text-align:center;color:#777;">🚫 Kamu belum login.</p>`;
        return;
      }

      const followingSnap = await getDocs(collection(db, "users", currentUser.uid, "following"));
      const followingIds = followingSnap.docs.map(doc => doc.id);

      if (followingIds.length === 0) {
        postList.innerHTML = `<p style="text-align:center;color:#777;">Kamu belum mengikuti siapa pun.</p>`;
        return;
      }

      const idsToQuery = followingIds.slice(0, 10);
      q = query(postsRef, where("userId", "in", idsToQuery), orderBy("createdAt", "desc"));
    }

    else if (filterType === "populer") {
      const oneWeekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const oneWeekAgo = new Date(oneWeekAgoMs);
      q = query(
        postsRef,
        where("createdAt", ">", oneWeekAgo),
        orderBy("likesCount", "desc")
      );
    }

    else {
      q = query(postsRef, orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      postList.innerHTML = `<p style="text-align:center;color:#777;">Belum ada postingan.</p>`;
      return;
    }

    renderPosts(snapshot, postList);

  } catch (err) {
    console.error("❌ Gagal loadPosts:", err);
    postList.innerHTML = `<p style="text-align:center;color:#d00;">Gagal memuat postingan.</p>`;
  }
}
// ==============================
// 🧩 RENDER POSTINGAN
// ==============================
function renderPosts(snapshot, postList) {
  if (!postList) return;
  if (snapshot.empty) {
    postList.innerHTML = `<p style="text-align:center;color:#777;margin-top:40px;">Belum ada postingan 😢</p>`;
    return;
  }

  postList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const postId = docSnap.id;
    const userEmail = auth.currentUser?.email;
    const isOwner = userEmail === data.user;
    const user = data.userDisplay || auth.currentUser?.displayName || data.user || "Anonim";
    const photo = data.userPhoto || "assets/icons/profile.png";
    const text = data.text || "";
    const image = data.image || "";
    const likes = data.likes || [];
    const comments = data.comments || [];
    const isLiked = likes.includes(userEmail);

    const time = data.createdAt
      ? new Date(data.createdAt.seconds * 1000).toLocaleString("id-ID")
      : "Baru saja";

    const sortedComments = [...comments].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    const followBtnHTML =
      auth.currentUser && auth.currentUser.uid !== data.userId
        ? `<button class="follow-inline-btn" data-userid="${data.userId}" data-email="${data.user}">➕ Ikuti</button>`
        : "";

    const postHTML = `
      <div class="post-card fade-in" data-id="${postId}">
        <div class="post-header">
          <img src="${photo}" alt="User" class="post-avatar" />
          <div class="post-author">${user}</div>
          ${followBtnHTML}
          ${isOwner ? `<div class="post-actions"><button class="edit-post-btn">✏️</button><button class="delete-post-btn">🗑️</button></div>` : ""}
        </div>
        <p class="post-text">${text}</p>
        ${image ? `<img src="${image}" class="post-img" loading="lazy" />` : ""}
        <div class="post-footer">
          <button class="like-btn ${isLiked ? "liked" : ""}">❤️ ${likes.length}</button>
          <button class="comment-btn">💬 ${comments.length}</button>
          <button class="share-btn">🔗</button>
          <button class="report-btn">🚨</button>
          <small style="float:right;color:#888;">📅 ${time}</small>
        </div>
        <div class="comment-box hidden">
          <input type="text" class="comment-input" maxlength="200" placeholder="Tulis komentar..." />
          <button class="send-comment">Kirim</button>
          <div class="comment-list">
            ${sortedComments
              .map((c) => {
                const isCommentOwner = auth.currentUser?.email === c.userEmail;
                return `<p class="comment-item fade-in">
                  <b>${c.user}</b>: <span class="comment-text">${c.text}</span>
                  ${
                    isCommentOwner
                      ? `<span class="comment-actions"><button class="edit-comment">✏️</button><button class="delete-comment">🗑️</button></span>`
                      : ""
                  }
                  <br><small style="color:#888;">🕒 ${c.time || ""}</small>
                </p>`;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;

    postList.insertAdjacentHTML("beforeend", postHTML);
  });

  setupInlineFollowButtons();
}

// ==============================
// ⚡ AKTIFKAN SEMUA TOMBOL POSTINGAN
// ==============================
function setupPostInteractions() {
  // ❤️ LIKE
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return showToast("Login dulu untuk menyukai postingan!");
      const isLiked = btn.classList.contains("liked");
      try {
        await updateDoc(postRef, {
          likes: isLiked ? arrayRemove(userEmail) : arrayUnion(userEmail)
        });
        btn.classList.toggle("liked");
        let num = parseInt(btn.textContent.replace(/[^0-9]/g, ""));
        btn.innerHTML = `❤️ ${isLiked ? num - 1 : num + 1}`;
      } catch (err) {
        console.error("❌ Gagal update like:", err);
      }
    });
  });

  // 💬 KOMENTAR (TAMPIL / SEMBUNYI)
  document.querySelectorAll(".comment-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".post-card").querySelector(".comment-box");
      box.classList.toggle("hidden");
    });
  });

  // 💬 KIRIM KOMENTAR
  document.querySelectorAll(".send-comment").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const input = postCard.querySelector(".comment-input");
      const text = input.value.trim();
      if (!text) return showToast("Komentar tidak boleh kosong!");
      const user = auth.currentUser;
      if (!user) return showToast("Login dulu untuk berkomentar!");
      const comment = {
        id: Date.now(),
        user: user.displayName || user.email,
        userEmail: user.email,
        text,
        time: new Date().toLocaleString("id-ID")
      };
      try {
        await updateDoc(postRef, { comments: arrayUnion(comment) });
        input.value = "";
        showToast("💬 Komentar terkirim!");
      } catch (e) {
        console.error("❌ Gagal kirim komentar:", e);
      }
    });
  });

  // ✏️ EDIT KOMENTAR & 🗑️ HAPUS KOMENTAR
  document.querySelectorAll(".comment-list").forEach(list => {
    list.addEventListener("click", async e => {
      const target = e.target;
      const postCard = target.closest(".post-card");
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return showToast("Login dulu untuk mengelola komentar!");

      // ✏️ EDIT KOMENTAR
      if (target.classList.contains("edit-comment")) {
        const item = target.closest(".comment-item");
        const oldText = item.querySelector(".comment-text").textContent;
        const newText = prompt("Ubah komentar:", oldText);
        if (!newText || newText.trim() === oldText) return;
        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updated = data.comments.map(c =>
            c.userEmail === userEmail && c.text === oldText
              ? { ...c, text: newText.trim() }
              : c
          );
          await updateDoc(postRef, { comments: updated });
          item.querySelector(".comment-text").textContent = newText.trim();
          showToast("✅ Komentar diperbarui!");
        } catch (err) {
          console.error("❌ Gagal edit komentar:", err);
        }
      }

      // 🗑️ HAPUS KOMENTAR
      if (target.classList.contains("delete-comment")) {
        if (!confirm("Yakin mau hapus komentar ini?")) return;
        const item = target.closest(".comment-item");
        const textToDelete = item.querySelector(".comment-text").textContent;
        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updated = data.comments.filter(
            c => !(c.userEmail === userEmail && c.text === textToDelete)
          );
          await updateDoc(postRef, { comments: updated });
          item.remove();
          showToast("🗑️ Komentar dihapus!");
        } catch (err) {
          console.error("❌ Gagal hapus komentar:", err);
        }
      }
    });
  });

  // 🔗 SHARE POSTINGAN
  document.querySelectorAll(".share-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const shareUrl = `${window.location.origin}/forumjb/index.html?post=${postId}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("🔗 Link postingan disalin!");
      } catch {
        showToast("❌ Tidak bisa menyalin link.");
      }
    });
  });

  // 🚨 LAPORKAN POSTINGAN
  document.querySelectorAll(".report-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const alasan = prompt("Tulis alasan laporan:");
      if (!alasan) return;
      try {
        await addDoc(collection(db, "reports"), {
          postId,
          reporter: auth.currentUser?.email || "Anonim",
          reason: alasan,
          time: new Date().toISOString()
        });
        showToast("🚨 Laporan terkirim!");
      } catch (e) {
        console.error("❌ Gagal kirim laporan:", e);
      }
    });
  });

  // ✏️ EDIT POST & 🗑️ HAPUS POST
  document.querySelectorAll(".edit-post-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const textElem = postCard.querySelector(".post-text");
      const newText = prompt("Ubah isi posting:", textElem.innerText);
      if (!newText) return;
      try {
        await updateDoc(doc(db, "posts", postId), { text: newText });
        textElem.textContent = newText;
        showToast("✅ Postingan berhasil diubah!");
      } catch (err) {
        console.error("❌ Gagal edit posting:", err);
      }
    });
  });

  document.querySelectorAll(".delete-post-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Yakin mau hapus posting ini?")) return;
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      try {
        await deleteDoc(doc(db, "posts", postId));
        postCard.remove();
        showToast("🗑️ Postingan dihapus!");
      } catch (err) {
        console.error("❌ Gagal hapus posting:", err);
      }
    });
  });

  // 👥 FOLLOW INLINE
  document.querySelectorAll(".follow-inline-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.dataset.userid;
      const targetEmail = btn.dataset.email;
      const user = auth.currentUser;
      if (!user || !targetId) return showToast("Login dulu untuk mengikuti!");
      if (user.uid === targetId) return;
      const followRef = doc(db, "users", user.uid, "following", targetId);
      const snap = await getDoc(followRef);
      const isFollowing = snap.exists();
      try {
        if (isFollowing) {
          await deleteDoc(followRef);
          btn.textContent = "➕ Ikuti";
          showToast(`❎ Berhenti mengikuti ${targetEmail}`);
        } else {
          await setDoc(followRef, { followedAt: Date.now() });
          btn.textContent = "✅ Mengikuti";
          showToast(`✅ Sekarang mengikuti ${targetEmail}`);
        }
      } catch (e) {
        console.error("❌ Gagal ubah status follow:", e);
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
    reader.onload = e => { previewBox.innerHTML = `<img src="${e.target.result}" alt="preview">`; };
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
        const res = await fetch("https://api.cloudinary.com/v1_1/dvjfrrusn/image/upload", { method: "POST", body: data });
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
// 🔥 CEK STATUS LOGIN
// ==============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPage("home");
  } else {
    loadPage("auth");
  }
});

// ==============================
// 🔔 TOAST NOTIFIKASI
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

console.log("✅ app.js versi fix selesai dimuat");
