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