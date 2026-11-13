// Appearance → Home centrepiece: Star map, Hex grid, Segmented gauge and Stat block. Ring + web is in
// home-levels.js. home-levels.js's homeCardHtml looks the chosen one up in CENTREPIECES; only the Classic
// layout shows them (the other layouts draw their own Home). Each is a function (overall, branches) that
// returns the whole card, like homeCardHtml: the picture, a small key, and the row per branch.
// Reuses HOME, homePoint, arcHtml, todaySegmentsHtml, overallCentreHtml, sweepHtml, branchRowHtml, percent, hubLabel.

const CENTRE_PIECE = {
  starInner: 30,           // a level-0 star sits just outside the centre disc
  starRadius: 64,          // the rim (the highest level so far)
  starLabelRadius: 80,
  starRingWidth: 2.6, starRingGap: 6,
  starCount: 34,
  gaugeTicks: 8,           // ticks per branch segment
  gaugeInner: [70, 86],    // today ticks: from radius, to radius
  gaugeOuter: [92, 99],    // XP-to-next-level ticks
  gaugeOuterCount: 56,
  gaugeLabelRadius: 53,
  hexSize: 34,
};

const KEY_TODAY = `<span class="key-today">today</span>`;
const KEY_LEVEL = `<span class="key-level">level</span>`;

const pointAt = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
const round1 = n => Math.round(n * 10) / 10;
const levelTop = branches => Math.max(HOME.minTop, ...branches.map(b => b.level));

// The whole card: the hub (already markup), a one-line key, then a row per branch.
const centreCard = (hub, key, branches) =>
  `${hub}<div class="hub-key">${key}</div><div class="level-rows">${branches.map(branchRowHtml).join("")}</div>`;

// ---- Star map: a thin today ring, a sky of faint stars, one star per branch (bigger = higher level). ----

// Faint background stars at fixed spots (golden-angle spiral), so the sky never changes between visits.
function skyHtml() {
  const GOLDEN = 2.399;
  return Array.from({ length: CENTRE_PIECE.starCount }, (_, k) => {
    const [x, y] = pointAt(HOME.centre, HOME.centre, 28 + ((k * 37) % 62), k * GOLDEN);
    return `<circle class="sky-star" cx="${round1(x)}" cy="${round1(y)}" r="${k % 5 ? 0.7 : 1.1}" opacity="${0.25 + (k % 4) * 0.1}"/>`;
  }).join("");
}

// A four-point star at (x, y), size s.
function starPath(x, y, s) {
  const pts = [[0, -1.7], [0.4, -0.4], [1.7, 0], [0.4, 0.4], [0, 1.7], [-0.4, 0.4], [-1.7, 0], [-0.4, -0.4]];
  return "M" + pts.map(([dx, dy]) => `${round1(x + dx * s)} ${round1(y + dy * s)}`).join("L") + "Z";
}

function starMapHtml(overall, branches) {
  const n = branches.length, top = levelTop(branches);
  const { starInner, starRadius } = CENTRE_PIECE;
  const at = (i, fraction) => homePoint(i, n, starInner + fraction * (starRadius - starInner));
  const grid = HOME.gridSteps.map(f =>
    `<polygon class="star-grid" points="${branches.map((_, i) => at(i, f).join(",")).join(" ")}"/>`).join("");
  const line = `<polygon class="star-line" points="${branches.map((b, i) => at(i, b.level / top).join(",")).join(" ")}"/>`;
  const stars = branches.map((b, i) => {
    const [x, y] = at(i, b.level / top);
    return `<path d="${starPath(x, y, 2 + b.level / 5)}" style="fill: var(--${b.id})"/>`;
  }).join("");
  const labels = branches.map((b, i) => {
    const [x, y] = homePoint(i, n, CENTRE_PIECE.starLabelRadius);
    return `<text class="web-label" x="${x}" y="${y + 3}" text-anchor="middle">${b.name}</text>`;
  }).join("");
  const hub = `<svg class="home-hub" viewBox="0 0 220 220" role="img" aria-label="${hubLabel(overall, branches)}">
    ${todaySegmentsHtml(branches, 100, CENTRE_PIECE.starRingWidth, CENTRE_PIECE.starRingGap)}${skyHtml()}${grid}${line}${stars}${labels}${sweepHtml()}${overallCentreHtml(overall)}</svg>`;
  return centreCard(hub, `${KEY_TODAY}${KEY_LEVEL}`, branches);
}

// ---- Hex grid: a honeycomb of 8 cells, one per branch plus overall; each fills from the bottom. ----
// Branch cells fill with today's share, the overall cell with its XP to the next level.

// Cell centres in hex units: [column, row] with the middle row shifted half a cell. The 8th slot is overall.
const HEX_CELLS = [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1], [0, 2], [1, 2], [2, 2]];

function hexPoints(cx, cy, s) {
  return Array.from({ length: 6 }, (_, k) => {
    const [x, y] = pointAt(cx, cy, s, Math.PI / 6 + (k * Math.PI) / 3);
    return `${round1(x)},${round1(y)}`;
  }).join(" ");
}

// One cell. `fill` 0..1 rises from the bottom; `colour` is a CSS colour; `href` makes it a link.
function hexCellHtml(i, [col, row], { number, label, fill, colour, href, aria }) {
  const s = CENTRE_PIECE.hexSize, w = Math.sqrt(3) * s;
  const cx = w / 2 + col * w + 4, cy = s + row * 1.5 * s + 4;
  const top = cy + s - 2 * s * Math.min(Math.max(fill, 0), 1);
  const cell = `<clipPath id="hex-fill-${i}"><rect x="${round1(cx - s)}" y="${round1(top)}" width="${2 * s}" height="${2 * s}"/></clipPath>
    <polygon class="hex-cell" points="${hexPoints(cx, cy, s)}" style="stroke: ${colour}"/>
    <polygon class="hex-fill" points="${hexPoints(cx, cy, s)}" style="fill: ${colour}" clip-path="url(#hex-fill-${i})"/>
    <text class="hex-num" x="${round1(cx)}" y="${round1(cy - 2)}">${number}</text>
    <text class="hex-name" x="${round1(cx)}" y="${round1(cy + 13)}">${label}</text>`;
  return href ? `<a href="${href}" aria-label="${aria}">${cell}</a>` : `<g role="img" aria-label="${aria}">${cell}</g>`;
}

function hexGridHtml(overall, branches) {
  const s = CENTRE_PIECE.hexSize, w = Math.sqrt(3) * s;
  const cells = branches.map((b, i) => {
    // The first three branches fill the top row, the overall cell is the 4th slot, the rest follow.
    const slot = HEX_CELLS[i < 3 ? i : i + 1];
    return hexCellHtml(i, slot, { number: b.level, label: b.name, fill: b.share, colour: `var(--${b.id})`, href: b.page,
      aria: `${b.name} level ${b.level}, ${percent(b.share)}% today` });
  });
  cells.push(hexCellHtml(branches.length, HEX_CELLS[3], { number: overall.level, label: "OVERALL", fill: overall.into / overall.cost,
    colour: "var(--gold)", aria: `Overall level ${overall.level}, ${percent(overall.into / overall.cost)}% to the next level` }));
  const hub = `<svg class="home-hub hex-hub" viewBox="0 0 ${round1(3 * w + 8)} ${round1(5 * s + 8)}" role="group" aria-label="Levels, filled to today's progress">${cells.join("")}</svg>`;
  return centreCard(hub, `${KEY_TODAY}`, branches);
}

// ---- Segmented gauge: ticks. Inner ticks per branch = today, outer ring = XP to the next overall level. ----

// `count` ticks round a circle slice starting at `start` (radians), `lit` of them in `colour`, the rest faint.
function ticksHtml(start, sweep, count, [from, to], lit, colour, cls) {
  return Array.from({ length: count }, (_, k) => {
    const angle = start + ((k + 0.5) * sweep) / count;
    const [x0, y0] = pointAt(HOME.centre, HOME.centre, from, angle);
    const [x1, y1] = pointAt(HOME.centre, HOME.centre, to, angle);
    const on = (k + 0.5) / count <= lit;
    return `<line class="${cls}${on ? " on" : ""}" x1="${round1(x0)}" y1="${round1(y0)}" x2="${round1(x1)}" y2="${round1(y1)}"${on ? ` style="stroke: ${colour}"` : ""}/>`;
  }).join("");
}

function gaugeHtml(overall, branches) {
  const n = branches.length, span = (2 * Math.PI) / n;
  const inner = branches.map((b, i) =>
    ticksHtml(-Math.PI / 2 + i * span - span / 2 + 0.05, span - 0.1, CENTRE_PIECE.gaugeTicks, CENTRE_PIECE.gaugeInner, b.share, `var(--${b.id})`, "gauge-tick")).join("");
  const outer = ticksHtml(-Math.PI / 2, 2 * Math.PI, CENTRE_PIECE.gaugeOuterCount, CENTRE_PIECE.gaugeOuter, overall.into / overall.cost, "var(--gold)", "gauge-tick gauge-xp");
  const levels = branches.map((b, i) => {
    const [x, y] = homePoint(i, n, CENTRE_PIECE.gaugeLabelRadius);
    return `<text class="gauge-level" x="${x}" y="${y + 4}" text-anchor="middle" style="fill: var(--${b.id})">${b.level}</text>`;
  }).join("");
  const hub = `<svg class="home-hub" viewBox="0 0 220 220" role="img" aria-label="${hubLabel(overall, branches)}">
    ${outer}${inner}${levels}
    <text class="overall-level gauge-overall" x="${HOME.centre}" y="${HOME.centre + 6}" text-anchor="middle">${overall.level}</text>
    <text class="gauge-caption" x="${HOME.centre}" y="${HOME.centre + 20}" text-anchor="middle">OVERALL</text></svg>`;
  return centreCard(hub, `${KEY_TODAY}<span class="key-level">outer ring: next level</span>`, branches);
}

// ---- Stat block: no picture. Overall level and its XP bar on top, then a row per branch. ----

function statBlockHtml(overall, branches) {
  const hub = `<div class="home-hub stat-top" role="group" aria-label="${hubLabel(overall, branches)}">
    <span class="stat-level">Lv ${overall.level}</span><span class="stat-caption">overall</span>
    <span class="level-bar"><i style="width: ${(overall.into / overall.cost) * 100}%; background: var(--gold)"></i></span></div>`;
  return centreCard(hub, `${KEY_TODAY}${KEY_LEVEL}`, branches);
}

// Keyed by the `centre` setting (settings.js). Ring + web is not here: homeCardHtml draws it.
const CENTREPIECES = { starmap: starMapHtml, hex: hexGridHtml, gauge: gaugeHtml, sheet: statBlockHtml };
