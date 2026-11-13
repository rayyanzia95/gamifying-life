// Chores scoring: weekly quests and the full-week streak.

// ---- Chores: weekly quests ----
// A quest's window is the weeks that cover it: this week, plus last week for
// everyWeeks: 2. Ticks count as core XP until the target is met in the window.

function isChore(event, choreId) {
  return event.activity === "chore" && event.chore === choreId;
}

function choreTarget(chore) {
  return chore.times ?? 1;
}

// The Sunday a chore's window starts, for the week starting on `week`.
function choreWindowStart(chore, week) {
  return shiftDate(week, -7 * ((chore.everyWeeks ?? 1) - 1));
}

// How many times a chore was done from `from` up to (not including) `to`.
function choreCount(events, choreId, from, to) {
  return events.filter(e => isChore(e, choreId) && e.date >= from && e.date < to).length;
}


function scoreChore(event, events) {
  const chore = CHORES.list.find(c => c.id === event.chore);
  if (!chore) return null;
  const from = choreWindowStart(chore, weekStart(event.date));
  const before = earlierMatches(events, event, from, e => isChore(e, chore.id));
  const isCore = before < choreTarget(chore);
  return { branch: CHORES.branch, core: isCore ? chore.xp : 0, extra: isCore ? 0 : chore.xp };
}

// How many times a chore is due this week, before any of this week's ticks.
// Ironing done last week → 0, because last week's tick still covers it.
function choreDueThisWeek(events, chore, week) {
  const earlier = choreCount(events, chore.id, choreWindowStart(chore, week), week);
  return Math.max(choreTarget(chore) - earlier, 0);
}

// How many more times a chore needs doing this week.
function choreLeftThisWeek(events, chore, week) {
  const thisWeek = choreCount(events, chore.id, week, shiftDate(week, 7));
  return Math.max(choreDueThisWeek(events, chore, week) - thisWeek, 0);
}

function choreWeekDone(events, week) {
  return CHORES.list.every(chore => choreLeftThisWeek(events, chore, week) === 0);
}

// Full-week bonuses for every week that has chore ticks and every quest covered.
function choreBonusXp(events) {
  const weeks = new Set(events.filter(e => e.activity === "chore").map(e => weekStart(e.date)));
  const doneWeeks = [...weeks].filter(week => choreWeekDone(events, week));
  return doneWeeks.length * CHORES.weekBonus;
}

// The week's chore XP for the bar and the Home ring: { core, extra, goal, done }.
// goal only counts quests due this week, so ironing done last week drops out of it.
function choreWeek(events, week) {
  const end = shiftDate(week, 7);
  let core = 0;
  let extra = 0;
  for (const event of events) {
    if (event.activity !== "chore" || event.date < week || event.date >= end) continue;
    const score = scoreChore(event, events);
    if (!score) continue;
    core += score.core;
    extra += score.extra;
  }
  const goal = CHORES.list.reduce(
    (sum, chore) => sum + choreDueThisWeek(events, chore, week) * chore.xp, 0
  );
  const done = choreWeekDone(events, week);
  return { core, extra: extra + (done ? CHORES.weekBonus : 0), goal, done };
}

// ---- Chores: full-week streak ----
// A week is full when it has chore ticks and every quest is covered (the +50 bonus test).
// Display only, no XP. One missed week only pauses the streak; two in a row reset it.
// This week never counts as missed while it is still open.

function choreWeekFull(events, week) {
  const end = shiftDate(week, 7);
  const hasTicks = events.some(e => e.activity === "chore" && e.date >= week && e.date < end);
  return hasTicks && choreWeekDone(events, week);
}

// Returns { weeks, paused }.
function choreStreak(events, today) {
  const thisWeek = weekStart(today);
  const firstTick = events.filter(e => e.activity === "chore").map(e => e.date).sort()[0];
  let weeks = 0;
  let missesInARow = 0;
  for (let week = firstTick && weekStart(firstTick); week && week < thisWeek; week = shiftDate(week, 7)) {
    if (choreWeekFull(events, week)) {
      weeks += 1;
      missesInARow = 0;
    } else {
      missesInARow += 1;
      if (missesInARow >= 2) weeks = 0;
    }
  }
  const fullNow = choreWeekFull(events, thisWeek);
  if (fullNow) weeks += 1;
  return { weeks, paused: weeks > 0 && !fullNow && missesInARow > 0 };
}
