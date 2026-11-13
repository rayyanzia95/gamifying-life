// Orrery layout, Home only: home.js calls orreryHomeHtml instead of homeCardHtml. The sky (js/orrery.js) has the
// overall level as the sun, a planet per branch (bigger = higher level) and the next exams as comets falling in
// (closer = sooner). Beside it: the next prayer and each branch's level and today. Styles in css/layout-orrery.css.
// Needs hud-home.js (hudPrayers) and the scoring files loaded before it.

const ORR_FIRST_ORBIT = 92; // radius of the innermost orbit, in view-box units
const ORR_ORBIT_GAP = 30;
const ORR_COMET_ANGLES = [205, 325]; // where the next two exams fall in from (degrees)
const ORR_COMET_NEAR = 96; // a comet due today sits here; each day out adds ORR_COMET_DAY
const ORR_COMET_DAY = 16;
const ORR_SKY = 310; // half the view box

const orrPlanetRadius = level => Math.min(5 + level * 0.9, 18);
const orrPercent = share => Math.round(share * 100);

// "2 h 05 min" or "24 min".
function orrIn(minutes) {
  const h = Math.floor(minutes / 60);
  return h ? `${h} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
}

function orrNextPrayerHtml(events, today) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next = hudPrayers(events, today).find(p => p.hour * 60 > nowMinutes);
  if (!next) return `<div class="orr-next"><span>Next prayer</span><strong>Fajr tomorrow</strong></div>`;
  const at = Math.round(next.hour * 60);
  const name = next.name[0] + next.name.slice(1).toLowerCase();
  return `<a class="orr-next" href="deen.html"><span>Next prayer</span><strong>${name} · ${clock12(at)}</strong>
    <span class="num">in ${orrIn(at - nowMinutes)}</span></a>`;
}

function orrCometsFor(events, today) {
  return nextExams(events, today, ORR_COMET_ANGLES.length).map((exam, k) => {
    const days = daysBetween(today, exam.date);
    return {
      angle: ORR_COMET_ANGLES[k],
      r: Math.min(ORR_COMET_NEAR + days * ORR_COMET_DAY, ORR_SKY - 20),
      text: `${courseShort(exam.course)} · ${days} d`,
      label: `${courseShort(exam.course)} ${exam.title}, in ${days} days`,
      href: "academics.html",
    };
  });
}

function orrBranchRowsHtml(branches) {
  return branches.map(b => `<a class="orr-row" href="${b.page}" style="--c: var(--${b.id})">
    <i></i><span>${b.name}</span><span class="num">Lv ${b.level} · ${orrPercent(Math.min(b.share, 1))}% today</span></a>`).join("");
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function orreryHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const items = branches.map((b, i) => ({
    R: ORR_FIRST_ORBIT + i * ORR_ORBIT_GAP, p: b.into / b.cost, t: Math.min(b.share, 1),
    start: Math.round((i * 360) / branches.length), // each lap starts a step round, so planets don't stack
    pr: orrPlanetRadius(b.level), c: `var(--${b.id})`, href: b.page, name: b.name,
    sub: `Lv ${b.level} · ${orrPercent(b.into / b.cost)}%`,
    label: `${b.name}, level ${b.level}, ${orrPercent(b.into / b.cost)}% to ${b.level + 1}, ${orrPercent(Math.min(b.share, 1))}% today`,
  }));
  const sky = orbitSvg({
    items, sun: { n: overall.level, t: "LEVEL", p: overall.into / overall.cost }, comets: orrCometsFor(events, today),
    vb: ORR_SKY, sunR: 50,
    label: `Overall level ${overall.level}. Each branch is a planet; its place on the orbit is progress to its next level.`,
  });
  const stage = orreryTilt()
    ? `<div class="orr-stage" tabindex="0" role="group" aria-label="Orrery. Drag, or use the arrow keys, to turn and tilt it; Home flattens it.">${sky}<div class="orr-tags" aria-hidden="true"></div></div>`
    : sky;
  return `<div class="orr">
    ${stage}
    <aside class="orr-side">
      ${orrNextPrayerHtml(events, today)}
      <div class="orr-rows">${orrBranchRowsHtml(branches)}</div>
      <p class="orr-hint">${overallXp} XP in all · one lap of an orbit is one level</p>
    </aside>
  </div>`;
}

// ---- 3D tilt (Appearance → Orrery view). The sky is the same SVG, tilted by CSS 3D; drag, arrow keys, Home and a
// double-click turn it. SVG text can't stay upright inside a CSS 3D tilt, so each label is hidden in the SVG and an HTML
// copy is laid over it at its tilted place (read back with getBoundingClientRect). Not saved: it starts tilted on each load.

const ORR_TILT_START = 55; // degrees: 0 is the flat top-down view
const ORR_TILT_MAX = 70;
const ORR_DRAG_START = 6; // px of movement before a press is a drag, so a tap on a planet still opens its page
const ORR_TAG_TEXT = ".orr-name, .orr-sub, .orr-comet-label, .orr-sun-n, .orr-sun-t";
const orrView = { tilt: ORR_TILT_START, yaw: 0 }; // kept while Home redraws

const orreryTilt = () => document.documentElement.dataset.orreryView === "tilt"
  && !matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.motion !== "none";

function orreryHomeMount() {
  const stage = document.querySelector(".orr-stage");
  if (!stage) return;
  const sky = stage.querySelector(".orr-sky");
  const tags = stage.querySelector(".orr-tags");
  const texts = [...sky.querySelectorAll(ORR_TAG_TEXT)];
  tags.replaceChildren(...texts.map(text => {
    const href = text.closest("a")?.getAttribute("href");
    const tag = Object.assign(document.createElement(href ? "a" : "span"), { className: "orr-tag", textContent: text.textContent });
    if (href) tag.href = href;
    tag.style.color = getComputedStyle(text).fill;
    return tag;
  }));

  // Put every label where its SVG text now is on screen. A planet's or comet's labels keep their flat distance from it
  // in screen pixels (not squashed by the tilt, which would pile name on top of sub-label); the sun's are read back.
  const placeTags = () => {
    const box = stage.getBoundingClientRect();
    const scale = sky.clientWidth / (2 * ORR_SKY); // one SVG unit in px, before the tilt
    texts.forEach((text, i) => {
      const style = getComputedStyle(text);
      const size = parseFloat(style.fontSize);
      const tag = tags.children[i];
      tag.style.fontSize = `${Math.max(size * scale, 12)}px`;
      tag.style.fontWeight = style.fontWeight;
      const anchor = text.parentElement.querySelector(":scope > .orr-ball, :scope > .orr-comet");
      const a = (anchor || text).getBoundingClientRect();
      let x = a.left + a.width / 2 - box.left, y = a.top + a.height / 2 - box.top, shift = "-50%";
      if (anchor) {
        x += Number(text.getAttribute("x") || 0) * scale;
        y += (Number(text.getAttribute("y")) - size * 0.35) * scale; // y is the baseline; aim for the middle of the letters
        const side = text.getAttribute("text-anchor"); // comet labels hang off one side of the comet
        shift = side === "end" ? "-100%" : side === "start" ? "0%" : "-50%";
      }
      tag.style.transform = `translate(${x}px, ${y}px) translate(${shift}, -50%)`;
    });
  };
  const apply = () => {
    sky.style.setProperty("--tilt", `${orrView.tilt}deg`);
    sky.style.setProperty("--yaw", `${orrView.yaw}deg`);
    placeTags();
  };
  const turn = (dYaw, dTilt) => {
    orrView.yaw += dYaw;
    orrView.tilt = Math.min(Math.max(orrView.tilt + dTilt, 0), ORR_TILT_MAX);
    apply();
  };
  const reset = () => { orrView.tilt = 0; orrView.yaw = 0; apply(); };

  let press = null; // { x, y, moved } while a finger or button is down
  stage.addEventListener("pointerdown", e => { if (e.button === 0) press = { x: e.clientX, y: e.clientY, moved: false }; });
  stage.addEventListener("pointermove", e => {
    if (!press) return;
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.moved && Math.hypot(dx, dy) < ORR_DRAG_START) return;
    if (!press.moved) { press.moved = true; stage.setPointerCapture(e.pointerId); stage.classList.add("is-dragging"); }
    press.x = e.clientX; press.y = e.clientY;
    turn(dx * 0.5, -dy * 0.4);
  });
  const release = () => {
    if (press?.moved) { // the click that ends a drag must not open a planet's page
      const stop = e => e.preventDefault();
      stage.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => stage.removeEventListener("click", stop, { capture: true }), 0);
    }
    press = null;
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("dblclick", reset);
  stage.addEventListener("keydown", e => {
    const move = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
    if (move) turn(...move);
    else if (e.key === "Home") reset();
    else return;
    e.preventDefault();
  });

  // The planets sweep into place for the first 1.6 s, so keep the labels following them, then on every resize.
  apply();
  const end = performance.now() + 1800;
  const follow = () => { placeTags(); if (performance.now() < end && stage.isConnected) requestAnimationFrame(follow); };
  requestAnimationFrame(follow);
  new ResizeObserver(placeTags).observe(stage);
}
