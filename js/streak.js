// Streaks that forgive a missed day. Shared by Quran revision and Dua.
// doneDays is a Set of "YYYY-MM-DD" dates when you did the thing.
// One missed day pauses the streak (the count stays). It resets when you miss
// two days in a row, or miss more than pausesPerWeek days in one week (Sun–Sat).
// Today isn't missed until it's over. Returns { days, paused }.
function dayStreak(doneDays, pausesPerWeek = Infinity) {
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
    if (doneDays.has(date)) {
      days += 1;
      missesInARow = 0;
    } else {
      missesInARow += 1;
      missesThisWeek += 1;
      if (missesInARow >= 2 || missesThisWeek > pausesPerWeek) days = 0;
    }
  }

  const doneToday = doneDays.has(today);
  if (doneToday) days += 1;
  const paused = days > 0 && !doneToday && !doneDays.has(yesterday);
  return { days, paused };
}
