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
  if (!isCounted(event, events)) return null;
  const prayer = PRAYERS.find(p => p.id === event.prayer);
  const set = prayer.sets.find(s => s.id === event.set);
  const xp = setEarnedXp(set, event);
  const isExtra = Boolean(prayer.bonus || set.optional);
  return { branch: prayer.branch, core: isExtra ? 0 : xp, extra: isExtra ? xp : 0 };
}

function scoreRevision(event) {
  const toGoal = Math.min(event.amount, QURAN.dailyTarget);
  const beyond = event.amount - toGoal;
  return {
    branch: QURAN.branch,
    core: toGoal * QURAN.xpPerHizb,
    extra: beyond * QURAN.xpPerHizb,
  };
}

function xpByBranch(events) {
  const totals = {};
  for (const event of events) {
    const score = scoreEvent(event, events);
    if (!score) continue;
    totals[score.branch] = (totals[score.branch] || 0) + score.core + score.extra;
  }
  return totals;
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
  if (QURAN.branch === branchId) total += QURAN.dailyTarget * QURAN.xpPerHizb;
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