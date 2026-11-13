// Orrery layout (Appearance → Layout), shared by Home and the branch pages. The overall level is the sun and
// each branch is a planet on its own orbit: where it sits on the orbit is its progress to the next level, so
// one lap is one level up, and the ring round a planet is today. Styles in css/layout-orrery.css.
// Loads right after nav.js on every page; on a branch page it adds a small orbit header under the title.

const orrRound = n => Math.round(n * 10) / 10;

// Positions use SVG rotate/translate instead of trigonometry, so the CSS can sweep the planets in from the top.
// item: { R, p (0..1 along the orbit), pr (planet radius), c (colour), start? (degrees where its lap begins),
//         href?, label?, name?, sub?, t? (today 0..1) }
const orrStart = item => `--s: ${item.start ?? 0}deg`;

function orrPlanetSvg(item) {
  const angle = `${orrStart(item)}; --a: ${orrRound((item.start ?? 0) + item.p * 360)}deg`;
  const ring = item.t === undefined ? "" : `<circle class="orr-today-track" r="${item.pr + 7}"/>
    <circle class="orr-today" r="${item.pr + 7}" pathLength="100" stroke-dasharray="${orrRound(item.t * 100)} 100"/>`;
  const above = item.above; // set by orrPlaceLabels when below would collide
  const labels = item.name ? (above
    ? `<text class="orr-name" y="${orrRound(-item.pr - 32)}">${item.name}</text>
    <text class="orr-sub" y="${orrRound(-item.pr - 14)}">${item.sub}</text>`
    : `<text class="orr-name" y="${orrRound(item.pr + 26)}">${item.name}</text>
    <text class="orr-sub" y="${orrRound(item.pr + 42)}">${item.sub}</text>`) : "";
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

// Labels go under their planet unless that would land on another label or planet; then they go above.
// Boxes are rough text sizes (17px name, 14px sub), enough to tell when two labels would touch.
function orrPlaceLabels(items) {
  const at = it => {
    const a = (((it.start ?? 0) + it.p * 360) * Math.PI) / 180;
    return { x: it.R * Math.sin(a), y: -it.R * Math.cos(a) };
  };
  const box = (it, above) => {
    const { x, y } = at(it), w = Math.max(it.name.length * 10, it.sub.length * 8) / 2;
    return above ? { x0: x - w, x1: x + w, y0: y - it.pr - 40, y1: y - it.pr - 4 }
                 : { x0: x - w, x1: x + w, y0: y + it.pr + 8, y1: y + it.pr + 48 };
  };
  const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const balls = items.map(it => { const { x, y } = at(it); return { x0: x - it.pr - 4, x1: x + it.pr + 4, y0: y - it.pr - 4, y1: y + it.pr + 4 }; });
  const placed = [];
  return items.map((it, i) => {
    if (!it.name) return it;
    const clash = b => placed.some(o => hit(b, o)) || balls.some((o, j) => j !== i && hit(b, o));
    const above = clash(box(it, false)) && !clash(box(it, true));
    placed.push(box(it, above));
    return { ...it, above };
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
    ${comets.map(orrCometSvg).join("")}${orrPlaceLabels(items).map(orrPlanetSvg).join("")}
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
