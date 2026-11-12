// Level-up popups (Appearance → Level-up effect: Sci-fi HUD, RPG card, Toast, Ring fills).
// A card in the middle of the screen (the toast: at the top) that closes on a tap, on Esc, or by itself.
// Several new levels at once play one after another. Screen readers hear each once through a live region.
// With Motion None or reduced motion it's the same card, drawn still (the motion-off CSS rules stop it moving).
// On every page, before level-up.js, which decides when a level is new and calls showLevelPopup.

const POPUP_STYLES = ["hud", "rpg", "toast", "ring"];
const POPUP_MS = 3000;
const POPUP_BIG_MS = 4500; // the overall level stays a little longer
const POPUP_FADE_MS = 300; // matches .level-popup.closing in css/appearance.css
const DECODE_MS = 600;
const DECODE_STEP_MS = 40;
const DECODE_CHARS = "#%&*+=<>/0123456789";

const isPopupStyle = style => POPUP_STYLES.includes(style);
const motionOff = () => document.documentElement.dataset.motion === "none"
  || matchMedia("(prefers-reduced-motion: reduce)").matches;

// The text of each Rewards perk tied to exactly this level (rewards-page.js saves them as events).
function perksAt(key, level) {
  return loadEvents().filter(e => e.activity === "perk" && e.branch === key && Number(e.level) === level).map(e => e.text);
}

// The card's shape for each style. Text goes in afterwards with textContent (perks are typed by you).
const POPUP_HTML = {
  hud: `<div class="lp-card lp-hud"><i class="lp-br tl"></i><i class="lp-br tr"></i><i class="lp-br bl"></i><i class="lp-br br"></i>
    <div class="lp-tag">LEVEL UP</div><div class="lp-level" data-part="caps"></div><div class="lp-name"></div><div class="lp-perk"></div>
    <div class="lp-sweep"></div></div>`,
  rpg: `<div class="lp-card lp-rpg"><div class="lp-rays"></div><div class="lp-disc" data-part="number"></div>
    <div class="lp-level" data-part="title"></div><div class="lp-name"></div><div class="lp-perk"></div></div>`,
  toast: `<div class="lp-card lp-toast"><span class="level-chip lp-chip" data-part="number"></span>
    <div><div class="lp-level" data-part="sentence"></div><div class="lp-perk"></div></div><i class="lp-time"></i></div>`,
  ring: `<div class="lp-card lp-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="lp-track" cx="60" cy="60" r="50"/>
    <circle class="lp-arc" cx="60" cy="60" r="50"/><circle class="lp-flash" cx="60" cy="60" r="50"/></svg>
    <div class="lp-roll"><span data-part="before"></span><span data-part="number"></span></div><div class="lp-level" data-part="line"></div>
    <div class="lp-perk"></div></div>`,
};

// The live region every popup speaks through: made once, kept in the page.
function popupLiveRegion() {
  const old = document.getElementById("level-live");
  if (old) return old;
  const live = Object.assign(document.createElement("div"), { id: "level-live", className: "visually-hidden" });
  live.setAttribute("aria-live", "polite");
  document.body.append(live);
  return live;
}

// "LEVEL 8" scrambles through random characters for a moment, then settles (Sci-fi HUD only).
function decodeText(el, text) {
  const start = Date.now();
  const timer = setInterval(() => {
    const done = Math.floor((Date.now() - start) / DECODE_MS * text.length);
    el.textContent = [...text].map((ch, i) => i < done || ch === " " ? ch
      : DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)]).join("");
    if (done >= text.length) clearInterval(timer);
  }, DECODE_STEP_MS);
}

function fillPopup(card, { name, level, perks }) {
  const words = {
    caps: `LEVEL ${level}`, number: String(level), before: String(level - 1), title: `Level ${level}`,
    sentence: `${name} reached level ${level}`, line: `${name} · level ${level}`,
  };
  card.querySelectorAll("[data-part]").forEach(el => { el.textContent = words[el.dataset.part]; });
  card.querySelectorAll(".lp-name").forEach(el => { el.textContent = name; });
  const perk = card.querySelector(".lp-perk");
  if (perks.length) perk.textContent = `Unlocked: ${perks.join(", ")}`;
  else perk.remove();
}

let popupQueue = [];
let popupOpen = null;

function closePopup() {
  if (!popupOpen) return;
  const { el, timer } = popupOpen;
  clearTimeout(timer);
  popupOpen = null;
  el.classList.add("closing");
  // A timer rather than animationend, so it still goes when animations are off or the tab is in the background.
  setTimeout(() => { el.remove(); showNextPopup(); }, motionOff() ? 0 : POPUP_FADE_MS);
}

function showNextPopup() {
  if (popupOpen || !popupQueue.length) return;
  const [next, ...rest] = popupQueue;
  popupQueue = rest;
  const big = next.key === "overall";
  const el = Object.assign(document.createElement("div"), { className: `level-popup${big ? " big" : ""}` });
  el.dataset.style = next.style;
  el.style.setProperty("--lp-colour", big ? "var(--gold)" : `var(--${next.key})`);
  el.setAttribute("aria-hidden", "true"); // the live region says it once, in words
  el.innerHTML = (next.style === "toast" ? "" : '<div class="lp-shade"></div>') + POPUP_HTML[next.style];
  fillPopup(el, next);
  el.addEventListener("click", closePopup);
  document.body.append(el);
  const caps = el.querySelector('[data-part="caps"]');
  if (caps && !motionOff()) decodeText(caps, caps.textContent);
  const perkWords = next.perks.length ? ` Unlocked: ${next.perks.join(", ")}.` : "";
  popupLiveRegion().textContent = `${next.name} reached level ${next.level}.${perkWords}`;
  popupOpen = { el, timer: setTimeout(closePopup, big ? POPUP_BIG_MS : POPUP_MS) };
}

// key: "overall" or a branch id. Queued, so two new levels don't sit on top of each other.
function showLevelPopup(style, key, name, level) {
  popupQueue = [...popupQueue, { style, key, name, level, perks: perksAt(key, level) }];
  showNextPopup();
}

document.addEventListener("keydown", e => { if (e.key === "Escape") closePopup(); });
