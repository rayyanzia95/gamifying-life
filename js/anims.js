// Round-2 animations (Appearance → Animations and sci-fi FX, and three Level-up effect choices).
// On every page, after fx.js and before level-up.js. settings.js puts each choice on <html> as
// data-anim-tick, data-anim-cascade…; css/anims.css draws them. This file adds the short-lived classes
// and the few pieces that need JS. Like fx.js, all of it stays off with Motion None or reduce motion.

const ANIM_OPEN_MS = 1200;    // longest page-open animation (cascade of many cards, scan wipe)
const ANIM_TICK_MS = 900;     // tick draw + bar spring
const ANIM_COUNT_MS = 1100;   // XP count-up
const ANIM_LEVEL_MS = 1600;   // ring burst / lock-on overlay
const ANIM_UNFURL_MS = 3200;  // the cloth banner hangs, then lifts away
const ANIM_DAY_MS = 3000;     // rings close in turn, then the glow
const ANIM_SPARKS = 12;
const ANIM_CASCADE_MAX = 8;   // later cards all come in with the eighth
const DAY_DONE_KEY = "gamifying-life-day-complete"; // the date Day complete last played, on this device

// key: the dataset name, e.g. "animTick".
const animOn = key => document.documentElement.dataset[key] === "on" && !motionOff();

// "120 / 600 XP": the first number rolls up from zero, the rest of the text stays put.
function countUp(el) {
  const match = el.textContent.match(/^(\D*)(\d+)(.*)$/s);
  if (!match) return;
  const [, before, digits, after] = match;
  const target = Number(digits);
  const start = performance.now();
  const frame = now => {
    const done = Math.min((now - start) / ANIM_COUNT_MS, 1);
    const eased = 1 - (1 - done) ** 3;
    el.textContent = before + Math.round(target * eased) + after;
    if (done < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Page open: cards rise in, the scan wipe, numbers counting up, the streak flame.
function animPageOpen() {
  if (animOn("animCascade")) {
    document.querySelectorAll(".card").forEach((card, i) => card.style.setProperty("--cascade", Math.min(i, ANIM_CASCADE_MAX)));
    pulseClass(document.body, "anim-cascade", ANIM_OPEN_MS); // fx.js
  }
  if (animOn("animWipe")) pulseClass(document.body, "anim-wipe", ANIM_OPEN_MS);
  if (animOn("animCount")) {
    document.querySelectorAll(".badge-xp").forEach(countUp);
    pulseClass(document.body, "anim-count", ANIM_COUNT_MS);
  }
  if (animOn("animStreak")) pulseClass(document.body, "anim-streak", ANIM_OPEN_MS);
  dayComplete();
}

// A tick: the box pops with a ripple, and the bars the page redraws spring forward.
// Pages redraw their list on a tick, so like fx.js's glitch we find the new label by its text.
document.addEventListener("change", event => {
  const tick = event.target.closest?.(".tick");
  if (!tick || !event.target.checked || !animOn("animTick")) return;
  const onPage = tick.isConnected ? tick : [...document.querySelectorAll(".tick")]
    .find(t => t.textContent === tick.textContent && t.querySelector("input")?.checked);
  if (onPage) pulseClass(onPage, "anim-ticked", ANIM_TICK_MS);
  pulseClass(document.body, "anim-spring", ANIM_TICK_MS);
});

// Level-up effect → Ring burst or HUD lock-on: an overlay laid over the badge, chip or Home ring.
// level-up.js calls this after it puts .level-up on el.
function levelOverlay(el, style) {
  if (motionOff()) return;
  const box = el.getBoundingClientRect();
  const overlay = Object.assign(document.createElement("div"), { className: `anim-level anim-${style}` });
  Object.assign(overlay.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  overlay.style.setProperty("--reach", `${Math.max(box.width, box.height) / 2}px`);
  overlay.innerHTML = style === "ringburst"
    ? Array.from({ length: ANIM_SPARKS }, (_, i) => `<i style="--angle: ${i * (360 / ANIM_SPARKS)}deg"></i>`).join("")
    : '<b class="tl"></b><b class="tr"></b><b class="bl"></b><b class="br"></b><span class="anim-scan"></span>';
  overlay.setAttribute("aria-hidden", "true");
  document.body.append(overlay);
  setTimeout(() => overlay.remove(), ANIM_LEVEL_MS);
}

// Level-up effect → Banner unfurl: a cloth banner drops from the top with every new level on it.
function showUnfurl(text) {
  const banner = Object.assign(document.createElement("div"), { className: "level-unfurl" });
  banner.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg><b></b><small>a new page is written</small>';
  banner.querySelector("b").textContent = text;
  banner.setAttribute("role", "status");
  document.body.append(banner);
  setTimeout(() => banner.remove(), ANIM_UNFURL_MS);
  return true;
}

// Home only: when every branch's ring is full today, the seven segments close in turn and glow once,
// and a small "Day complete" stays under the ring for the rest of the day. It plays once a day per device.
function dayComplete() {
  const hub = document.querySelector(".home-hub");
  if (!hub || typeof branches === "undefined" || !branches.every(b => b.share >= 1)) return; // branches: home.js
  if (document.documentElement.dataset.animDay !== "on") return;
  hub.classList.add("day-done");
  const note = Object.assign(document.createElement("p"), { className: "day-done-note", textContent: "Day complete" });
  hub.after(note);
  const today = todayString();
  let played = false;
  try {
    played = localStorage.getItem(DAY_DONE_KEY) === today;
    localStorage.setItem(DAY_DONE_KEY, today);
  } catch {
    // Private browsing can block storage: then it may play again on the next open, which is harmless.
  }
  if (!played && !motionOff()) pulseClass(hub, "day-closing", ANIM_DAY_MS);
}

document.addEventListener("DOMContentLoaded", animPageOpen);
