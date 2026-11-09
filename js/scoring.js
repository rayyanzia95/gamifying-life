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

function totalMax({ extras }) {
  let total = 0;
  for (const prayer of PRAYERS) {
    for (const set of prayer.sets) {
      const isExtra = Boolean(prayer.bonus || set.optional);
      if (isExtra === extras) total += setMaxXp(set);
    }
  }
  return total;
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
    if (event.masjid) xp += rule.masjid;
  }
  if (set.type === "tahajjud" && event.dua) {
    xp += event.long ? SCORING.tahajjud.longDua : SCORING.tahajjud.shortDua;
  }
  return xp;

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

function xpByBranch(events) {
  const totals = {};
  for (const event of events) {
    if (!isCounted(event, events)) continue;
    const prayer = PRAYERS.find(p => p.id === event.prayer);
    const set = prayer.sets.find(s => s.id === event.set);
    totals[prayer.branch] = (totals[prayer.branch] || 0) + setEarnedXp(set, event);
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