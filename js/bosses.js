// Exams as bosses on academics.html: the lineup beside the badge (the next few
// exams) and the Bosses card (every exam this term). HP comes from bossState in
// scoring.js. Only config text goes into this HTML, never anything typed in.

const BOSS_LINEUP_SIZE = 3;

// "in 5 days", "tomorrow", "today", or "3 days ago".
function bossCountdown(exam, today) {
  const days = daysBetween(today, exam.date);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// The line under the HP bar.
function bossStatus(state, today) {
  if (state.beaten) return `✓ Beaten · +${ACADEMICS.boss.bonusXp} XP`;
  if (state.ticked) return `✓ Done · ${state.left} HP left`;
  const hp = `${state.left} / ${state.hp} HP`;
  if (today < state.opens) return `${hp} · window opens ${dayLabel(state.opens, { month: "short", day: "numeric" })}`;
  return hp;
}

// One boss: name and when on top, a continuous HP bar, then its status.
// The full card shows the date too; the lineup beside the badge only the countdown.
function bossHtml(exam, state, today, { withDate = false } = {}) {
  const name = `${courseShort(exam.course)} ${exam.title}`;
  const when = withDate ? `${dayLabel(exam.date)} · ${bossCountdown(exam, today)}` : bossCountdown(exam, today);
  const share = (state.left / state.hp) * 100;
  return `
    <div class="boss${state.ticked ? " slain" : ""}">
      <div class="boss-top"><span class="boss-name">${name}</span><span class="muted">${when}</span></div>
      <div class="hp-bar" role="img" aria-label="${name}: ${state.left} of ${state.hp} HP left">
        <div class="hp-fill" style="width: ${share}%"></div>
      </div>
      <div class="muted boss-status">${bossStatus(state, today)}</div>
    </div>`;
}

function allBosses() {
  return DEADLINES.filter(isBoss).sort((a, b) => a.date.localeCompare(b.date));
}

// The next few exams not ticked yet, nearest first.
function bossLineupHtml(events, today) {
  const ticked = tickedDeadlines(events);
  const next = allBosses()
    .filter(exam => exam.date >= today && !ticked.has(deadlineId(exam)))
    .slice(0, BOSS_LINEUP_SIZE);
  if (next.length === 0) return `<p class="muted">No bosses left this term</p>`;
  return next.map(exam => bossHtml(exam, bossState(events, exam, ticked), today)).join("");
}

function bossListHtml(events, today) {
  const ticked = tickedDeadlines(events);
  const rows = allBosses()
    .map(exam => bossHtml(exam, bossState(events, exam, ticked), today, { withDate: true }));
  return `
    <h2>Bosses <span class="muted">${ACADEMICS.boss.windowDays} days of blocks for that course</span></h2>
    ${rows.join("")}`;
}
