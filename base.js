/* Fumi-Car · comportamiento compartido (header, menú, reveal, contadores) */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = $(".site-header");
const onScroll = () => header.classList.toggle("stick", scrollY > 30);
if (!header.classList.contains("solid")) {
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

const nav = $(".nav");
const menuBtn = $(".menu-btn");
const backdrop = $(".nav-backdrop");
function setMenu(open) {
  nav.classList.toggle("open", open);
  backdrop.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  if (open) requestAnimationFrame(() => $(".nav-close").focus());
  else if (matchMedia("(max-width:1020px)").matches) menuBtn.focus();
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$(".nav-close").addEventListener("click", () => setMenu(false));
backdrop.addEventListener("click", () => setMenu(false));
$$(".nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) setMenu(false);
});
addEventListener(
  "resize",
  () => {
    if (innerWidth > 1020 && nav.classList.contains("open")) setMenu(false);
  },
  { passive: true },
);

/* reveal al hacer scroll */
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        revealObserver.unobserve(e.target);
      }
    }),
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
);
$$(".reveal").forEach((el) => revealObserver.observe(el));

/* contadores */
const countObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countObserver.unobserve(e.target);
      const end = Number(e.target.dataset.count);
      if (reduceMotion || !end) {
        e.target.textContent = end;
        return;
      }
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1200, 1);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }),
  { threshold: 0.6 },
);
$$("[data-count]").forEach((el) => countObserver.observe(el));

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();
