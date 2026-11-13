// Level-up city build (Appearance → Animations → "City buildings rebuild floor by floor"). When a building's tier has
// gone up since this device last showed it, the old tier fades out and the new one rises floor by floor, then one
// soft ring ripples off its pad. Only that district moves; the rest of the city stays still.
//
// The tiers already shown are kept in localStorage on this device, not synced (same idea as js/level-up.js). The first
// time this runs it only writes down today's tiers, so nothing old plays. Tiers are written whenever a city is shown,
// whether or not the animation played, so turning the toggle on later doesn't replay old tier-ups.
// Flat SVG is drawn here (CSS in css/layout-city.css); the 3D city does its own in js/city/scene.js.
// Needs city-svg.js (cityBuildingSvg, cityIso) and anims.js (animOn) loaded before it.

const TIERS_SEEN_KEY = "gamifying-life-tiers-seen";

function readSeenTiers() {
  try {
    return JSON.parse(localStorage.getItem(TIERS_SEEN_KEY));
  } catch {
    return null;
  }
}

function writeSeenTiers(tiers) {
  try {
    localStorage.setItem(TIERS_SEEN_KEY, JSON.stringify(tiers));
  } catch {
    // Private browsing can block storage: the build may then play again on the next visit.
  }
}

// items: [{ id, tier }] the buildings now on screen. Returns [{ id, from, tier }] for those that grew since last shown
// (empty when the animation is off), and writes the tiers down.
function cityBuildDue(items) {
  const seen = readSeenTiers();
  writeSeenTiers({ ...seen, ...Object.fromEntries(items.map(it => [it.id, it.tier])) });
  if (!seen || !animOn("animBuild")) return [];
  return items.filter(it => seen[it.id] != null && it.tier > seen[it.id]).map(it => ({ id: it.id, from: seen[it.id], tier: it.tier }));
}

// Flat SVG: in `root`, each grown building gets its old tier drawn behind it (fading out), its new tier revealed from
// the bottom in steps, and a ring on the pad. Safe to call again on the same root to replay (the Appearance preview).
function cityBuildPlaySvg(root, grown) {
  if (!root) return;
  grown.forEach(({ id, from }) => {
    const bld = root.querySelector(`.city-bld[data-id="${id}"]:not(.city-old)`);
    if (!bld) return;
    root.querySelectorAll(`[data-for="${id}"]`).forEach(el => el.remove());
    const gx = Number(bld.dataset.gx), gy = Number(bld.dataset.gy), lit = Number(bld.dataset.lit);
    const style = bld.getAttribute("style") || "";
    const rx = (cityIso(gx + 1.5, gy)[0] - cityIso(gx, gy + 1.5)[0]) / 2;
    const ry = (cityIso(gx + 1.5, gy + 1.5)[1] - cityIso(gx, gy)[1]) / 2;
    const [cx, cy] = cityIso(gx + 0.75, gy + 0.75);
    bld.insertAdjacentHTML("beforebegin", `<g class="city-bld city-old" data-for="${id}" style="${style}">${cityBuildingSvg(gx, gy, from, lit)}</g>`);
    bld.insertAdjacentHTML("afterend", `<ellipse class="city-ripple" data-for="${id}" style="${style}" cx="${cx}" cy="${cy - 1.5}" rx="${rx}" ry="${ry}"/>`);
    bld.classList.remove("city-build-new");
    bld.getBoundingClientRect(); // a reflow between remove and add, so the animation restarts
    bld.classList.add("city-build-new");
    root.querySelector(`.city-old[data-for="${id}"]`).addEventListener("animationend", e => e.currentTarget.remove(), { once: true });
  });
}
