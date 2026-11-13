// Cockpit HUD layout (Appearance → Layout), Home only: home.js calls hudHomeHtml instead of homeCardHtml.
// A time tape with today's prayers as waypoints, a reticle with the overall level and today per branch,
// level columns, the next exams as locked targets, and a status strip. Styles in css/layout-hud.css.
// Needs prayer-calc.js (prayerTimesFor) and the scoring files loaded before it.

const HUD_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const HUD_TARGETS = 3; // exams shown on the right
const HUD_PHONE_HOURS = 8; // the phone tape shows now ± 4 hours

const hudRound = n => Math.round(n * 10) / 10;
const hudPoint = (r, angle) => [hudRound(r * Math.cos(angle)), hudRound(r * Math.sin(angle))];
const hudPercent = share => Math.round(share * 100);
const hudHours = hhmm => toMinutes(hhmm) / 60; // storage.js
const hudShort = name => name.slice(0, 3).toUpperCase();

function hudArc(r, a0, a1) {
  const [x0, y0] = hudPoint(r, a0);
  const [x1, y1] = hudPoint(r, a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}

// "T−24M" or "T−2H 05M" until a time `hours` from now.
function hudCountdown(hours) {
  const mins = Math.max(Math.round(hours * 60), 0);
  const h = Math.floor(mins / 60);
  return h ? `T−${h}H ${String(mins % 60).padStart(2, "0")}M` : `T−${mins}M`;
}

// Today's five prayers: { name, hour, done }. done = the fard is ticked today.
function hudPrayers(events, today) {
  const times = prayerTimesFor(today);
  return HUD_PRAYERS.map(id => ({
    name: id.toUpperCase(),
    hour: hudHours(times[id]),
    done: events.some(e => e.date === today && e.prayer === id && e.set === "fard"),
  }));
}

// One tape from hour h0 to h1, W units wide. cls picks desktop or phone (only one shows, by container width).
function hudTapeSvg(h0, h1, W, cls, now, prayers) {
  const x = h => hudRound(20 + ((h - h0) / (h1 - h0)) * (W - 40));
  const every = h1 - h0 > 10 ? 3 : 1;
  let ticks = "";
  for (let h = Math.ceil(h0); h <= h1; h++) {
    const labelled = h % every === 0;
    ticks += `<line class="hud-tick" x1="${x(h)}" y1="34" x2="${x(h)}" y2="${labelled ? 44 : 40}"/>`;
    if (labelled) ticks += `<text class="hud-tick-label" x="${x(h)}" y="58">${String(h % 24).padStart(2, "0")}</text>`;
  }
  const marks = prayers.filter(p => p.hour >= h0 && p.hour <= h1).map(p =>
    `<path class="hud-waypoint${p.done ? " done" : ""}" d="M${x(p.hour)} 22l5 6l-5 6l-5-6z"/>` +
    `<text class="hud-waypoint-label" x="${x(p.hour)}" y="15">${p.name}</text>`).join("");
  const nowX = x(Math.min(Math.max(now, h0), h1));
  return `<svg class="${cls}" viewBox="0 0 ${W} 64" aria-hidden="true">
    <rect class="hud-past" x="0" y="20" width="${nowX}" height="24"/>
    <line class="hud-tick" x1="0" y1="34" x2="${W}" y2="34"/>${ticks}${marks}
    <line class="hud-now" x1="${nowX}" y1="18" x2="${nowX}" y2="46"/>
    <rect class="hud-now-box" x="${hudRound(nowX - 26)}" y="46" width="52" height="16"/>
    <text class="hud-now-text" x="${nowX}" y="54">${minutesToHhmm(Math.round(now * 60))}</text>
  </svg>`;
}

function hudTapeHtml(events, today) {
  const date = new Date();
  const now = date.getHours() + date.getMinutes() / 60;
  const prayers = hudPrayers(events, today);
  const next = prayers.find(p => p.hour > now);
  const caption = next ? `NEXT ${next.name} ${hudCountdown(next.hour - now)}` : "ALL PRAYER TIMES PASSED";
  const h0 = Math.max(Math.min(Math.floor(prayers[0].hour) - 1, Math.floor(now)), 0);
  const h1 = Math.min(Math.max(Math.ceil(prayers[4].hour) + 1, Math.ceil(now)), 24);
  const p0 = Math.min(Math.max(Math.floor(now) - HUD_PHONE_HOURS / 2, 0), 24 - HUD_PHONE_HOURS);
  const label = `Time ${minutesToHhmm(Math.round(now * 60))}. ` +
    prayers.map(p => `${p.name.toLowerCase()} ${minutesToHhmm(Math.round(p.hour * 60))}${p.done ? " done" : ""}`).join(", ");
  return `<div class="hud-panel hud-tape" role="img" aria-label="${label}">
    <p class="hud-cap">TIME · ${caption}</p>
    ${hudTapeSvg(h0, h1, 1000, "hud-wide", now, prayers)}${hudTapeSvg(p0, p0 + HUD_PHONE_HOURS, 420, "hud-narrow", now, prayers)}
  </div>`;
}

// The reticle: an arc per branch (fill = today, links to that page), overall level and its XP arc in the middle.
function hudReticleSvg(overall, branches) {
  const step = (2 * Math.PI) / branches.length;
  const gap = 0.06;
  let ticks = "";
  for (let k = 0; k < 72; k++) {
    const a = (k * 2 * Math.PI) / 72;
    const [x0, y0] = hudPoint(k % 6 ? 140 : 134, a);
    const [x1, y1] = hudPoint(146, a);
    ticks += `<line class="hud-ret-tick" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
  }
  const segments = branches.map((b, i) => {
    const a0 = -Math.PI / 2 + i * step + gap;
    const a1 = a0 + step - 2 * gap;
    const fill = a0 + (a1 - a0) * Math.max(b.share, 0.02);
    const [lx, ly] = hudPoint(104, (a0 + a1) / 2);
    return `<a href="${b.page}" aria-label="${b.name}, ${hudPercent(b.share)}% today">
      <path class="hud-ret-track" d="${hudArc(120, a0, a1)}"/>
      <path class="hud-ret-seg" d="${hudArc(120, a0, fill)}" style="stroke: var(--${b.id})"/>
      <text class="hud-ret-label" x="${lx}" y="${ly}">${hudShort(b.name)}</text></a>`;
  }).join("");
  const xp = overall.into / overall.cost;
  return `<svg viewBox="-160 -160 320 320" role="img" aria-label="Overall level ${overall.level}, ${hudPercent(xp)}% to ${overall.level + 1}">
    ${ticks}<circle class="hud-ret-spin" r="152"/>${segments}
    <path class="hud-cross" d="M-88 0H-60M60 0H88M0 -88V-80M0 80V88"/>
    <circle class="hud-ret-track" r="76" style="stroke-width: 3"/>
    <circle class="hud-ret-xp" r="76" pathLength="100" stroke-dasharray="${hudRound(xp * 100)} 100"/>
    <text class="hud-ret-small" y="-30">OVERALL</text>
    <text class="hud-ret-level" y="4">${overall.level}</text>
    <text class="hud-ret-small" y="40">${hudPercent(xp)}% TO ${overall.level + 1}</text>
  </svg>`;
}

// Level climb: one column per branch, as tall as its level (plus progress) next to the highest one.
function hudColumnsHtml(branches) {
  const top = Math.max(...branches.map(b => b.level + 1));
  return branches.map(b => {
    const height = hudPercent((b.level + b.into / b.cost) / top);
    return `<a class="hud-col" href="${b.page}" style="--c: var(--${b.id})" aria-label="${b.name} level ${b.level}">
      <span class="hud-col-track"><i style="height: ${height}%"></i></span><b>${b.level}</b><span>${hudShort(b.name)}</span></a>`;
  }).join("");
}

// HP cells: lit cells = HP the boss has left, out of 10.
function hudHpHtml(state) {
  const lit = Math.round((state.left / state.hp) * 10);
  return `<span class="hud-hp">${Array.from({ length: 10 }, (_, k) => `<i${k < lit ? ' class="on"' : ""}></i>`).join("")}</span>`;
}

// The next exams; the soonest is locked on. Bosses (exams with hp) show their HP cells.
function hudTargetsHtml(events, today) {
  const exams = nextExams(events, today, HUD_TARGETS);
  if (!exams.length) return `<p class="hud-quiet">NO TARGETS</p>`;
  const ticked = tickedDeadlines(events);
  return exams.map((exam, k) => {
    const days = `T−${daysBetween(today, exam.date)}D`;
    return `<a class="hud-target${k === 0 ? " lock" : ""}" href="academics.html">
      <span class="hud-target-row"><b>${courseShort(exam.course).toUpperCase()}</b>${k === 0 ? '<span class="hud-lock">LOCK</span>' : `<span>${days}</span>`}</span>
      <span class="hud-quiet">${exam.title}${k === 0 ? ` · ${days}` : ""}</span>
      ${isBoss(exam) ? hudHpHtml(bossState(events, exam, ticked)) : ""}</a>`;
  }).join("");
}

function hudStatusHtml(events, branches, overallXp) {
  const xpToday = BRANCHES.reduce((sum, b) => {
    const { core, extra } = todayXp(events, b.id);
    return sum + core + extra;
  }, 0);
  const left = CHORES.list.reduce((sum, chore) => sum + choreLeftThisWeek(events, chore, weekStart(todayString())), 0);
  const done = branches.filter(b => b.share >= 1).length;
  return `<div class="hud-panel hud-status">
    <span>XP TODAY <b>+${xpToday}</b></span><span>TOTAL XP <b>${overallXp}</b></span>
    <span>BRANCHES DONE <b>${done}/${branches.length}</b></span><span>QUESTS LEFT <b>${left}</b></span>
  </div>`;
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function hudHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const todayShare = branches.reduce((sum, b) => sum + b.share, 0) / branches.length;
  return `<div class="hud">
    ${hudTapeHtml(events, today)}
    <div class="hud-mid">
      <div class="hud-panel"><p class="hud-cap">LEVEL CLIMB</p><div class="hud-cols">${hudColumnsHtml(branches)}</div></div>
      <div class="hud-panel hud-reticle"><p class="hud-cap">TODAY · ${hudPercent(todayShare)}%</p>${hudReticleSvg(overall, branches)}</div>
      <div class="hud-panel"><p class="hud-cap">TARGETS</p><div class="hud-targets">${hudTargetsHtml(events, today)}</div></div>
    </div>
    ${hudStatusHtml(events, branches, overallXp)}
  </div>`;
}
