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
  if (event.activity === "sleep") return scoreSleep(event, events);
  if (isExercise(event)) return scoreExercise(event, events);
  if (isDiet(event)) return scoreDiet(event);
  if (isStudy(event)) return scoreStudy(event, events);
  if (isDeadlineTick(event)) return scoreDeadline(event);
  if (isMoneyLog(event)) return scoreMoneyLog(event, events);
  if (isDeposit(event)) return scoreDeposit(event, events);
  if (isPersonal(event)) return scorePersonal(event, events);
  if (isContact(event)) return scoreContact(event, events);
  if (isWished(event)) return scoreWished(event);
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
  const bossBonus = bossBonusXp(events, DEADLINES);
  if (bossBonus > 0) totals[ACADEMICS.branch] = (totals[ACADEMICS.branch] || 0) + bossBonus;
  const moneyBonus = moneyBonusXp(events, todayString());
  if (moneyBonus > 0) totals[MONEY.branch] = (totals[MONEY.branch] || 0) + moneyBonus;
  return totals;
}

// How many matching events since `from` came before this one: earlier days,
// or earlier in the list on the same day. Shared by chores and exercise.
function earlierMatches(events, event, from, matches) {
  const index = events.indexOf(event);
  return events.filter((e, i) =>
    matches(e) && e.date >= from &&
    (e.date < event.date || (e.date === event.date && i < index))
  ).length;
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
  if (SLEEP.branch === branchId) total += sleepGoal();
  if (DIET.branch === branchId) total += dietGoal();
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
