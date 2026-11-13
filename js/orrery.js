// Orrery layout (Appearance → Layout), shared by Home and the branch pages. The overall level is the sun and
// each branch is a planet on its own orbit: where it sits on the orbit is its progress to the next level, so
// one lap is one level up, and the ring round a planet is today. Styles in css/layout-orrery.css.
// Loads right after nav.js on every page; on a branch page it adds a small orbit header under the title.

const orrRound = n => Math.round(n * 10) / 10;
// Phones draw the sky smaller and the CSS enlarges the text to compensate, so spacing grows with it.
const orrScale = () => (window.matchMedia("(max-width: 600px)").matches ? 1.25 : 1);

// Positions use SVG rotate/translate instead of trigonometry, so the CSS can sweep the planets in from the top.
// item: { R, p (0..1 along the orbit), pr (planet radius), c (colour), start? (degrees where its lap begins),
//         href?, label?, name?, sub?, t? (today 0..1) }
const orrStart = item => `--s: ${item.start ?? 0}deg`;

function orrPlanetSvg(item) {
  const angle = `${orrStart(item)}; --a: ${orrRound((item.start ?? 0) + item.p * 360)}deg`;
  const ring = item.t === undefined ? "" : `<circle class="orr-today-track" r="${item.pr + 7}"/>
    <circle class="orr-today" r="${item.pr + 7}" pathLength="100" stroke-dasharray="${orrRound(item.t * 100)} 100"/>`;
  // Where the label sits is chosen by orrPlaceLabels: below, above, or to the right / left of the planet.
  // The name-to-sub gap grows with the phone text size so the two lines never touch.
  const place = item.place || "below", gap = 16 * orrScale();
  const side = place === "right" || place === "left";
  const dx = place === "right" ? item.pr + 10 : -item.pr - 10;
  const anchor = place === "right" ? "start" : "end";
  const nameY = place === "above" ? -item.pr - 14 - gap : side ? -2 : item.pr + 26;
  const x = side ? ` x="${orrRound(dx)}" text-anchor="${anchor}" style="text-anchor: ${anchor}"` : "";
  const labels = item.name
    ? `<text class="orr-name"${x} y="${orrRound(nameY)}">${item.name}</text>
    <text class="orr-sub"${x} y="${orrRound(nameY + gap)}">${item.sub}</text>` : "";
  const body = `<g class="orr-planet" style="${angle}"><g transform="translate(0 -${item.R})"><g class="orr-upright" style="${angle}">
    ${ring}<circle class="orr-ball" r="${item.pr}"/>${labels}</g></g></g>`;
  const wrap = item.href ? `<a href="${item.href}" aria-label="${item.label}">${body}</a>` : body;
  return `<g style="--c: ${item.c}">${wrap}</g>`;
}

// comet: { angle (degrees, clockwise from 3 o'clock), r, text, label (read aloud), href }. Closer = sooner.
function orrCometSvg(comet) {
  const outward = Math.cos((comet.angle * Math.PI) / 180) > 0;
  return `<a href="${comet.href}" aria-label="${comet.label}"><g transform="rotate(${comet.angle}) translate(${comet.r} 0)">
    <line class="orr-tail" x1="0" y1="0" x2="46" y2="0"/><g transform="rotate(${-comet.angle})">
    <path class="orr-comet" d="M0 -6L6 0L0 6L-6 0Z"/>
    <text class="orr-comet-label" x="${outward ? -10 : 10}" y="-12" text-anchor="${outward ? "end" : "start"}">${comet.text}</text>
  </g></g></a>`;
}

// Labels go under their planet unless that would land on another label or planet; then above, then beside it.
// Boxes are rough text sizes (17px name, 14px sub, times the phone scale), enough to tell when two labels would touch.
function orrPlaceLabels(items, comets = []) {
  const k = orrScale(), gap = 16 * k;
  const at = it => {
    const a = (((it.start ?? 0) + it.p * 360) * Math.PI) / 180;
    return { x: it.R * Math.sin(a), y: -it.R * Math.cos(a) };
  };
  const box = (it, place) => {
    const { x, y } = at(it), w = k * Math.max(it.name.length * 10, it.sub.length * 8);
    const hi = 18 * k, lo = 6; // text height above the name's baseline, and below the sub's
    if (place === "above") return { x0: x - w / 2, x1: x + w / 2, y0: y - it.pr - 14 - gap - hi, y1: y - it.pr - 4 };
    if (place === "right") return { x0: x + it.pr + 8, x1: x + it.pr + 10 + w, y0: y - 2 - hi, y1: y - 2 + gap + lo };
    if (place === "left") return { x0: x - it.pr - 10 - w, x1: x - it.pr - 8, y0: y - 2 - hi, y1: y - 2 + gap + lo };
    return { x0: x - w / 2, x1: x + w / 2, y0: y + it.pr + 26 - hi, y1: y + it.pr + 26 + gap + lo };
  };
  const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const balls = items.map(it => { const { x, y } = at(it); return { x0: x - it.pr - 4, x1: x + it.pr + 4, y0: y - it.pr - 4, y1: y + it.pr + 4 }; });
  // Comet labels are fixed in place, so they count as taken before any planet label is placed.
  const placed = comets.map(c => {
    const a = (c.angle * Math.PI) / 180, outward = Math.cos(a) > 0, w = c.text.length * 10 * k + 6;
    const x = c.r * Math.cos(a) + (outward ? -10 : 10), y = c.r * Math.sin(a) - 12;
    return { x0: outward ? x - w : x, x1: outward ? x : x + w, y0: y - 18 * k, y1: y + 10 };
  });
  return items.map((it, i) => {
    if (!it.name) return it;
    // How much a candidate box overlaps what is already there; the first with none wins, else the least.
    const cost = b => [...placed, ...balls.filter((_, j) => j !== i)].reduce((sum, o) => sum + overlap(b, o), 0);
    const place = ["below", "above", "right", "left"].reduce((best, p) => (cost(box(it, p)) < cost(box(it, best)) ? p : best), "below");
    placed.push(box(it, place));
    return { ...it, place };
  });
}

// The whole sky. sun: { n, t, p? (0..1 round the sun) }. vb = half the view box, sunR = the sun's radius.
function orbitSvg({ items, sun, comets = [], vb, sunR, label, cls = "" }) {
  const orbits = items.map(item => `<circle class="orr-orbit" r="${item.R}"/>
    <circle class="orr-progress" r="${item.R}" pathLength="100" stroke-dasharray="${orrRound(item.p * 100)} 100" style="stroke: ${item.c}; ${orrStart(item)}"/>`).join("");
  const sunRing = sun.p === undefined ? "" :
    `<circle class="orr-sun-xp" r="${sunR + 8}" pathLength="100" stroke-dasharray="${orrRound(sun.p * 100)} 100"/>`;
  return `<svg class="orr-sky ${cls}" viewBox="${-vb} ${-vb} ${vb * 2} ${vb * 2}" role="img" aria-label="${label}">
    <circle class="orr-glow" r="${vb}"/>${orbits}
    <circle class="orr-sun" r="${sunR}"/>${sunRing}
    <text class="orr-sun-n" y="-4">${sun.n}</text><text class="orr-sun-t" y="${orrRound(sunR * 0.55)}">${sun.t}</text>
    ${comets.map(orrCometSvg).join("")}${orrPlaceLabels(items, comets).map(orrPlanetSvg).join("")}
  </svg>`;
}

// Branch page header: the branch planet on its orbit round its level, as on Home, with the numbers beside it.
function orrPageHeaderHtml(branch) {
  const events = loadEvents();
  const { level, into, cost } = levelOf(xpByBranch(events), branch.id);
  const { core, extra } = todayXp(events, branch.id);
  const p = into / cost;
  const sky = orbitSvg({
    items: [{ R: 44, p, pr: 7, c: `var(--${branch.id})` }],
    sun: { n: level, t: "LEVEL" }, vb: 58, sunR: 22, cls: "orr-mini",
    label: `${branch.name} level ${level}, ${Math.round(p * 100)}% of the way round to ${level + 1}`,
  });
  return `<div class="orr-header" style="--c: var(--${branch.id})">${sky}
    <div class="orr-header-text"><strong>Level ${level}</strong>
      <span>${into} / ${cost} XP · ${Math.round(p * 100)}% of a lap</span><span>Today +${core + extra} XP</span></div>
  </div>`;
}

function setupOrreryPage() {
  if (document.documentElement.dataset.layout !== "orrery") return;
  const branch = BRANCHES.find(b => b.page === currentFile()); // nav.js
  if (!branch) return;
  document.body.classList.add("orr-branch");
  document.querySelector("h1")?.insertAdjacentHTML("afterend", orrPageHeaderHtml(branch));
}

setupOrreryPage();
