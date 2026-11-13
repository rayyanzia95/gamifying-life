// Sci-fi effects (Appearance → Sci-fi FX). On every page, before level-up.js.
// settings.js puts each choice on <html> as data-fx-boot, data-fx-glitch… Most effects are pure CSS
// (css/appearance.css) keyed off those; this file does the few that need JS: the once-per-page-open
// ones (boot scan, numbers decoding, the typed title), the glitch on a tick and the level-up burst.
// Everything stays off with Motion None or the device's reduce-motion setting (motionOff, level-popup.js).

const FX_BOOT_MS = 900;     // scan line + cards resolving in
const FX_DECODE_MS = 600;   // how long a number scrambles
const FX_TYPE_MS = 70;      // per letter of the page title
const FX_GLITCH_MS = 300;
const FX_BURST_MS = 800;
const FX_BURST_RAYS = 10;

// key: the dataset name, e.g. "fxBoot". "subtle" counts as on.
const fxOn = key => document.documentElement.dataset[key] !== "off" && !motionOff();

// Restarts a CSS animation that hangs off a class, then takes the class away again.
function pulseClass(el, name, ms) {
  el.classList.remove(name);
  void el.offsetWidth; // forces a reflow, so putting the class back restarts the animation
  el.classList.add(name);
  setTimeout(() => el.classList.remove(name), ms);
}

// Scrambles a number through random digits, settling left to right on the real value.
function decodeNumber(el) {
  const target = el.textContent;
  if (!/^\d+$/.test(target)) return;
  const start = performance.now();
  const frame = now => {
    const done = Math.min((now - start) / FX_DECODE_MS, 1);
    el.textContent = done === 1 ? target : [...target]
      .map((digit, i) => (i / target.length < done ? digit : Math.floor(Math.random() * 10)))
      .join("");
    if (done < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

let typingTitle = false;

// Types the page title out letter by letter. The h1 can start with an icon, so only its text node changes.
function typeTitle() {
  const textNode = [...(document.querySelector("h1")?.childNodes ?? [])].findLast(n => n.nodeType === Node.TEXT_NODE);
  if (!textNode || typingTitle) return; // already mid-title: a second run would read the half-typed text
  typingTitle = true;
  const text = textNode.textContent;
  const step = shown => {
    textNode.textContent = text.slice(0, shown);
    if (shown < text.length) return setTimeout(step, FX_TYPE_MS, shown + 1);
    typingTitle = false;
  };
  step(0);
}

// The page-open effects. Runs once when the page has drawn, never on redraws (and from "Replay" on Appearance).
function fxPageOpen() {
  if (fxOn("fxBoot")) pulseClass(document.body, "fx-boot", FX_BOOT_MS);
  if (fxOn("fxDecode")) document.querySelectorAll(".level-chip, .badge-level, .overall-level").forEach(decodeNumber);
  if (fxOn("fxCursor")) typeTitle();
}

// Lines fly out from the middle of el, once. level-up.js calls this when a level is reached.
function lineBurst(el) {
  if (!fxOn("fxBurst")) return;
  const box = el.getBoundingClientRect();
  const burst = Object.assign(document.createElement("div"), { className: "fx-burst" });
  burst.style.left = `${box.left + box.width / 2}px`;
  burst.style.top = `${box.top + box.height / 2}px`;
  burst.style.setProperty("--reach", `${Math.max(box.width, box.height) / 2}px`);
  burst.innerHTML = Array.from({ length: FX_BURST_RAYS },
    (_, i) => `<i style="--angle: ${i * (360 / FX_BURST_RAYS)}deg"></i>`).join("");
  document.body.append(burst);
  setTimeout(() => burst.remove(), FX_BURST_MS);
}

// Glitch: one listener on the page catches every tick (event delegation), so no page needs changing.
// Most pages redraw their list when you tick, which swaps the label for a new one before this runs,
// so when the old label has left the page we look for the ticked one with the same text.
document.addEventListener("change", event => {
  const tick = event.target.closest?.(".tick");
  if (!tick || !event.target.checked || !fxOn("fxGlitch")) return;
  const onPage = tick.isConnected ? tick : [...document.querySelectorAll(".tick")]
    .find(t => t.textContent === tick.textContent && t.querySelector("input")?.checked);
  if (onPage) pulseClass(onPage, "fx-glitch", FX_GLITCH_MS);
});

// The page's own script (the last one) has drawn everything by the time this event fires.
document.addEventListener("DOMContentLoaded", fxPageOpen);
