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
// Pastikan kamu sudah meng-import getDocs, query, where, orderBy, collection kalau belum:
// import { getDocs, query, where, orderBy, collection } from "...firebase-firestore.js";

function loadHomePage() {
  const postList = document.getElementById("postList");
  const btnMengikuti = document.getElementById("btnMengikuti");
  const btnJelajahi = document.getElementById("btnJelajahi");
  const jelajahiSelect = document.getElementById("jelajahiFilter");

  // safety check
  if (!postList) {
    console.error("❌ Elemen #postList tidak ditemukan di halaman home.html");
    return;
  }

  // Pasang event filter (hanya jika elemen ada)
  if (btnMengikuti && btnJelajahi && jelajahiSelect) {
    // klik Mengikuti
    btnMengikuti.addEventListener("click", () => {
      btnMengikuti.classList.add("active");
      btnJelajahi.classList.remove("active");
      jelajahiSelect.style.display = "none";
      loadPosts("mengikuti");
    });

    // klik Jelajahi
    btnJelajahi.addEventListener("click", () => {
      btnMengikuti.classList.remove("active");
      btnJelajahi.classList.add("active");
      jelajahiSelect.style.display = "inline-block";
      loadPosts(jelajahiSelect.value || "terbaru");
    });

    // ganti subfilter Jelajahi
    jelajahiSelect.addEventListener("change", () => {
      loadPosts(jelajahiSelect.value);
    });
  }

  // Jika kamu mau realtime feed global tetap aktif, bisa gunakan onSnapshot.
  // Tapi di sini kita panggil loadPosts untuk load awal sesuai filter:
  loadPosts("mengikuti");
} // penutup loadHomePage()

// =====================================
// Fungsi loadPosts sederhana (ambil sekali, tampilkan hasil)
// =====================================
async function loadPosts(filterType = "mengikuti") {
  const postList = document.getElementById("postList");
  if (!postList) return;

  postList.innerHTML = `<p style="text-align:center;color:#777;">⏳ Memuat postingan...</p>`;

  try {
    const postsRef = collection(db, "posts");
    let q;

    // ==============================
    // 🔹 FILTER: MENGIKUTI
    // ==============================
    if (filterType === "mengikuti") {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        postList.innerHTML = `<p style="text-align:center;color:#777;">🚫 Kamu belum login.</p>`;
        return;
      }

      // Ambil daftar UID user yang diikuti
      const followingSnap = await getDocs(collection(db, "users", currentUser.uid, "following"));
      const followingIds = followingSnap.docs.map(doc => doc.id);

      if (followingIds.length === 0) {
        postList.innerHTML = `<p style="text-align:center;color:#777;">Kamu belum mengikuti siapa pun.</p>`;
        return;
      }

      // Firestore batas where('in') max 10 item → ambil maksimal 10 dulu
      const idsToQuery = followingIds.slice(0, 10);
      q = query(postsRef, where("userId", "in", idsToQuery), orderBy("createdAt", "desc"));
    }

    // ==============================
    // 🔹 FILTER: POPULER
    // ==============================
    else if (filterType === "populer") {
      const oneWeekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const oneWeekAgo = new Date(oneWeekAgoMs);
      q = query(
        postsRef,
        where("createdAt", ">", oneWeekAgo),
        orderBy("likesCount", "desc")
      );
    }

    // ==============================
    // 🔹 FILTER: JELAJAHI (TERBARU)
    // ==============================
    else {
      q = query(postsRef, orderBy("createdAt", "desc"));
    }

    // ==============================
    // 🔹 AMBIL DATA DAN RENDER
    // ==============================
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

    // 🔹 Tombol follow hanya muncul jika bukan posting sendiri
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

  // 🔹 Jalankan fungsi follow di setiap posting
  setupInlineFollowButtons();
}


  // ==============================
// 🔗 SHARE POSTINGAN
// ==============================
const shareBtns = document.querySelectorAll(".share-btn");
shareBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const postCard = btn.closest(".post-card");
    const postId = postCard.dataset.id;
    const shareUrl = `${window.location.origin}/forumjb/index.html?post=${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("🔗 Link postingan disalin!");
    } catch (err) {
      console.error("❌ Gagal salin link:", err);
      showToast("❌ Tidak bisa menyalin link.");
    }
  });
});

// ==============================
// 🚨 LAPORKAN POSTINGAN
// ==============================
const reportBtns = document.querySelectorAll(".report-btn");
reportBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const postCard = btn.closest(".post-card");
    const postId = postCard.dataset.id;
    if (!confirm("Laporkan posting ini? (gunakan jika konten tidak pantas)")) return;

    const alasan = prompt("Tulis alasan laporan (misal: menipu, tidak sopan):");
    if (!alasan || alasan.trim() === "") return showToast("⚠️ Alasan tidak boleh kosong!");

    try {
      // 🔹 Ambil data postingan dari Firestore biar kita tahu URL gambarnya
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      const postData = postSnap.exists() ? postSnap.data() : {};

      // 🔹 Kirim laporan lengkap (termasuk gambar)
      await addDoc(collection(db, "reports"), {
        postId,
        reporter: auth.currentUser?.email || "Anonim",
        reason: alasan.trim(),
        image: postData.image || null,   // ✅ simpan URL gambar biar muncul di reports.html
        text: postData.text || "",       // (opsional) simpan teks biar admin lebih tahu konteks
        time: new Date().toISOString(),
      });

      showToast("🚨 Laporan terkirim ke admin!");
    } catch (err) {
      console.error("❌ Gagal kirim laporan:", err);
      showToast("❌ Gagal mengirim laporan.");
    }
  });
});

  // ==============================
// ✏️ EDIT & 🗑️ HAPUS POSTING
// ==============================
const editBtns = document.querySelectorAll(".edit-post-btn");
const deleteBtns = document.querySelectorAll(".delete-post-btn");

// ✏️ Edit teks posting
editBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const postCard = btn.closest(".post-card");
    const postId = postCard.dataset.id;
    const oldText = postCard.querySelector(".post-text").innerText;
    const newText = prompt("Ubah isi posting:", oldText);
    if (newText === null || newText.trim() === "") return;

    try {
      await updateDoc(doc(db, "posts", postId), { text: newText.trim() });
      postCard.querySelector(".post-text").innerText = newText.trim();
      showToast("✅ Postingan berhasil diperbarui!");
    } catch (err) {
      console.error("❌ Gagal update posting:", err);
    }
  });
});

// 🗑️ Hapus posting
deleteBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const postCard = btn.closest(".post-card");
    const postId = postCard.dataset.id;

    if (!confirm("Yakin mau hapus posting ini?")) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      postCard.remove();
      showToast("🗑️ Postingan berhasil dihapus!");
    } catch (err) {
      console.error("❌ Gagal hapus posting:", err);
      showToast("❌ Gagal hapus posting: " + err.message);
    }
  });
});

  const likeBtns = document.querySelectorAll(".like-btn");
  likeBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return showToast("Login dulu untuk menyukai postingan!");
      const isLiked = btn.classList.contains("liked");
      try {
        await updateDoc(postRef, { likes: isLiked ? arrayRemove(userEmail) : arrayUnion(userEmail) });
      } catch (err) {
        console.error("❌ Gagal update like:", err);
      }
    });
  });

  const commentBtns = document.querySelectorAll(".comment-btn");
  commentBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".post-card").querySelector(".comment-box");
      box.classList.toggle("hidden");
    });
  });

  const sendBtns = document.querySelectorAll(".send-comment");
  sendBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const postCard = btn.closest(".post-card");
      const postId = postCard.dataset.id;
      const input = postCard.querySelector(".comment-input");
      const text = input.value.trim();
      if (!text) return showToast("Komentar tidak boleh kosong!");
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return showToast("Login dulu untuk berkomentar!");
      const now = new Date();
      const comment = {
        id: now.getTime(),
        user: auth.currentUser?.displayName || userEmail,
        userEmail,
        text,
        time: now.toLocaleString("id-ID"),
      };
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { comments: arrayUnion(comment) });
        input.value = "";
        showToast("💬 Komentar terkirim!");
      } catch (err) {
        console.error("❌ Gagal kirim komentar:", err);
      }
    });
  });

  if (!postList.dataset.listenerAdded) {
    postList.dataset.listenerAdded = "true";
    postList.addEventListener("click", async (e) => {
      const target = e.target;
      const postCard = target.closest(".post-card");
      if (!postCard) return;
      const postId = postCard.dataset.id;
      const postRef = doc(db, "posts", postId);
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return showToast("Login dulu untuk mengelola komentar!");

      if (target.classList.contains("edit-comment")) {
        const commentItem = target.closest(".comment-item");
        const commentTextElement = commentItem.querySelector(".comment-text");
        const oldText = commentTextElement.textContent;
        const newText = prompt("Ubah komentar:", oldText);
        if (!newText || newText.trim() === oldText) return;
        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updatedComments = data.comments.map((c) =>
            c.userEmail === userEmail && c.text === oldText ? { ...c, text: newText.trim() } : c
          );
          await updateDoc(postRef, { comments: updatedComments });
          commentTextElement.textContent = newText.trim();
          showToast("✅ Komentar diperbarui!");
        } catch (err) {
          console.error("❌ Gagal edit komentar:", err);
        }
      }
      

      if (target.classList.contains("delete-comment")) {
        if (!confirm("Yakin mau hapus komentar ini?")) return;
        const commentItem = target.closest(".comment-item");
        const textToDelete = commentItem.querySelector(".comment-text").textContent;
        try {
          const snap = await getDoc(postRef);
          const data = snap.data();
          const updatedComments = data.comments.filter((c) => !(c.userEmail === userEmail && c.text === textToDelete));
          await updateDoc(postRef, { comments: updatedComments });
          commentItem.remove();
          showToast("🗑️ Komentar dihapus!");
        } catch (err) {
          console.error("❌ Gagal hapus komentar:", err);
        }
      }
    });
  }
}

async function setupInlineFollowButtons() {
  const followBtns = document.querySelectorAll(".follow-inline-btn");

  followBtns.forEach(async (btn) => {
    const targetId = btn.dataset.userid;
    const targetEmail = btn.dataset.email;
    if (!auth.currentUser || auth.currentUser.uid === targetId) {
      btn.style.display = "none";
      return;
    }
    const followingRef = doc(db, "users", auth.currentUser.uid, "following", targetId);
    const snap = await getDoc(followingRef);
    let isFollowing = snap.exists();

    function updateBtn() {
      if (isFollowing) {
        btn.textContent = "✅ Mengikuti";
        btn.classList.add("following");
      } else {
        btn.textContent = "➕ Ikuti";
        btn.classList.remove("following");
      }
    }

    updateBtn();

    btn.addEventListener("click", async () => {
      try {
        if (isFollowing) {
          await deleteDoc(followingRef);
          isFollowing = false;
          showToast(`❎ Berhenti mengikuti ${targetEmail}`);
        } else {
          await setDoc(followingRef, { followedAt: Date.now() });
          isFollowing = true;
          showToast(`✅ Sekarang kamu mengikuti ${targetEmail}`);
        }
        updateBtn();
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
// 🔥 CEK STATUS LOGIN FIREBASE
// ==============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPage("home");
  } else {
    loadPage("auth");
  }
});

// ==============================
// 🔔 TOAST NOTIF
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

// ==============================
// 👥 SISTEM FOLLOW / UNFOLLOW
// ==============================
// 🔹 Fungsi untuk setup tombol follow
async function setupFollowButton(profileUid) {
  const followBtn = document.getElementById("followBtn");
  const userEmail = document.getElementById("userEmail");
  const followingCount = document.getElementById("followingCount");
  const followerCount = document.getElementById("followerCount");

  // Pastikan login dulu
  if (!auth.currentUser) return;

  const currentUid = auth.currentUser.uid;

  // Kalau profil sendiri → sembunyikan tombol
  if (profileUid === currentUid) {
    followBtn.style.display = "none";
  } else {
    followBtn.style.display = "inline-block";
  }

  // Referensi Firestore
  const followingRef = doc(db, "users", currentUid, "following", profileUid);
  const followerRef = doc(db, "users", profileUid, "followers", currentUid);

  // Cek apakah sudah mengikuti
  const snap = await getDoc(followingRef);
  let isFollowing = snap.exists();

  function updateButton() {
    if (isFollowing) {
      followBtn.textContent = "Berhenti Mengikuti";
      followBtn.classList.add("following");
    } else {
      followBtn.textContent = "Ikuti";
      followBtn.classList.remove("following");
    }
  }

  updateButton();

  // Event klik tombol
  followBtn.addEventListener("click", async () => {
    if (isFollowing) {
      await deleteDoc(followingRef);
      await deleteDoc(followerRef);
      isFollowing = false;
      showToast("❎ Berhenti mengikuti pengguna ini");
    } else {
      await setDoc(followingRef, { followedAt: Date.now() });
      await setDoc(followerRef, { followedAt: Date.now() });
      isFollowing = true;
      showToast("✅ Sekarang kamu mengikuti pengguna ini!");
    }
    updateButton();
    loadFollowStats(profileUid); // refresh jumlah pengikut
  });

  // Hitung pengikut dan yang diikuti
  loadFollowStats(profileUid);
}

// 🔹 Fungsi menghitung pengikut & mengikuti
async function loadFollowStats(profileUid) {
  const followingSnap = await getDocs(collection(db, "users", profileUid, "following"));
  const followerSnap = await getDocs(collection(db, "users", profileUid, "followers"));

  document.getElementById("followingCount").textContent = followingSnap.size;
  document.getElementById("followerCount").textContent = followerSnap.size;
}

// ==============================
// 📄 LOAD HALAMAN PROFIL
// ==============================
async function loadProfilePage(profileUid = null) {
  const userEmail = document.getElementById("userEmail");

  if (!auth.currentUser) {
    console.warn("Belum login");
    loadPage("auth");
    return;
  }

  const currentUser = auth.currentUser;
  const viewUid = profileUid || currentUser.uid;

  // Tampilkan email pengguna
  if (viewUid === currentUser.uid) {
    userEmail.textContent = currentUser.email;
  } else {
    const userDoc = await getDoc(doc(db, "users", viewUid));
    userEmail.textContent = userDoc.exists() ? userDoc.data().email : "(Pengguna tidak ditemukan)";
  }

  // Jalankan fungsi follow/unfollow
  setupFollowButton(viewUid);
}
console.log("✅ app.js versi fix selesai dimuat");
