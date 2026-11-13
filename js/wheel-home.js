// Command wheel layout, Home only: home.js calls wheelHomeHtml instead of homeCardHtml. The seven branches are
// sectors of one wheel, each filled with today's share; pick one (tap, or arrow keys) and the panel beside it shows
// that branch: level bar, today's parts, a link to its page. The hub shows the picked branch's level.
// Needs command-wheel.js, orrery-home.js (orrNextPrayerHtml, which uses hudPrayers) and home.js's MIXED_PARTS.

const CW_SIZE = { r0: 96, r1: 186, vb: 200, gap: 0.025 };
const cwPercent = share => Math.round(Math.min(share, 1) * 100);
const cwTitleCase = key => key[0].toUpperCase() + key.slice(1);

// What wheelHomeHtml was last drawn with, so picking a sector can redraw it.
let cwHomeState = null;

// The picked branch starts as the one with least done today: the wheel opens on what is left.
const cwLeastDone = branches => branches.reduce((low, b) => (b.share < low.share ? b : low), branches[0]).id;

function cwPartsHtml(events, branch) {
  const partsOf = MIXED_PARTS[branch.id]; // home.js
  if (!partsOf) return "";
  const rows = Object.entries(partsOf(events, todayString())).filter(([, part]) => part.goal > 0).map(([key, part]) => {
    const share = (part.core + part.extra) / part.goal;
    return `<li><span>${cwTitleCase(key)}</span><span class="level-bar"><i style="width: ${cwPercent(share)}%;
      background: var(--${branch.id})"></i></span><span class="num">${cwPercent(share)}%</span></li>`;
  }).join("");
  return `<ul class="cw-parts">${rows}</ul>`;
}

function cwPanelHtml(events, b) {
  const { core, extra } = todayXp(events, b.id);
  return `<div class="cw-panel" style="--c: var(--${b.id})">
    <h2><i></i>${b.name} · Lv ${b.level}</h2>
    <span class="level-bar"><i style="width: ${(b.into / b.cost) * 100}%; background: var(--${b.id})"></i></span>
    <span class="cw-muted num">${b.into} / ${b.cost} XP to level ${b.level + 1}</span>
    <p class="cw-today"><strong class="num">${cwPercent(b.share)}%</strong> today · +${core + extra} XP</p>
    ${cwPartsHtml(events, b)}
    <a class="cw-open" href="${b.page}">Open ${b.name} →</a>
  </div>`;
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function wheelHomeHtml(events, overall, overallXp, branches, pickedId = cwLeastDone(branches)) {
  cwHomeState = { events, overall, overallXp, branches, pickedId };
  const picked = branches.find(b => b.id === pickedId);
  const sectors = branches.map(b => ({
    id: b.id, c: `var(--${b.id})`, t: b.share, selected: b.id === pickedId, name: b.name,
    sub: `Lv ${b.level} · ${cwPercent(b.share)}%`,
    label: `${b.name}, level ${b.level}, ${cwPercent(b.share)}% today`,
  }));
  const wheel = cmdWheelSvg({
    sectors, size: CW_SIZE, label: "Pick a branch",
    hub: { n: picked.level, t: `${picked.name.toUpperCase()}`, p: picked.into / picked.cost },
  });
  return `<div class="cw">
    ${wheel}
    <aside class="cw-side">
      <div aria-live="polite">${cwPanelHtml(events, picked)}</div>
      ${orrNextPrayerHtml(events, todayString())}
      <p class="cw-muted">Overall Lv ${overall.level} · ${overallXp} XP in all</p>
    </aside>
  </div>`;
}

function cwPick(id) {
  const { events, overall, overallXp, branches } = cwHomeState;
  const card = document.getElementById("home-card");
  card.innerHTML = wheelHomeHtml(events, overall, overallXp, branches, id);
  card.querySelector(`[data-cw-id="${id}"]`)?.focus();
}

// Arrow keys go round the wheel (right/down = clockwise), Home/End jump to the first/last branch.
const CW_KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function cwKeydown(event) {
  const sector = event.target.closest?.("[data-cw-id]");
  if (!sector || !cwHomeState) return;
  const ids = cwHomeState.branches.map(b => b.id);
  const at = ids.indexOf(sector.dataset.cwId);
  let next = null;
  if (event.key in CW_KEYS) next = ids[(at + CW_KEYS[event.key] + ids.length) % ids.length];
  else if (event.key === "Home") next = ids[0];
  else if (event.key === "End") next = ids[ids.length - 1];
  else if (event.key === "Enter" || event.key === " ") next = ids[at];
  if (next === null) return;
  event.preventDefault();
  cwPick(next);
}

function cwClick(event) {
  const sector = event.target.closest?.("[data-cw-id]");
  if (sector && cwHomeState) cwPick(sector.dataset.cwId);
}

document.addEventListener("click", cwClick);
document.addEventListener("keydown", cwKeydown);
