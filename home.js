/* Fumi-Car · inicio (carrusel, portal, formulario, lightbox) */
const hero = $(".hero");
const slides = $$(".slide");
const dots = $$(".dots button");
const SLIDE_MS = 6500;
let current = 0;
let slideTimer;
hero.style.setProperty("--dur", SLIDE_MS + "ms");

function showSlide(n) {
  current = (n + slides.length) % slides.length;
  slides.forEach((s, i) => s.classList.toggle("active", i === current));
  dots.forEach((d, i) => {
    d.classList.remove("on");
    d.setAttribute("aria-selected", String(i === current));
    if (i === current) {
      void d.offsetWidth; // reinicia la animación de progreso
      d.classList.add("on");
    }
  });
  const img = $("img", slides[current]);
  if (img) img.loading = "eager";
  clearTimeout(slideTimer);
  if (!reduceMotion) slideTimer = setTimeout(() => showSlide(current + 1), SLIDE_MS);
}
dots.forEach((d, i) => d.addEventListener("click", () => showSlide(i)));
hero.addEventListener("pointerenter", () => {
  clearTimeout(slideTimer);
  hero.classList.add("paused");
});
hero.addEventListener("pointerleave", () => {
  hero.classList.remove("paused");
  showSlide(current);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearTimeout(slideTimer);
  else showSlide(current);
});
showSlide(0);

/* portal */
const portalButtons = $$(".chips button");
const portalScreens = $$(".portal-screen");
const progress = $(".portal-progress i");
let portalIndex = 0;
let portalTimer;
function setPortal(index, user = false) {
  portalIndex = (index + portalButtons.length) % portalButtons.length;
  portalButtons.forEach((b, x) => {
    const on = x === portalIndex;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });
  portalScreens.forEach((s, x) => s.classList.toggle("active", x === portalIndex));
  progress.style.transform = `translateX(${portalIndex * 100}%)`;
  if (user) startPortal();
}
function startPortal() {
  clearInterval(portalTimer);
  if (!reduceMotion) portalTimer = setInterval(() => setPortal(portalIndex + 1), 3200);
}
portalButtons.forEach((b, x) => b.addEventListener("click", () => setPortal(x, true)));
new IntersectionObserver(
  (es, ob) => {
    if (es[0].isIntersecting) {
      startPortal();
      ob.disconnect();
    }
  },
  { threshold: 0.25 },
).observe($("#portal"));
setPortal(0);

/* formulario */
const form = $("#form");
const zoneSelect = $("#zone-select");
const zoneOther = $("#zone-other");
const getZone = () =>
  zoneSelect.value === "__otro__" ? zoneOther.value.trim() : zoneSelect.value.trim();
function toggleOtherZone() {
  const other = zoneSelect.value === "__otro__";
  zoneOther.hidden = !other;
  zoneOther.required = other;
  if (!other) {
    zoneOther.value = "";
    zoneOther.classList.remove("invalid");
  } else zoneOther.focus();
}
zoneSelect.addEventListener("change", () => {
  toggleOtherZone();
  validate(zoneSelect);
});
function validate(input) {
  if (input === zoneOther && input.hidden) return true;
  const error = input.parentElement.querySelector(".error");
  const val = input === zoneSelect ? getZone() : input.value.trim();
  let msg = "";
  if (!val) msg = "Este campo es obligatorio.";
  else if (input.name === "n" && val.length < 2) msg = "Escribe al menos 2 caracteres.";
  else if (input.name === "t" && !/^\d{10}$/.test(val.replace(/\D/g, "")))
    msg = "Ingresa un número de 10 dígitos.";
  else if (input.name === "z" && val.length < 3) msg = "Escribe una colonia o municipio válido.";
  else if (input.name === "m" && val.length < 10)
    msg = "Describe el caso con al menos 10 caracteres.";
  input.classList.toggle("invalid", !!msg);
  error.textContent = msg;
  return !msg;
}
$$("input,select,textarea", form).forEach((input) => {
  input.addEventListener("blur", () => validate(input));
  input.addEventListener("input", () => {
    if (input.name === "t") input.value = input.value.replace(/\D/g, "").slice(0, 10);
    if (input.classList.contains("invalid")) validate(input);
  });
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ok = $$("input,select,textarea", form).map(validate).every(Boolean);
  if (!ok) {
    $(".invalid", form)?.focus();
    form.classList.add("form-shake");
    setTimeout(() => form.classList.remove("form-shake"), 400);
    return;
  }
  form.classList.add("success");
  setTimeout(() => form.classList.remove("success"), 900);
  const d = new FormData(form);
  const text = `Hola Fumi-Car, soy ${d.get("n")}.\nMi teléfono: ${d.get("t").replace(/\D/g, "")}\nEspacio: ${d.get("e")}\nZona: ${getZone()}\nMensaje: ${d.get("m")}`;
  open("https://wa.me/525547117493?text=" + encodeURIComponent(text), "_blank", "noopener");
});

/* lightbox */
const lb = $(".lightbox");
let lastFocus;
function closeLightbox() {
  lb.hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus();
}
$$(".gallery-card").forEach((b) =>
  b.addEventListener("click", () => {
    lastFocus = b;
    const img = $("img", lb);
    img.src = b.dataset.src;
    img.alt = $("img", b).alt;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("button", lb).focus();
  }),
);
$("button", lb).addEventListener("click", closeLightbox);
lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox();
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lb.hidden) closeLightbox();
});

/* FAQ: abre una a la vez */
const faqs = $$(".faq-list details");
faqs.forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) faqs.forEach((o) => o !== d && (o.open = false));
  }),
);
