// City layout (Appearance → Layout = City), shared by Home and the branch pages. Each branch is one building in a
// small city. Its level sets the tier (1 to 6: taller and fancier) and today's XP lights its windows, so a quiet day
// only looks dim, never worse. This file is the flat SVG city: Home on phones and with reduced motion (the 3D city
// in js/city/ is only for wide screens) and the little building portrait on branch pages. Styles: css/layout-city.css.
// Loads right after nav.js on every page; on a branch page it adds the portrait under the title.

// First level of tiers 2 to 6. Lv 1-2 is tier 1, 3-4 tier 2, 5-6 tier 3, 7-9 tier 4, 10-14 tier 5, 15+ tier 6.
// The centre uses the overall level with the same bands (overall levels climb about 3x slower).
const CITY_TIER_FROM = [3, 5, 7, 10, 15];
const cityTier = level => 1 + CITY_TIER_FROM.filter(from => level >= from).length;

// Where each district sits on the 4 x 3 plot (column, row). Park and pool are scenery. The 3D city uses this too.
const CITY_PLOT = {
  deen: [0, 0], chores: [1, 0], health: [2, 0], academics: [3, 0],
  park: [0, 1], centre: [1, 1], pool: [2, 1], money: [3, 1],
  personal: [0, 2], people: [1, 2],
};
const CITY_COLS = 4;
const CITY_ROWS = 3;

const CITY_HALF = 14; // SVG: half a tile's width, in view-box units
const CITY_FLOOR = 9; // SVG: storey height
const CITY_TOWER = 12; // SVG: the setback tower on tier 3 and up
const cityRound = n => Math.round(n * 10) / 10;
const cityHeight = tier => 10 + tier * 8;

// Ground point (x, y) in tile units to screen units.
const cityIso = (x, y) => [(x - y) * CITY_HALF, (x + y) * CITY_HALF * 0.5];

// One box: its three visible faces (class l = left, r = right, t = top) from a footprint at (gx, gy), w wide, d deep,
// h tall, standing `up` above the ground.
function cityBoxSvg(gx, gy, w, d, h, up = 0, extra = "") {
  const p = (a, b, z) => { const [x, y] = cityIso(gx + a, gy + b); return `${cityRound(x)},${cityRound(y - z - up)}`; };
  const top = [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)].join(" ");
  const left = [p(0, d, h), p(w, d, h), p(w, d, 0), p(0, d, 0)].join(" ");
  const right = [p(w, 0, h), p(w, d, h), p(w, d, 0), p(w, 0, 0)].join(" ");
  return `<polygon class="city-l ${extra}" points="${left}"/><polygon class="city-r ${extra}" points="${right}"/><polygon class="city-t ${extra}" points="${top}"/>`;
}

// A building of the given tier on a plate, with `lit` (0..1) of its windows lit on the right-hand wall.
function cityBuildingSvg(gx, gy, tier, lit) {
  const h = cityHeight(tier);
  const x = gx + 0.25, y = gy + 0.25;
  const tower = tier >= 3 ? CITY_TOWER : 0;
  const [mx, my] = cityIso(x + 0.5, y + 0.5);
  let svg = cityBoxSvg(gx, gy, 1.5, 1.5, 1.5, 0, "city-plate") + cityBoxSvg(x, y, 1, 1, h);
  if (tower) svg += cityBoxSvg(x + 0.2, y + 0.2, 0.6, 0.6, tower, h);
  if (tier >= 5) svg += `<line class="city-mast" x1="${cityRound(mx)}" y1="${cityRound(my - h - tower)}" x2="${cityRound(mx)}" y2="${cityRound(my - h - tower - 12)}"/>`;
  if (tier === 6) svg += `<circle class="city-cap" cx="${cityRound(mx)}" cy="${cityRound(my - h - tower - 14)}" r="2.6"/>`;
  const rows = Math.max(1, Math.floor((h - 4) / CITY_FLOOR));
  const onRows = Math.round(rows * Math.min(Math.max(lit, 0), 1));
  const [x1, y1] = cityIso(x + 1, y + 0.25);
  const [x2, y2] = cityIso(x + 1, y + 0.75);
  for (let i = 0; i < rows; i++) {
    const a = i * CITY_FLOOR + 5;
    svg += `<polygon class="city-win${i < onRows ? " on" : ""}" points="${cityRound(x1)},${cityRound(y1 - a)} ${cityRound(x2)},${cityRound(y2 - a)} ${cityRound(x2)},${cityRound(y2 - a - 5)} ${cityRound(x1)},${cityRound(y1 - a - 5)}"/>`;
  }
  return svg;
}

// Park and pool: always there. A green plate with trees; a blue plate with water.
function citySceneryHtml(gx, gy, kind) {
  const plate = cityBoxSvg(gx, gy, 1.5, 1.5, 1.5, 0, "city-plate");
  if (kind === "pool") return `<g class="city-pool">${plate}${cityBoxSvg(gx + 0.25, gy + 0.3, 1, 0.9, 0.5, 1.5, "city-water")}</g>`;
  const tree = (a, b) => {
    const [x, y] = cityIso(gx + a, gy + b);
    return `<line class="city-trunk" x1="${cityRound(x)}" y1="${cityRound(y - 7)}" x2="${cityRound(x)}" y2="${cityRound(y - 1)}"/>
      <circle class="city-tree" cx="${cityRound(x)}" cy="${cityRound(y - 12)}" r="6"/>`;
  };
  return `<g class="city-park">${plate}${tree(0.4, 0.4)}${tree(1, 0.5)}${tree(0.6, 1)}</g>`;
}

// items: [{ id, tier, lit, href?, label, c }] for the buildings; park and pool come from CITY_PLOT.
function cityMapSvg(items, label) {
  const parts = items.map(it => ({ at: CITY_PLOT[it.id], it }));
  parts.push({ at: CITY_PLOT.park, scenery: "park" }, { at: CITY_PLOT.pool, scenery: "pool" });
  parts.sort((a, b) => (a.at[0] + a.at[1]) - (b.at[0] + b.at[1]));
  const body = parts.map(({ at, it, scenery }) => {
    const gx = at[0] * 2, gy = at[1] * 2;
    if (scenery) return citySceneryHtml(gx, gy, scenery);
    const g = `<g class="city-bld" style="--c: ${it.c}">${cityBuildingSvg(gx, gy, it.tier, it.lit)}</g>`;
    return it.href ? `<a href="${it.href}" aria-label="${it.label}">${g}</a>` : g;
  }).join("");
  const x0 = cityIso(0, CITY_ROWS * 2)[0] - 10;
  const x1 = cityIso(CITY_COLS * 2, 0)[0] + 10;
  const y1 = cityIso(CITY_COLS * 2, CITY_ROWS * 2)[1] + 6;
  const top = -cityHeight(4) - CITY_TOWER - 16; // room for the tall ones comes from overflow: visible
  return `<svg class="city-map" viewBox="${x0} ${top} ${x1 - x0} ${y1 - top}" role="img" aria-label="${label}">${body}</svg>`;
}

// Branch page header: this branch's building at its tier, with the numbers beside it.
function cityPageHeaderHtml(branch) {
  const events = loadEvents();
  const { level, into, cost } = levelOf(xpByBranch(events), branch.id);
  const { core, extra } = todayXp(events, branch.id);
  const goal = branchGoal(branch.id);
  const lit = goal > 0 ? (core + extra) / goal : (core + extra > 0 ? 1 : 0);
  const tier = cityTier(level);
  const x0 = cityIso(0, 1.5)[0] - 6, x1 = cityIso(1.5, 0)[0] + 6;
  const top = -cityHeight(tier) - (tier >= 3 ? CITY_TOWER : 0) - (tier >= 5 ? 30 : 8), bottom = cityIso(1.5, 1.5)[1] + 6;
  const svg = `<svg class="city-mini" viewBox="${x0} ${top} ${x1 - x0} ${bottom - top}" role="img"
    aria-label="${branch.name} building, tier ${tier} of 6"><g class="city-bld" style="--c: var(--${branch.id})">${cityBuildingSvg(0, 0, tier, lit)}</g></svg>`;
  return `<div class="city-header" style="--c: var(--${branch.id})">${svg}
    <div class="city-header-text"><strong>Level ${level} · tier ${tier} of 6</strong>
      <span>${into} / ${cost} XP to level ${level + 1}</span><span>Today +${core + extra} XP</span></div>
  </div>`;
}

function setupCityPage() {
  if (document.documentElement.dataset.layout !== "city") return;
  const branch = BRANCHES.find(b => b.page === currentFile()); // nav.js
  if (!branch) return;
  document.body.classList.add("city-branch");
  document.querySelector("h1")?.insertAdjacentHTML("afterend", cityPageHeaderHtml(branch));
}

setupCityPage();
