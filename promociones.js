/* Fumi-Car · Ruleta del Buen Fin 2026
 *
 * CONFIGURACIÓN RÁPIDA
 *  - Fechas: START / MID / END (hora de CDMX, UTC-6).
 *  - Cada premio tiene "from": desde cuándo puede salir. El 50% sale solo
 *    a partir de MID (mitad del Buen Fin). Para activarlo antes/después
 *    basta cambiar MID o el "from" del premio.
 *  - Código: BF26-<porcentaje>-<4 caracteres>-<2 de control>. El control es
 *    FNV-1a(`${p}|${rand}|${SALT}`) en base 36, 2 caracteres (ver chk()).
 */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- configuración ---------- */
  const START = Date.parse("2026-11-13T00:00:00-06:00"); // viernes 13 (inicio oficial)
  // PRUEBAS: la ruleta se abre desde aquí. Para dejarla solo desde el 13,
  // poner OPEN_FROM = START. Los giros hechos antes de START se guardan con
  // otra llave y NO consumen el intento real.
  const OPEN_FROM = Date.parse("2026-11-10T00:00:00-06:00");
  const MID = Date.parse("2026-11-15T12:00:00-06:00"); // mitad del Buen Fin
  const END = Date.parse("2026-11-17T23:59:59-06:00"); // martes 17
  const WA = "525547117493";
  const SPIN_MS = reduce ? 1200 : 10000;
  const TURNS = reduce ? 2 : 9;
  const KEY = Date.now() < START ? "fc_bf26_prueba" : "fc_bf26";
  const SALT = "fumicar-bf26";

  const PRIZES = [
    { p: 10, fill: "#b7ec6b", ink: "#06231b", from: OPEN_FROM },
    { p: 15, fill: "#11634a", ink: "#ffffff", from: OPEN_FROM },
    { p: 20, fill: "#ffc61a", ink: "#06231b", from: OPEN_FROM },
    { p: 25, fill: "#fffdf7", ink: "#06231b", from: OPEN_FROM },
    { p: 30, fill: "#5dbb3f", ink: "#06231b", from: OPEN_FROM },
    { p: 50, fill: "#ff7a4d", ink: "#06231b", from: MID },
  ];
  const SEG = 360 / PRIZES.length;

  /* ---------- elementos ---------- */
  const stage = $("#ruleta");
  const wheel = $("#wheel");
  const pointer = $("#pointer");
  const btn = $("#spinBtn");
  const status = $("#status");
  const action = $("#action");
  const result = $("#result");
  if (!stage || !wheel) return;

  /* ---------- reloj confiable ----------
     Se corrige con la cabecera Date del servidor para que cambiar la hora del
     teléfono no abra la ruleta antes ni active el 50% antes de tiempo. */
  let skew = 0;
  const now = () => Date.now() + skew;
  async function syncClock() {
    try {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 2500);
      const r = await fetch(location.pathname, { method: "HEAD", cache: "no-store", signal: ac.signal });
      clearTimeout(to);
      const s = Date.parse(r.headers.get("date") || "");
      if (!isNaN(s)) skew = s - Date.now();
    } catch (_) {
      /* sin red o file://: se usa la hora local */
    }
  }

  /* ---------- código de participación ---------- */
  const ALPHA = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  function chk(p, rand) {
    let h = 0x811c9dc5;
    for (const ch of `${p}|${rand}|${SALT}`) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36).toUpperCase().slice(-2).padStart(2, "0");
  }
  const makeCode = (p, rand) => `BF26-${p}-${rand}-${chk(p, rand)}`;
  function randomInt(n) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  }
  function newCode(p) {
    let rand = "";
    for (let i = 0; i < 4; i++) rand += ALPHA[randomInt(ALPHA.length)];
    return makeCode(p, rand);
  }
  function valid(r) {
    if (!r || typeof r !== "object" || typeof r.c !== "string") return false;
    if (!PRIZES.some((x) => x.p === r.p)) return false;
    const [, p, rand] = r.c.split("-");
    return Number(p) === r.p && r.c === makeCode(r.p, rand);
  }

  /* ---------- almacenamiento redundante (localStorage + cookie + IndexedDB) ---------- */
  const COOKIE_MAX = Math.max(3600, Math.floor((END + 30 * 864e5 - Date.now()) / 1000));
  const ls = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_) {} },
  };
  const ck = {
    get() {
      try {
        const m = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`));
        return m ? JSON.parse(decodeURIComponent(m[1])) : null;
      } catch (_) { return null; }
    },
    set(v) {
      try {
        document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(v))}; max-age=${COOKIE_MAX}; path=/; SameSite=Lax`;
      } catch (_) {}
    },
  };
  const idb = {
    open() {
      return new Promise((res, rej) => {
        try {
          const r = indexedDB.open("fc_bf", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("k");
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        } catch (e) { rej(e); }
      });
    },
    async get() {
      try {
        const db = await this.open();
        return await new Promise((res) => {
          const q = db.transaction("k").objectStore("k").get(KEY);
          q.onsuccess = () => { db.close(); res(q.result || null); };
          q.onerror = () => { db.close(); res(null); };
        });
      } catch (_) { return null; }
    },
    async set(v) {
      try {
        const db = await this.open();
        await new Promise((res) => {
          const tx = db.transaction("k", "readwrite");
          tx.objectStore("k").put(v, KEY);
          tx.oncomplete = tx.onerror = tx.onabort = () => { db.close(); res(); };
        });
      } catch (_) {}
    },
  };
  async function loadRecord() {
    const found = [ls.get(), ck.get(), await idb.get()].find(valid) || null;
    if (found) saveRecord(found); // repara las copias que falten
    return found;
  }
  async function saveRecord(r) {
    ls.set(r);
    ck.set(r);
    await Promise.race([idb.set(r), new Promise((res) => setTimeout(res, 500))]);
  }

  /* ---------- detección conservadora de navegación privada ----------
     No bloquea nada: solo marca el mensaje de WhatsApp con [INC] para que
     se pueda revisar con más cuidado. Es una heurística, no es infalible. */
  function detectPrivate() {
    const timeout = new Promise((res) => setTimeout(() => res(false), 700));
    const tests = [
      new Promise((res) => {
        try {
          const r = indexedDB.open("fc_probe");
          r.onerror = () => res(true);
          r.onsuccess = () => { r.result.close(); indexedDB.deleteDatabase("fc_probe"); res(false); };
        } catch (_) { res(true); }
      }),
      navigator.storage && navigator.storage.estimate
        ? navigator.storage.estimate().then((e) => !!e.quota && e.quota < 120 * 1024 * 1024, () => false)
        : false,
      (() => { try { localStorage.setItem("fc_p", "1"); localStorage.removeItem("fc_p"); return false; } catch (_) { return true; } })(),
    ];
    return Promise.race([Promise.all(tests).then((a) => a.some(Boolean)), timeout]);
  }
  let privateMode = false;
  detectPrivate().then((v) => { privateMode = v; });

  /* ---------- dibujo de la ruleta (SVG) ---------- */
  function buildWheel() {
    const R = 178;
    const pt = (r, deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [200 + r * Math.cos(a), 200 + r * Math.sin(a)];
    };
    let s = `<svg viewBox="0 0 400 400" focusable="false" aria-hidden="true">`;
    s += `<circle cx="200" cy="200" r="199" fill="#06231b"/>`;
    PRIZES.forEach((pr, i) => {
      const [x0, y0] = pt(R, i * SEG - SEG / 2);
      const [x1, y1] = pt(R, i * SEG + SEG / 2);
      s += `<path d="M200 200L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${pr.fill}" stroke="#fffdf7" stroke-width="3" stroke-linejoin="round"/>`;
      s += `<g transform="rotate(${i * SEG} 200 200)" fill="${pr.ink}" text-anchor="middle" font-family="'Bricolage Grotesque','Segoe UI',system-ui,sans-serif" font-weight="800">`;
      s += `<text x="200" y="${(200 - R * 0.58).toFixed(1)}" font-size="46" letter-spacing="-1.5">${pr.p}%</text>`;
      s += `<text x="200" y="${(200 - R * 0.58 + 23).toFixed(1)}" font-size="13" letter-spacing="3">DESC.</text></g>`;
      const [px, py] = pt(189.5, i * SEG + SEG / 2);
      s += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="5.5" fill="#ffc61a" stroke="#06231b" stroke-width="1.5"/>`;
    });
    // el centro lo cubre el logo (.hub, fuera del SVG para que no gire)
    s += `<circle cx="200" cy="200" r="58" fill="#06231b"/>`;
    s += `</svg>`;
    wheel.innerHTML = s;
  }

  /* ---------- giro ---------- */
  let angle = 0;
  function flick() {
    if (reduce || !pointer.animate) return;
    pointer.getAnimations().forEach((a) => a.cancel());
    pointer.animate(
      [{ transform: "rotate(0)" }, { transform: "rotate(-26deg)", offset: 0.3 }, { transform: "rotate(0)" }],
      { duration: 130, easing: "ease-out" },
    );
  }
  function spinTo(index, done) {
    const off = (Math.random() * 2 - 1) * SEG * 0.36; // cae lejos de la división
    const target = (((-(index * SEG + off)) % 360) + 360) % 360;
    const cur = ((angle % 360) + 360) % 360;
    const delta = ((target - cur + 360) % 360) + 360 * TURNS;
    const a0 = angle;
    const t0 = performance.now();
    let last = Math.floor((a0 + SEG / 2) / SEG);
    const frame = (t) => {
      const k = Math.min((t - t0) / SPIN_MS, 1);
      angle = a0 + delta * (1 - Math.pow(1 - k, 3));
      wheel.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      const tick = Math.floor((angle + SEG / 2) / SEG);
      if (tick !== last) { last = tick; flick(); }
      if (k < 1) requestAnimationFrame(frame);
      else done();
    };
    requestAnimationFrame(frame);
  }

  /* ---------- estado y pantallas ---------- */
  let record = null;
  let spinning = false;
  let timer = null;

  /* ---------- giro lento en reposo (funciona igual en mobile) ----------
     Mientras nadie ha girado, la ruleta avanza despacio sola y el puntero
     "tintinea" al pasar cada gajo. Se detiene al girar, al tener premio o
     cuando la ruleta sale de la pantalla. */
  function initIdle() {
    if (reduce) return;
    let visible = true;
    let lastT = 0;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(wheel);
    }
    const IDLE_DEG_S = 14;
    const loop = (t) => {
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      if (!spinning && !record && visible && !document.hidden && dt > 0) {
        const before = Math.floor((angle + SEG / 2) / SEG);
        angle += IDLE_DEG_S * dt;
        wheel.style.transform = `rotate(${angle.toFixed(2)}deg)`;
        if (Math.floor((angle + SEG / 2) / SEG) !== before) flick();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame((t) => { lastT = t; loop(t); });
  }

  const phase = () => { const t = now(); return t < OPEN_FROM ? "before" : t > END ? "closed" : "open"; };
  function countdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return `${d} d ${String(h).padStart(2, "0")} h ${String(m).padStart(2, "0")} min`;
  }
  function render() {
    const ph = phase();
    stage.dataset.phase = ph;
    if (record) {
      action.hidden = true;
      return;
    }
    action.hidden = false;
    if (spinning) return;
    if (ph === "before") {
      btn.disabled = true;
      btn.textContent = "Abre el 13 de noviembre";
      status.textContent = `La ruleta abre en ${countdown(START - now())}`;
    } else if (ph === "open") {
      btn.disabled = false;
      btn.textContent = "¡Girar la ruleta!";
      status.textContent = "Tienes 1 giro. ¡Mucha suerte!";
    } else {
      btn.disabled = true;
      btn.textContent = "Ruleta cerrada";
      status.textContent = "El Buen Fin terminó. Escríbenos y te contamos las promociones vigentes.";
    }
  }

  function showResult(rec, fresh) {
    $("#resTag").textContent = fresh ? "¡Ganaste!" : "Ya participaste";
    $("#resPct").textContent = `${rec.p}%`;
    $("#resCode").textContent = rec.c;
    const msg =
      `Hola Fumi-Car, giré la ruleta del Buen Fin y gané ${rec.p}% de descuento. ` +
      `Mi código es ${rec.c}${rec.i ? " [INC]" : ""}. Quiero hacer válido mi premio.`;
    $("#resWa").href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    action.hidden = true;
    result.hidden = false;
    if (fresh) {
      result.focus({ preventScroll: true });
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
  }

  function burst() {
    if (reduce) return;
    const box = $("#confetti");
    const colors = ["#ffc61a", "#b7ec6b", "#ff6b3d", "#8fcbff", "#5dbb3f"];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 150 + Math.random() * 120;
      const el = document.createElement("i");
      el.style.setProperty("--x", `${Math.cos(a) * d}px`);
      el.style.setProperty("--y", `${Math.sin(a) * d - 40}px`);
      el.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
      el.style.setProperty("--c", colors[i % colors.length]);
      frag.append(el);
    }
    box.append(frag);
    setTimeout(() => (box.textContent = ""), 1900);
  }

  async function onSpin() {
    if (spinning || record || phase() !== "open") return;
    spinning = true;
    btn.disabled = true;
    btn.textContent = "Girando…";
    status.textContent = "";

    // El resultado se decide y se guarda ANTES de girar: recargar a mitad
    // del giro no da otra oportunidad.
    const t = now();
    const pool = PRIZES.map((p, i) => ({ ...p, i })).filter((p) => t >= p.from);
    const win = pool[randomInt(pool.length)];
    const rec = { v: 1, p: win.p, c: newCode(win.p), t, i: privateMode ? 1 : 0 };
    record = rec;
    await saveRecord(rec);

    spinTo(win.i, () => {
      spinning = false;
      burst();
      if (navigator.vibrate) navigator.vibrate(30);
      showResult(rec, true);
    });
  }

  btn.addEventListener("click", onSpin);
  $("#copyBtn").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try {
      await navigator.clipboard.writeText($("#resCode").textContent);
      b.textContent = "¡Copiado!";
    } catch (_) {
      b.textContent = "Selecciona y copia";
    }
    setTimeout(() => (b.textContent = "Copiar"), 1800);
  });

  /* ---------- movimiento con el scroll (ligero, sin librerías) ---------- */
  function initScroll() {
    if (reduce) return;
    const layers = [...document.querySelectorAll(".bf-bg [data-speed]")];
    const orbit = $(".orbit");
    const wrap = $("#wheelWrap");
    const band = $(".band");
    const track = $("#bandTrack");
    const steps = [...document.querySelectorAll(".step")];
    let half = 0;
    let busy = false;
    const measure = () => { half = track.scrollWidth / 2 + 17.6; };
    measure();
    addEventListener("resize", measure, { passive: true });
    document.fonts && document.fonts.ready.then(measure);

    const update = () => {
      busy = false;
      const y = scrollY;
      const vh = innerHeight;
      if (y < stage.offsetHeight + 200) {
        for (const el of layers) {
          const sp = Number(el.dataset.speed);
          const rot = Number(el.dataset.rot || 0) * y;
          el.style.transform = `translate3d(0,${(y * sp).toFixed(1)}px,0) rotate(${rot.toFixed(1)}deg)`;
        }
        orbit.style.transform = `rotate(${(-y * 0.12).toFixed(1)}deg)`;
        wrap.style.transform = `translate3d(0,${(y * -0.05).toFixed(1)}px,0)`;
      }
      const br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh && half) {
        const x = ((((vh - br.top) * 0.55) % half) + half) % half;
        track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
      }
      for (const el of steps) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const p = Math.min(1, Math.max(0, (vh * 0.97 - r.top) / (vh * 0.42)));
        el.style.opacity = (0.15 + 0.85 * p).toFixed(2);
        el.style.transform = `translate3d(0,${((1 - p) * 54).toFixed(1)}px,0) rotate(${((1 - p) * Number(el.dataset.rot) * 2.2 + Number(el.dataset.rot) * p * 0.35).toFixed(2)}deg)`;
      }
    };
    const onScroll = () => { if (!busy) { busy = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* ---------- arranque ---------- */
  buildWheel();
  render();
  initScroll();
  initIdle();
  loadRecord().then((rec) => {
    if (rec && !record) { record = rec; showResult(rec, false); }
    render();
  });
  syncClock().then(() => { render(); });
  timer = setInterval(() => {
    if (phase() === "before") render();
    else { render(); clearInterval(timer); }
  }, 1000);
})();
