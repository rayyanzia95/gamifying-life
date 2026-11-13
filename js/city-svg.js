// City layout (Appearance → Layout = City), shared by Home and the branch pages. Each branch is one building in a
// small city. Its level sets the tier (1 to 6: taller and fancier) and today's XP lights its windows, so a quiet day
// only looks dim, never worse. This file is the flat SVG city: Home on phones and with reduced motion (the 3D city
// in js/city/ is only for wide screens) and the little building portrait on branch pages. Styles: css/layout-city.css.
// Loads right after nav.js on every page; on a branch page it adds the portrait under the title.

// First level of tiers 2 to 6. Lv 1-2 is tier 1, 3-4 tier 2, 5-6 tier 3, 7-9 tier 4, 10-14 tier 5, 15+ tier 6.
// The centre uses the overall level with the same bands (overall levels climb about 3x slower).
const CITY_TIER_FROM = [3, 5, 7, 10, 15];
const cityTier = level => 1 + CITY_TIER_FROM.filter(from => level >= from).length;

// The land, hand-drawn and fixed (nothing is random, so the town never reshuffles): one character per cell, one row of
// text per row of cells. "~" is the river in its canyon, 1-3 is how many rock levels the cell stands above it (3 = the
// high plateau). The 3D city (js/city/terrain.js) and the flat SVG below both read this, plus the lists after it.
const CITY_TERRAIN = [
  "22333333333333",
  "~~233333333333",
  "~~~22222222333",
  "11~~~222222333",
  "111~~~~~~~~223",
  "11111~~~~~~~22",
  "11111111111~~2",
  "111111111111~~",
  "2211112222111~",
  "22111122221111",
];
const CITY_COLS = CITY_TERRAIN[0].length;
const CITY_ROWS = CITY_TERRAIN.length;
const cityLevelAt = (col, row) => { const ch = CITY_TERRAIN[row]?.[col]; return ch === "~" ? 0 : Number(ch) || 0; };

// Where each place stands: x, y is the centre of its 2 x 2 flat pad in cell units (a pad's level is read from the
// terrain), turn is a small angle in degrees so the street looks lived in. Park and pool are scenery.
const CITY_PLOT = {
  deen: { x: 4, y: 1, turn: 8 }, health: { x: 8, y: 1, turn: -6 }, academics: { x: 12, y: 1, turn: -10 },
  centre: { x: 6, y: 3, turn: 5 }, chores: { x: 10, y: 3, turn: 12 },
  personal: { x: 2, y: 5, turn: -14 }, people: { x: 6, y: 7, turn: 10 }, money: { x: 10, y: 7, turn: -8 },
  park: { x: 4, y: 9, turn: 0 }, pool: { x: 12, y: 9, turn: 6 },
};
const cityPadLevel = p => cityLevelAt(Math.round(p.x) - 1, Math.round(p.y) - 1);

// Two bridges across the river (x: the deck's centre line, y0 to y1: where it runs, level: the bank it springs from)
// and the steps cut into the rock (x, y: the cell; dir: which way they climb; low and high: the levels they join).
const CITY_BRIDGES = [{ x: 7.5, y0: 3.5, y1: 6, level: 2 }, { x: 11.5, y0: 4.5, y1: 7, level: 2 }];
const CITY_STAIRS = [
  { x: 7.5, y: 6.5, dir: "n", low: 1, high: 2 }, { x: 11.5, y: 7.5, dir: "n", low: 1, high: 2 },
  { x: 7.5, y: 2.5, dir: "n", low: 2, high: 3 }, { x: 7.5, y: 7.5, dir: "s", low: 1, high: 2 },
];
const CITY_DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

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

const CITY_LEVEL_H = 10; // SVG: how much taller each rock level is
const CITY_WATER_H = 3; // SVG: the river's surface, below the lowest bank
const CITY_DEPTH = 8; // SVG: how far the land's edge drops below the river, so the island has thickness

// The land: one column of rock per cell. Each is a box from far below up to its level, so the cliffs show on their own.
function cityTerrainParts() {
  const parts = [];
  CITY_TERRAIN.forEach((row, r) => [...row].forEach((_, c) => {
    const level = cityLevelAt(c, r);
    const top = level ? level * CITY_LEVEL_H : CITY_WATER_H;
    parts.push({ key: c + r, svg: cityBoxSvg(c, r, 1, 1, top + CITY_DEPTH, -CITY_DEPTH, `city-ter ${level ? `city-lv${level}` : "city-wat"}`) });
  }));
  return parts;
}

// Steps cut into the rock: four slabs climbing from the low level to the high one in the stair's direction.
function cityStairsSvg(st) {
  const [dx, dy] = CITY_DIRS[st.dir];
  const span = (c, d, i) => (d === 0 ? [c - 0.4, 0.8] : d > 0 ? [c - 0.5 + i / 4, 0.25] : [c + 0.5 - (i + 1) / 4, 0.25]);
  let svg = "";
  for (let i = 0; i < 4; i++) {
    const [gx, w] = span(st.x, dx, i), [gy, d] = span(st.y, dy, i);
    svg += cityBoxSvg(gx, gy, w, d, ((i + 1) / 4) * (st.high - st.low) * CITY_LEVEL_H, st.low * CITY_LEVEL_H, "city-step");
  }
  return svg;
}

// items: [{ id, tier, lit, href?, label, c }] for the buildings; park and pool come from CITY_PLOT. Everything is drawn
// far to near (the key is how far from the back corner), so nearer things cover farther ones.
function cityMapSvg(items, label) {
  const parts = cityTerrainParts();
  CITY_BRIDGES.forEach(b => parts.push({ key: b.x + b.y1 + 0.6, svg: cityBoxSvg(b.x - 0.4, b.y0, 0.8, b.y1 - b.y0, 1.5, b.level * CITY_LEVEL_H - 1.5, "city-deck") }));
  CITY_STAIRS.forEach(st => parts.push({ key: st.x + st.y + 0.2, svg: cityStairsSvg(st) }));
  const places = [...items.map(it => ({ at: CITY_PLOT[it.id], it })), { at: CITY_PLOT.park, scenery: "park" }, { at: CITY_PLOT.pool, scenery: "pool" }];
  places.forEach(({ at, it, scenery }) => {
    const gx = at.x - 0.75, gy = at.y - 0.75;
    const lift = cityPadLevel(at) * CITY_LEVEL_H;
    const inner = scenery ? citySceneryHtml(gx, gy, scenery) : `<g class="city-bld" style="--c: ${it.c}">${cityBuildingSvg(gx, gy, it.tier, it.lit)}</g>`;
    const g = `<g transform="translate(0 ${-lift})">${inner}</g>`;
    parts.push({ key: at.x + at.y + 0.5, svg: it?.href ? `<a href="${it.href}" aria-label="${it.label}">${g}</a>` : g });
  });
  const body = parts.sort((a, b) => a.key - b.key).map(p => p.svg).join("");
  const x0 = cityIso(0, CITY_ROWS)[0] - 10;
  const x1 = cityIso(CITY_COLS, 0)[0] + 10;
  const y1 = cityIso(CITY_COLS, CITY_ROWS)[1] + CITY_DEPTH + 6;
  const top = -3 * CITY_LEVEL_H - cityHeight(3) - CITY_TOWER - 12; // taller towers on the plateau overflow a little
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
