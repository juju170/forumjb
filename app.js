// Fungsi navigasi antar halaman
const content = document.getElementById("content");
const buttons = document.querySelectorAll(".nav-btn");

buttons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const page = btn.dataset.page;
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    content.innerHTML = html;
  });
});
