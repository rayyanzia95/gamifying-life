function setMaxXp(set) {
  if (set.type === "sunnah") {
    return (set.rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  if (set.type === "fard" || set.type === "wajib") {
    const rule = SCORING[set.type];
    return rule.base + rule.onTime + rule.masjid;
  }
  if (set.type === "tahajjud") {
    return SCORING.tahajjud.base + SCORING.tahajjud.longDua;
  }
  return 0;
}

function setBaseXp(set) {
  if (set.type === "sunnah") {
    return (set.rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  if (set.type === "fard" || set.type === "wajib") {
    return SCORING[set.type].base;
  }
  if (set.type === "tahajjud") {
    return SCORING.tahajjud.base;
  }
  return 0;
}

function setEarnedXp(set, event) {
  if (set.type === "sunnah") {
    const rakah = event.rakah ?? set.rakah;
    return (rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  let xp = setBaseXp(set);
  if (set.type === "fard" || set.type === "wajib") {
    const rule = SCORING[set.type];
    if (event.onTime) xp += rule.onTime;
    if (event.masjid) xp += rule.masjid;
  }
  if (set.type === "tahajjud" && event.dua) {
    xp += event.long ? SCORING.tahajjud.longDua : SCORING.tahajjud.shortDua;
  }
  return xp;
}
function mainSet(prayer) {
  return prayer.sets.find(set => set.type === "fard") || prayer.sets[0];
}

function isCounted(event, events) {
  const prayer = PRAYERS.find(p => p.id === event.prayer);
  if (!prayer) return false;
  if (!prayer.sets.some(s => s.id === event.set)) return false;
  const main = mainSet(prayer);
  if (event.set === main.id) return true;
  return events.some(e =>
    e.date === event.date && e.prayer === event.prayer && e.set === main.id
  );
}

// What one event is worth: { branch, core, extra }, or null if it doesn't count.
// Core XP fills the daily goal; extra XP pushes the bar past it.
function scoreEvent(event, events) {
  if (event.activity === "quran") return scoreRevision(event);
  if (event.activity === "adhkar") return { branch: DUA.branch, core: DUA.adhkarXp, extra: 0 };
  if (event.activity === "dua") return scorePersonalDua(event);
  if (event.activity === "dua-after-prayers") {
    return { branch: DUA.branch, core: 0, extra: event.amount * DUA.afterFardXp };
  }
  if (event.activity === "chore") return scoreChore(event, events);
  if (!isCounted(event, events)) return null;
  const prayer = PRAYERS.find(p => p.id === event.prayer);
  const set = prayer.sets.find(s => s.id === event.set);
  const xp = setEarnedXp(set, event);
  const isExtra = Boolean(prayer.bonus || set.optional);
  // Older days logged dua after a prayer as a flag on the fard; keep their XP.
  const afterDua = set.type === "fard" && event.dua ? DUA.afterFardXp : 0;
  return {
    branch: prayer.branch,
    core: isExtra ? 0 : xp,
    extra: (isExtra ? xp : 0) + afterDua,
  };
}

function scorePersonalDua(event) {
  const xp = DUA.personal.base + (event.long ? DUA.personal.long : 0);
  return { branch: DUA.branch, core: 0, extra: xp };
}

function scoreRevision(event) {
  const toGoal = Math.min(event.amount, QURAN.dailyTarget);
  const beyond = event.amount - toGoal;
  return {
    branch: QURAN.branch,
    core: toGoal * QURAN.xpPerJuz,
    extra: beyond * QURAN.xpPerJuz,
  };
}

function xpByBranch(events) {
  const totals = {};
  for (const event of events) {
    const score = scoreEvent(event, events);
    if (!score) continue;
    totals[score.branch] = (totals[score.branch] || 0) + score.core + score.extra;
  }
  const bonus = choreBonusXp(events);
  if (bonus > 0) totals[CHORES.branch] = (totals[CHORES.branch] || 0) + bonus;
  return totals;
}

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
  // Ticks in the window that came before this one: earlier days, or earlier in the list today.
  const index = events.indexOf(event);
  const before = events.filter((e, i) =>
    isChore(e, chore.id) && e.date >= from &&
    (e.date < event.date || (e.date === event.date && i < index))
  ).length;
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

function levelInfo(xp, multiplier) {
  let level = 1;
  let into = xp;
  let cost = LEVELS.first * multiplier;
  while (into >= cost) {
    into -= cost;
    level += 1;
    cost = (LEVELS.first + LEVELS.step * (level - 1)) * multiplier;
  }
  return { level, into, cost };
}

function branchGoal(branchId) {
  let total = 0;
  for (const prayer of PRAYERS) {
    if (prayer.branch !== branchId) continue;
    for (const set of prayer.sets) {
      if (!(prayer.bonus || set.optional)) total += setMaxXp(set);
    }
  }
  if (QURAN.branch === branchId) total += QURAN.dailyTarget * QURAN.xpPerJuz;
  if (DUA.branch === branchId) total += DUA.adhkar.length * DUA.adhkarXp;
  return total;
}

function todayXp(events, branchId) {
  const today = todayString();
  let core = 0;
  let extra = 0;
  for (const event of events) {
    if (event.date !== today) continue;
    const score = scoreEvent(event, events);
    if (!score || score.branch !== branchId) continue;
    core += score.core;
    extra += score.extra;
  }
  return { core, extra };
}