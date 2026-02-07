(function () {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const toggle = nav.querySelector(".nav-toggle");
  const links = nav.querySelector(".nav-links");
  if (!toggle || !links) return;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Luk når man klikker et link (mobil)
  links.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) closeMenu();
  });

  // Luk på ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Luk hvis man klikker udenfor
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target)) closeMenu();
  });
})();
