// Levels over time: level-up dates and logging-day helpers.

// ---- Levels over time (level-up rewards) ----
// Nothing about level-ups is stored: the day a level was reached is found from the
// events, by scoring only the events dated before (or up to) a day.

// The level of a branch from XP totals, or the overall level when branchId is null.
function levelOf(totals, branchId) {
  if (branchId) return levelInfo(totals[branchId] || 0, 1);
  const overall = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  return levelInfo(overall, LEVELS.overallMultiplier);
}

function xpBefore(events, date) {
  return xpByBranch(events.filter(e => e.date < date));
}

// What a page's badge shows: levelInfo plus newToday, true on the day the level was reached.
function branchLevel(events, branchId) {
  const info = levelOf(xpByBranch(events), branchId);
  return { ...info, newToday: info.level > levelOf(xpBefore(events, todayString()), branchId).level };
}

// Every level reached today, overall first: [{ branch: null | "health", level }].
function levelUpsToday(events) {
  const now = xpByBranch(events);
  const before = xpBefore(events, todayString());
  return [null, ...BRANCHES.map(b => b.id)]
    .map(branch => ({ branch, level: levelOf(now, branch).level, was: levelOf(before, branch).level }))
    .filter(up => up.level > up.was)
    .map(({ branch, level }) => ({ branch, level }));
}

// The day each overall level from 2 up was reached, in order. A binary search per level
// over the days with events keeps this to a few dozen scorings, not one per day.
function overallLevelDates(events) {
  const days = [...new Set(events.map(e => e.date))].sort();
  const levels = new Map();
  const levelOn = i => {
    if (!levels.has(i)) levels.set(i, levelOf(xpByBranch(events.filter(e => e.date <= days[i])), null).level);
    return levels.get(i);
  };
  if (days.length === 0) return [];

  const dates = [];
  let low = 0;
  for (let level = 2; level <= levelOn(days.length - 1); level++) {
    let high = days.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (levelOn(mid) >= level) high = mid;
      else low = mid + 1;
    }
    dates.push(days[low]);
  }
  return dates;
}

// The days something was logged (a spend or a no-spend), for the logging streak.
function moneyLogDays(events) {
  return new Set(events.filter(isMoneyLog).map(e => e.date));
}

// How many no-spend days fall in one month ("2026-11"), for the gold stars.
function noSpendDaysInMonth(events, month) {
  return new Set(events.filter(e => e.activity === "no-spend" && e.date.startsWith(month)).map(e => e.date)).size;
}
