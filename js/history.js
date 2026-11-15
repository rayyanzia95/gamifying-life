// Looking back: XP per day, and the 12-week history card on every branch page.
// xpByDay() is also what the weekly review (review-page.js) reads. The card adds itself to a branch page
// (the branch is data-branch on <html>, set by nav.js) and redraws whenever events are saved.
// Loads after nav.js on the seven branch pages and on review.html. Styles: css/base.css (.history-*).

const HISTORY = { weeks: 12, shades: 4 };

// { "2026-11-14": { deen: 120, health: 40 }, ... } for the days from `from` to `to` inclusive.
// Every event is scored with the full list (scoring needs earlier events for context); only days in range are kept.
// Weekly bonuses (chore week, boss, money payout) belong to a week, not a day, so they are not in here.
function xpByDay(events, from, to) {
  const days = {};
  for (const event of events) {
    if (event.date < from || event.date > to) continue;
    const score = scoreEvent(event, events);
    if (!score) continue;
    const day = (days[event.date] ??= {});
    day[score.branch] = (day[score.branch] || 0) + score.core + score.extra;
  }
  return days;
}

// The dates of the last `weeks` weeks as columns (Sunday first), the last column being this week.
function historyWeeks(today, weeks = HISTORY.weeks) {
  const first = shiftDate(weekStart(today), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => shiftDate(first, w * 7 + d)));
}

// 0 for nothing, then 1..shades by how the day compares with the best day shown.
function historyShade(xp, best) {
  return xp > 0 ? Math.max(1, Math.ceil((xp / best) * HISTORY.shades)) : 0;
}

function historyHtml(events, today, branchId) {
  const weeks = historyWeeks(today);
  const from = weeks[0][0];
  const days = xpByDay(events, from, today);
  const xpOn = date => days[date]?.[branchId] || 0;
  const past = weeks.flat().filter(date => date <= today);
  const best = Math.max(...past.map(xpOn), 1);
  const bestDay = past.find(date => xpOn(date) === best && best > 1);
  const active = past.filter(date => xpOn(date) > 0).length;
  const weekXp = start => Array.from({ length: 7 }, (_, d) => xpOn(shiftDate(start, d))).reduce((a, b) => a + b, 0);
  const thisWeek = weekXp(weekStart(today)), lastWeek = weekXp(shiftDate(weekStart(today), -7));

  const cells = weeks.map(week => `<div class="history-week">${week.map(date => {
    if (date > today) return '<i class="history-cell future"></i>';
    const xp = xpOn(date);
    return `<i class="history-cell" data-shade="${historyShade(xp, best)}"${date === today ? ' data-today="1"' : ""} title="${dayLabel(date)} · ${xp} XP"></i>`;
  }).join("")}</div>`).join("");
  const monthMarks = weeks.map((week, i) => {
    const month = week[0].slice(5, 7);
    return i === 0 || weeks[i - 1][0].slice(5, 7) !== month
      ? `<span>${new Date(`${week[0]}T12:00`).toLocaleDateString("en-US", { month: "short" })}</span>` : "<span></span>";
  }).join("");
  const facts = [
    `<strong>${active}</strong> active day${active === 1 ? "" : "s"} of the last ${past.length}`,
    `<strong>${thisWeek}</strong> XP this week · ${lastWeek} last week`,
    bestDay ? `Best day <strong>${best}</strong> XP · ${dayLabel(bestDay)}` : "Your best day will show here",
  ];
  return `<div class="card-row"><span class="card-title">Last ${HISTORY.weeks} weeks</span><span class="muted">${active ? "stronger colour = more XP" : "nothing logged yet"}</span></div>
    <div class="history-body">
      <div class="history-grid" role="img" aria-label="${active} active days in the last ${past.length}. ${thisWeek} XP this week, ${lastWeek} last week.">
        <div class="history-months" aria-hidden="true">${monthMarks}</div>
        <div class="history-cells">${cells}</div>
      </div>
      <ul class="history-facts">${facts.map(f => `<li>${f}</li>`).join("")}</ul>
    </div>`;
}

function drawHistory() {
  const branch = document.documentElement.dataset.branch;
  const card = document.getElementById("history");
  if (branch && card) card.innerHTML = historyHtml(loadEvents(), todayString(), branch);
}

// Only on a branch's own page (not the Planner or Study guides, which borrow Academics' colour).
function setupHistory() {
  if (!BRANCHES.some(b => b.page === currentFile())) return;
  const card = Object.assign(document.createElement("section"), { className: "card history-card", id: "history" });
  card.setAttribute("aria-label", "History");
  card.style.setProperty("--hist", `var(--${document.documentElement.dataset.branch})`);
  document.querySelector("body > script").before(card);
  drawHistory();
  window.addEventListener("events-saved", drawHistory);
}

setupHistory();
