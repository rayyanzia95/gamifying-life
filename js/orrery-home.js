// Orrery layout, Home only: home.js calls orreryHomeHtml instead of homeCardHtml. The sky (js/orrery.js) has the
// overall level as the sun, a planet per branch (bigger = higher level) and the next exams as comets falling in
// (closer = sooner). Beside it: the next prayer and each branch's level and today. Styles in css/layout-orrery.css.
// Needs hud-home.js (hudPrayers) and the scoring files loaded before it.

const ORR_FIRST_ORBIT = 92; // radius of the innermost orbit, in view-box units
const ORR_ORBIT_GAP = 30;
const ORR_COMET_ANGLES = [205, 325]; // where the next two exams fall in from (degrees)
const ORR_COMET_NEAR = 96; // a comet due today sits here; each day out adds ORR_COMET_DAY
const ORR_COMET_DAY = 16;
const ORR_SKY = 310; // half the view box

const orrPlanetRadius = level => Math.min(5 + level * 0.9, 18);
const orrPercent = share => Math.round(share * 100);

// "2 h 05 min" or "24 min".
function orrIn(minutes) {
  const h = Math.floor(minutes / 60);
  return h ? `${h} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
}

function orrNextPrayerHtml(events, today) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next = hudPrayers(events, today).find(p => p.hour * 60 > nowMinutes);
  if (!next) return `<div class="orr-next"><span>Next prayer</span><strong>Fajr tomorrow</strong></div>`;
  const at = Math.round(next.hour * 60);
  const name = next.name[0] + next.name.slice(1).toLowerCase();
  return `<a class="orr-next" href="deen.html"><span>Next prayer</span><strong>${name} · ${clock12(at)}</strong>
    <span class="num">in ${orrIn(at - nowMinutes)}</span></a>`;
}

function orrCometsFor(events, today) {
  return nextExams(events, today, ORR_COMET_ANGLES.length).map((exam, k) => {
    const days = daysBetween(today, exam.date);
    return {
      angle: ORR_COMET_ANGLES[k],
      r: Math.min(ORR_COMET_NEAR + days * ORR_COMET_DAY, ORR_SKY - 20),
      text: `${courseShort(exam.course)} · ${days} d`,
      label: `${courseShort(exam.course)} ${exam.title}, in ${days} days`,
      href: "academics.html",
    };
  });
}

function orrBranchRowsHtml(branches) {
  return branches.map(b => `<a class="orr-row" href="${b.page}" style="--c: var(--${b.id})">
    <i></i><span>${b.name}</span><span class="num">Lv ${b.level} · ${orrPercent(Math.min(b.share, 1))}% today</span></a>`).join("");
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function orreryHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const items = branches.map((b, i) => ({
    R: ORR_FIRST_ORBIT + i * ORR_ORBIT_GAP, p: b.into / b.cost, t: Math.min(b.share, 1),
    start: Math.round((i * 360) / branches.length), // each lap starts a step round, so planets don't stack
    pr: orrPlanetRadius(b.level), c: `var(--${b.id})`, href: b.page, name: b.name,
    sub: `Lv ${b.level} · ${orrPercent(b.into / b.cost)}%`,
    label: `${b.name}, level ${b.level}, ${orrPercent(b.into / b.cost)}% to ${b.level + 1}, ${orrPercent(Math.min(b.share, 1))}% today`,
  }));
  const sky = orbitSvg({
    items, sun: { n: overall.level, t: "LEVEL", p: overall.into / overall.cost }, comets: orrCometsFor(events, today),
    vb: ORR_SKY, sunR: 50,
    label: `Overall level ${overall.level}. Each branch is a planet; its place on the orbit is progress to its next level.`,
  });
  return `<div class="orr">
    ${sky}
    <aside class="orr-side">
      ${orrNextPrayerHtml(events, today)}
      <div class="orr-rows">${orrBranchRowsHtml(branches)}</div>
      <p class="orr-hint">${overallXp} XP in all · one lap of an orbit is one level</p>
    </aside>
  </div>`;
}
