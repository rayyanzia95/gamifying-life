// The moment a level is reached (Appearance → Level-up effect): Glow, Burst or Banner, once per new level.
// On every page, before nav.js. Needs config.js, scoring.js and storage.js.
//
// The levels already celebrated are kept in localStorage on this device, not synced: each device plays
// a new level once. The first time this runs it only writes down today's levels, so nothing old plays.
// A level is written down only when its effect actually played, so a level reached on the Planner
// (which has no level badge) still plays the next time Home or that branch's page opens.

const LEVELS_SEEN_KEY = "gamifying-life-levels-seen";
const LEVEL_UP_MS = 2600; // longest effect (the banner), so its element can be cleaned up after

function readSeenLevels() {
  try {
    return JSON.parse(localStorage.getItem(LEVELS_SEEN_KEY));
  } catch {
    return null;
  }
}

function writeSeenLevels(levels) {
  try {
    localStorage.setItem(LEVELS_SEEN_KEY, JSON.stringify(levels));
  } catch {
    // Private browsing can block storage: the effect may then play again on the next page.
  }
}

// { overall: 12, deen: 9, chores: 4, ... } from the events, the same sums the nav and Home use.
function currentLevels() {
  const totals = xpByBranch(loadEvents());
  const overallXp = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  return {
    overall: levelInfo(overallXp, LEVELS.overallMultiplier).level,
    ...Object.fromEntries(BRANCHES.map(b => [b.id, levelOf(totals, b.id).level])),
  };
}

// The element on this page that shows that level, if any: the badge on its own page, or the chip on Home.
function levelTarget(key) {
  if (key === "overall") return document.querySelector(".home-hub");
  const branch = BRANCHES.find(b => b.id === key);
  if (document.documentElement.dataset.branch === key) return document.querySelector("#levels .badge");
  return document.querySelector(`.level-row[href="${branch.page}"] .level-chip`);
}

const levelName = key => key === "overall" ? "Overall" : BRANCHES.find(b => b.id === key).name;

// Plays the chosen effect. el: the thing to light up (may be null for the banner). Returns true if it played.
function playLevelUp(el, text) {
  const style = document.documentElement.dataset.levelUp;
  if (style === "banner") {
    const banner = Object.assign(document.createElement("div"), { className: "level-banner", textContent: text });
    banner.setAttribute("role", "status"); // read out once by screen readers
    document.body.append(banner);
    setTimeout(() => banner.remove(), LEVEL_UP_MS);
    return true;
  }
  if (!el) return false;
  el.classList.remove("level-up");
  void el.offsetWidth; // forces a reflow so the animation restarts when the class goes back on
  el.classList.add("level-up");
  el.addEventListener("animationend", () => el.classList.remove("level-up"), { once: true });
  return true;
}

function checkLevelUps() {
  const now = currentLevels();
  const seen = readSeenLevels();
  if (!seen) return writeSeenLevels(now);
  const quiet = document.documentElement.dataset.levelUp === "none" || document.documentElement.dataset.motion === "none"
    || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const risen = Object.keys(now).filter(key => now[key] > (seen[key] ?? now[key]));
  const label = key => `${levelName(key)} · level ${now[key]}`;
  const banner = document.documentElement.dataset.levelUp === "banner";
  // One banner names every new level at once; the other effects light up each level where it shows.
  if (banner && !quiet && risen.length) playLevelUp(null, risen.map(label).join("   "));
  const played = risen.filter(key => quiet || banner || playLevelUp(levelTarget(key), label(key)));
  // Keep the highest level each one has shown, so unticking then ticking again doesn't replay it;
  // a level that rose but found nowhere to play keeps its old value and waits for a page that shows it.
  const waiting = key => risen.includes(key) && !played.includes(key);
  const next = Object.fromEntries(Object.keys(now).map(key =>
    [key, waiting(key) ? seen[key] : Math.max(now[key], seen[key] ?? 0)]));
  writeSeenLevels(next);
}

// Once after the page has drawn, then after each tap: a tick redraws the page straight away,
// and the timeout lets that redraw finish before looking for the new badge.
let levelCheckTimer = null;
const queueLevelCheck = () => {
  clearTimeout(levelCheckTimer);
  levelCheckTimer = setTimeout(checkLevelUps, 50);
};
document.addEventListener("DOMContentLoaded", queueLevelCheck);
document.addEventListener("click", queueLevelCheck);
document.addEventListener("change", queueLevelCheck);
