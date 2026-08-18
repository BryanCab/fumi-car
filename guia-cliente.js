const $ = (s, c = document) => c.querySelector(s),
  $$ = (s, c = document) => [...c.querySelectorAll(s)];
const ob = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        ob.unobserve(e.target);
      }
    }),
  { threshold: 0.1 },
);
$$(".reveal").forEach((x) => ob.observe(x));
const agendaSteps = [
  {
    kicker: "ETAPA 01 · PAGO",
    title: "Formas de pago",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",
    alt: "Pago con tarjeta en un dispositivo móvil",
    details: ["Tarjeta de crédito o débito", "Efectivo", "Transferencia"],
  },
  {
    kicker: "ETAPA 02 · AGENDA",
    title: "Para programar",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
    alt: "Personas organizando una reunión de trabajo",
    details: [
      "Ubicación y dirección completa",
      "Responsable y comprobante",
      "Contacto adicional",
      "Fecha, horario y paquete",
    ],
  },
  {
    kicker: "ETAPA 03 · FLEXIBILIDAD",
    title: "Cambios y reagendas",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=85",
    alt: "Calendario y agenda para reorganizar una fecha",
    details: [
      "Sin anticipo inicial",
      "20% para reprogramar",
      "Servicio express sujeto a ruta",
    ],
  },
];
const agendaShowcase = $("[data-agenda-showcase]");
if (agendaShowcase) {
  const agendaImage = $("[data-agenda-image]", agendaShowcase);
  const agendaNumber = $("[data-agenda-number]", agendaShowcase);
  const agendaKicker = $("[data-agenda-kicker]", agendaShowcase);
  const agendaTitle = $("[data-agenda-title]", agendaShowcase);
  const agendaDetails = $("[data-agenda-details]", agendaShowcase);
  const agendaDots = $$(`[data-agenda-dot]`, agendaShowcase);
  let agendaIndex = 0;
  function showAgendaStep(nextIndex) {
    agendaIndex = (nextIndex + agendaSteps.length) % agendaSteps.length;
    const step = agendaSteps[agendaIndex];
    agendaImage.style.opacity = "0";
    setTimeout(() => {
      agendaImage.src = step.image;
      agendaImage.alt = step.alt;
      agendaNumber.textContent = `0${agendaIndex + 1}`;
      agendaKicker.textContent = step.kicker;
      agendaTitle.textContent = step.title;
      agendaDetails.replaceChildren(
        ...step.details.map((detail) => {
          const item = document.createElement("p");
          item.textContent = detail;
          return item;
        }),
      );
      agendaDots.forEach((dot, index) => {
        const activeDot = index === agendaIndex;
        dot.classList.toggle("active", activeDot);
        dot.setAttribute("aria-selected", String(activeDot));
      });
      agendaImage.style.opacity = "1";
    }, 180);
  }
  $("[data-agenda-prev]", agendaShowcase).onclick = () =>
    showAgendaStep(agendaIndex - 1);
  $("[data-agenda-next]", agendaShowcase).onclick = () =>
    showAgendaStep(agendaIndex + 1);
  agendaDots.forEach((dot) => {
    dot.onclick = () => showAgendaStep(Number(dot.dataset.agendaDot));
  });
}
const board = $("#board"),
  start = $("#start"),
  timeE = $("#time"),
  scoreE = $("#score"),
  hitsE = $("#hits"),
  streakE = $("#streak"),
  status = $("#status");
let active = false,
  time = 30,
  score = 0,
  hits = 0,
  streak = 0,
  timer,
  spawner;
function update() {
  timeE.textContent = time;
  scoreE.textContent = Math.max(0, score);
  hitsE.textContent = hits;
  streakE.textContent = streak;
}
function spawn() {
  if (!active) return;
  const r = document.createElement("button");
  r.className = "roach";
  r.type = "button";
  r.setAttribute("aria-label", "Mascota Fumi-Car, tocar para sumar");
  r.style.left = Math.random() * Math.max(1, board.clientWidth - 100) + "px";
  r.style.top = Math.random() * Math.max(1, board.clientHeight - 100) + "px";
  r.style.setProperty("--speed", 0.55 + Math.random() * 0.7 + "s");
  const img = document.createElement("img");
  img.src = "assets/images/logo-fumicar-oficial.webp";
  img.alt = "";
  r.append(img);
  const life = setTimeout(
    () => {
      if (r.isConnected) {
        r.remove();
        streak = 0;
        update();
      }
    },
    Math.max(650, 1500 - hits * 12),
  );
  r.onpointerdown = (e) => {
    e.stopPropagation();
    if (!active || r.classList.contains("hit")) return;
    clearTimeout(life);
    hits++;
    streak++;
    const gain = 10 + (streak % 5 === 0 ? 15 : 0);
    score += gain;
    r.classList.add("hit");
    const p = document.createElement("b");
    p.className = "pop";
    p.textContent = "+" + gain;
    p.style.left = r.style.left;
    p.style.top = r.style.top;
    board.append(p);
    setTimeout(() => {
      r.remove();
      p.remove();
    }, 620);
    update();
  };
  board.append(r);
}
function finish() {
  active = false;
  clearInterval(timer);
  clearInterval(spawner);
  $$(".roach", board).forEach((x) => x.remove());
  board.classList.remove("playing");
  start.disabled = false;
  start.textContent = "Jugar otra vez";
  const rank =
    hits >= 30
      ? "Control total"
      : hits >= 20
        ? "Técnico experto"
        : hits >= 10
          ? "Buen reflejo"
          : "En entrenamiento";
  status.textContent = `${hits} eliminadas · ${Math.max(0, score)} puntos · ${rank}`;
  $(".overlay b").textContent = rank;
  $(".overlay span").textContent =
    `${hits} eliminadas · ${Math.max(0, score)} puntos`;
}
start.onclick = () => {
  active = true;
  time = 30;
  score = hits = streak = 0;
  update();
  board.classList.add("playing");
  start.disabled = true;
  status.textContent = "¡Reto en curso!";
  spawn();
  spawner = setInterval(spawn, 580);
  timer = setInterval(() => {
    time--;
    update();
    if (time <= 0) finish();
  }, 1000);
};
board.onpointerdown = (e) => {
  if (active && e.target === board) {
    score = Math.max(0, score - 2);
    streak = 0;
    update();
  }
};
