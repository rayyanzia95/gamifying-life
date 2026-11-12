// Streaks that forgive a missed day. Shared by Quran, Dua, Sleep, Diet, Study, Journal, Reading.
// doneDays is a Set of "YYYY-MM-DD" dates when you did the thing.
// One missed day pauses the streak (the count stays). It resets when you miss
// two days in a row, or miss more than pausesPerWeek days in one week (Sun–Sat).
// restedDays (rest days spent on this streak) are not done days, so they add nothing to
// the count, but they don't count as misses either (see REWARDS.restCoversWeeklyPause).
// Today isn't missed until it's over. Returns { days, paused }.
function dayStreak(doneDays, pausesPerWeek = Infinity, restedDays = new Set()) {
  const today = todayString();
  const yesterday = shiftDate(today, -1);
  const first = [...doneDays].sort()[0];

  let days = 0;
  let missesInARow = 0;
  let week = null;
  let missesThisWeek = 0;

  // Walk forward from the first day you ever did it, up to yesterday.
  for (let date = first; date && date < today; date = shiftDate(date, 1)) {
    if (weekStart(date) !== week) {
      week = weekStart(date);
      missesThisWeek = 0;
    }
    const rested = restedDays.has(date);
    if (doneDays.has(date)) {
      days += 1;
      missesInARow = 0;
    } else {
      // A rest day never counts toward two in a row; toward the weekly limit only if set so.
      missesInARow = rested ? 0 : missesInARow + 1;
      if (!rested || !REWARDS.restCoversWeeklyPause) missesThisWeek += 1;
      if (missesInARow >= 2 || missesThisWeek > pausesPerWeek) days = 0;
    }
  }

  const doneToday = doneDays.has(today);
  if (doneToday) days += 1;
  const paused = days > 0 && !doneToday && !doneDays.has(yesterday) && !restedDays.has(yesterday);
  return { days, paused };
}

// ---- Rest days (a level-up reward) ----
// Event: { date: day spent, activity: "rest", streak: "quran", day: the missed day it covers }.

function isRest(event) {
  return event.activity === "rest";
}

function restedDays(events, streakId) {
  return new Set(events.filter(e => isRest(e) && e.streak === streakId).map(e => e.day));
}

// Rest days you hold now: +1 on the day each overall level was reached (never above
// REWARDS.restMax), −1 for each one spent. Level-ups count before spends on the same day.
function restDaysHeld(events) {
  const changes = [
    ...overallLevelDates(events).map(date => ({ date, step: 1 })),
    ...events.filter(isRest).map(e => ({ date: e.date, step: -1 })),
  ].sort((a, b) => a.date.localeCompare(b.date) || b.step - a.step);
  return changes.reduce((held, change) => Math.min(Math.max(held + change.step, 0), REWARDS.restMax), 0);
}

// A streak that can take a rest day: { days, paused, id, rest }.
// rest is "used" when a rest day was spent on it today (tap again to undo), "offer" when
// yesterday was missed and a rest day would keep the streak (paused, or saved from a
// reset) and you hold one, else null. The rest-day count is only worked out when needed.
function restStreak(id, doneDays, events, pausesPerWeek = Infinity) {
  const today = todayString();
  const yesterday = shiftDate(today, -1);
  const rested = restedDays(events, id);
  const streak = dayStreak(doneDays, pausesPerWeek, rested);

  if (events.some(e => isRest(e) && e.streak === id && e.date === today)) {
    return { ...streak, id, rest: "used" };
  }
  const missedYesterday = !doneDays.has(yesterday) && !rested.has(yesterday);
  const withRest = missedYesterday && dayStreak(doneDays, pausesPerWeek, new Set([...rested, yesterday]));
  const helps = withRest && (streak.paused || withRest.days > streak.days);
  return { ...streak, id, rest: helps && restDaysHeld(events) > 0 ? "offer" : null };
}

// Spend a rest day on yesterday for this streak, or undo the one spent today.
function toggleRest(streakId) {
  const events = loadEvents();
  const today = todayString();
  const spent = events.find(e => isRest(e) && e.streak === streakId && e.date === today);
  saveEvents(spent
    ? events.filter(e => e !== spent)
    : [...events, { date: today, activity: "rest", streak: streakId, day: shiftDate(today, -1) }]);
}
