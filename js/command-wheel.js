// Command wheel layout (Appearance → Layout), shared by Home and the branch pages. A radial menu: each branch is
// a sector of one wheel, picked by direction. Not the Chores page's chore wheel (chore-wheel.js), a separate thing.
// Styles in css/layout-wheel.css. Loads right after orrery.js on every page; on a branch page it adds a small wheel
// header under the title whose sectors jump to the other branches.

const cwRound = n => Math.round(n * 10) / 10;

// A point at radius r, `angle` radians clockwise from 12 o'clock.
const cwPoint = (r, angle) => `${cwRound(r * Math.sin(angle))} ${cwRound(-r * Math.cos(angle))}`;

// The ring-shaped slice between radii r0 and r1, from angle a0 to a1 (each slice is under half a turn).
function cwSectorPath(r0, r1, a0, a1) {
  return `M${cwPoint(r0, a0)}L${cwPoint(r1, a0)}A${r1} ${r1} 0 0 1 ${cwPoint(r1, a1)}` +
    `L${cwPoint(r0, a1)}A${r0} ${r0} 0 0 0 ${cwPoint(r0, a0)}Z`;
}

function cwSectorHtml(s, i, step, size) {
  const { r0, r1, gap } = size;
  const a0 = i * step + gap;
  const a1 = (i + 1) * step - gap;
  const at = cwPoint((r0 + r1) / 2, (a0 + a1) / 2);
  const fill = s.t > 0 ? `<path class="cw-fill" d="${cwSectorPath(r0, r0 + (r1 - r0) * Math.min(s.t, 1), a0, a1)}"/>` : "";
  const text = s.name ? `<text class="cw-name" transform="translate(${at})" y="-3">${s.name}</text>
    <text class="cw-sub" transform="translate(${at})" y="15">${s.sub}</text>` : "";
  const inner = `<path class="cw-track" d="${cwSectorPath(r0, s.selected ? r1 + 8 : r1, a0, a1)}"/>${fill}${text}`;
  const cls = `cw-sec${s.selected ? " sel" : ""}${s.t >= 1 ? " full" : ""}`;
  if (s.href) {
    const current = s.selected ? ' aria-current="page"' : "";
    return `<a class="${cls}" style="--c: ${s.c}" href="${s.href}" aria-label="${s.label}"${current}>${inner}</a>`;
  }
  return `<g class="${cls}" style="--c: ${s.c}" role="radio" aria-checked="${!!s.selected}" aria-label="${s.label}"
    tabindex="${s.selected ? 0 : -1}" data-cw-id="${s.id}">${inner}</g>`;
}

// sectors: [{ id, c (colour), t (fill 0..1), label (read aloud), name?, sub?, href?, selected? }]
// hub: { n, t, p (0..1 gold arc) }. size: { r0, r1, vb (half the view box), gap (radians each side) }.
// With href a sector is a link; without, a radio in a radiogroup (Home picks one to show beside the wheel).
function cmdWheelSvg({ sectors, hub, size, label, cls = "" }) {
  const step = (2 * Math.PI) / sectors.length;
  const links = Boolean(sectors[0]?.href);
  const group = links ? `aria-label="${label}"` : `role="radiogroup" aria-label="${label}"`;
  const { r0, vb } = size;
  return `<svg class="cw-wheel ${cls}" viewBox="${-vb} ${-vb} ${vb * 2} ${vb * 2}" ${group}>
    <g class="cw-sectors">${sectors.map((s, i) => cwSectorHtml(s, i, step, size)).join("")}</g>
    <circle class="cw-hub" r="${r0 - 8}"/>
    <circle class="cw-hub-xp" r="${r0 - 16}" pathLength="100" stroke-dasharray="${cwRound(hub.p * 100)} 100"/>
    <text class="cw-hub-n" y="${hub.t ? -6 : 0}">${hub.n}</text><text class="cw-hub-t" y="${cwRound(r0 * 0.3)}">${hub.t}</text>
  </svg>`;
}

// Branch page header: every branch as a sector filled with its progress to the next level, this one raised;
// the others are links, so the wheel doubles as a jump menu.
function cwPageHeaderHtml(branch) {
  const events = loadEvents();
  const totals = xpByBranch(events);
  const sectors = BRANCHES.map(b => {
    const { level, into, cost } = levelOf(totals, b.id);
    return {
      id: b.id, c: `var(--${b.id})`, t: into / cost, href: b.page, selected: b.id === branch.id,
      label: `${b.name}, level ${level}, ${Math.round((into / cost) * 100)}% to ${level + 1}`,
    };
  });
  const { level, into, cost } = levelOf(totals, branch.id);
  const { core, extra } = todayXp(events, branch.id);
  const wheel = cmdWheelSvg({
    sectors, hub: { n: level, t: "", p: into / cost }, size: { r0: 40, r1: 74, vb: 84, gap: 0.04 },
    label: "Branch wheel", cls: "cw-mini",
  });
  return `<nav class="cw-header" style="--c: var(--${branch.id})" aria-label="Branch wheel">${wheel}
    <div class="cw-header-text"><strong>Level ${level}</strong>
      <span>${into} / ${cost} XP to level ${level + 1}</span><span>Today +${core + extra} XP</span>
      <span class="cw-hint">Each sector is a branch's progress; tap one to go there</span></div>
  </nav>`;
}

function setupWheelPage() {
  if (document.documentElement.dataset.layout !== "wheel") return;
  const branch = BRANCHES.find(b => b.page === currentFile()); // nav.js
  if (!branch) return;
  document.body.classList.add("cw-branch");
  document.querySelector("h1")?.insertAdjacentHTML("afterend", cwPageHeaderHtml(branch));
}

setupWheelPage();
