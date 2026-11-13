// City layout, Home only: home.js calls cityHomeHtml instead of homeCardHtml, then cityHomeMount. The city has one
// building per branch plus the overall level as the centre (js/city-svg.js has the tiers and the flat SVG map).
// Wide screens without reduced motion get the 3D scene (js/city/scene.js); three.js and the building files are only
// fetched then, and only when City is the layout. Phones, reduced motion, no WebGL or a failed fetch get the SVG.
// Beside the city: the next prayer and each branch's level and today. Styles in css/layout-city.css.
// Needs hud-home.js (hudPrayers), orrery-home.js (orrIn) and the scoring files loaded before it.

// Pinned with SRI like supabase-js. Local files run in this order (scripts added with async = false keep it).
const CITY_THREE = [
  { src: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    integrity: "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu" },
  { src: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
    integrity: "sha384-wagZhIFgY4hD+7awjQjR4e2E294y6J2HSnd8eTNc15ZubTeQeVRZwhQJ+W6hnBsf" },
];
const CITY_DISTRICTS = ["money", "health", "deen", "academics", "chores", "personal", "people", "centre", "park", "pool"];
const CITY_FILES = ["js/city/utils.js", "js/city/props.js", ...CITY_DISTRICTS.map(id => `js/city/buildings/${id}.js`), "js/city/scene.js"];
const CITY_WIDE = "(min-width: 900px)";

let cityLoading = null; // the one fetch of three.js and the city files, shared by every redraw

function cityAddScript({ src, integrity }) {
  return new Promise((done, fail) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (integrity) { script.integrity = integrity; script.crossOrigin = "anonymous"; }
    script.onload = done;
    script.onerror = () => fail(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
}

function cityLoad3d() {
  if (!cityLoading) {
    cityLoading = Promise.all([...CITY_THREE, ...CITY_FILES.map(src => ({ src }))].map(cityAddScript));
    cityLoading.catch(() => { cityLoading = null; }); // try again on the next visit
  }
  return cityLoading;
}

function cityHasWebgl() {
  try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; }
}

// Live 3D only when there is room, motion is welcome and the browser can draw it.
function cityUse3d() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "none";
  return matchMedia(CITY_WIDE).matches && !calm && cityHasWebgl();
}

function cityNextPrayerHtml(events, today) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next = hudPrayers(events, today).find(p => p.hour * 60 > nowMinutes);
  if (!next) return `<div class="city-next"><span>Next prayer</span><strong>Fajr tomorrow</strong></div>`;
  const at = Math.round(next.hour * 60);
  const name = next.name[0] + next.name.slice(1).toLowerCase();
  return `<a class="city-next" href="deen.html"><span>Next prayer</span><strong>${name} · ${clock12(at)}</strong>
    <span class="num">in ${orrIn(at - nowMinutes)}</span></a>`;
}

const cityPercent = share => Math.round(Math.min(share, 1) * 100);

// What each building needs: tier from its level, lit from today's share. The centre is the overall level, lit by
// the average of the branches.
function cityItems(overall, branches) {
  const items = branches.map(b => ({
    id: b.id, name: b.name, href: b.page, level: b.level, tier: cityTier(b.level), lit: Math.min(b.share, 1), c: `var(--${b.id})`,
    label: `${b.name}, level ${b.level}, tier ${cityTier(b.level)} of 6, ${cityPercent(b.share)}% today`,
  }));
  const lit = items.reduce((sum, it) => sum + it.lit, 0) / items.length;
  items.push({
    id: "centre", name: "Overall", href: null, level: overall.level, tier: cityTier(overall.level), lit, c: "var(--accent)",
    label: `Overall level ${overall.level}, tier ${cityTier(overall.level)} of 6`,
  });
  return items;
}

let cityPending = null; // the items for the 3D stage that cityHomeMount fills in

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function cityHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const items = cityItems(overall, branches);
  const live = cityUse3d();
  cityPending = live ? items : null;
  const label = `Your city: a building per branch, taller at higher levels, windows lit by today's progress. Overall level ${overall.level}.`;
  const stage = live
    ? `<div class="city-stage is-3d" id="city-stage" role="group" aria-label="${label}"></div>`
    : `<div class="city-stage">${cityMapSvg(items, label)}</div>`;
  const rows = branches.map(b => `<a class="city-row" href="${b.page}" style="--c: var(--${b.id})">
    <i></i><span>${b.name}</span><span class="num">Lv ${b.level} · ${cityPercent(b.share)}% today</span></a>`).join("");
  return `<div class="city">
    ${stage}
    <aside class="city-side">
      ${cityNextPrayerHtml(events, today)}
      <div class="city-rows">${rows}</div>
      <p class="city-hint">${overallXp} XP in all · overall level ${overall.level}</p>
    </aside>
  </div>`;
}

// After home.js has put the card in the page: bring the 3D scene in, or swap in the SVG if it can't load.
function cityHomeMount() {
  const stage = document.getElementById("city-stage");
  const items = cityPending;
  if (!stage || !items) return;
  cityLoad3d().then(() => {
    if (stage.isConnected) CityScene.mount(stage, items);
    else { const now = document.getElementById("city-stage"); if (now) CityScene.mount(now, cityPending); }
  }).catch(() => {
    stage.classList.remove("is-3d");
    stage.innerHTML = cityMapSvg(items, "Your city");
  });
}

// Crossing the wide-screen line (a resized window, a rotated tablet) swaps 3D and SVG.
matchMedia(CITY_WIDE).addEventListener("change", () => {
  if (document.documentElement.dataset.layout === "city" && typeof render === "function") render();
});
