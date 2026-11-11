// Quran revision: how much you've revised and where you are, worked out from events.
// A revision event looks like { date: "2026-11-10", activity: "quran", amount: 2 }.

function isRevision(event) {
  return event.activity === "quran";
}

function todayRevision(events) {
  const today = todayString();
  const event = events.find(e => isRevision(e) && e.date === today);
  return event ? event.amount : 0;
}

// Juz revised since the cycle started. "YYYY-MM-DD" strings sort like dates,
// so >= works for comparing them.
function revisedTotal(events) {
  return events
    .filter(e => isRevision(e) && e.date >= QURAN.cycleStart)
    .reduce((sum, e) => sum + e.amount, 0);
}

// The juz you're up to (1–30). Wraps back to 1 after a full revision.
function nextJuz(events) {
  return (revisedTotal(events) % QURAN.total) + 1;
}

// 7 → "Juz 7"
function juzLabel(juz) {
  return `Juz ${juz}`;
}

// Where this revision stands: { done, completed } — done is juz into the
// current revision (0–29), completed is how many full revisions are finished.
function revisionProgress(events) {
  const total = revisedTotal(events);
  return { done: total % QURAN.total, completed: Math.floor(total / QURAN.total) };
}

// How fast you'd need to go to finish this revision before Ramadan.
function paceLabel(remaining, daysLeft) {
  if (daysLeft <= 0) return "";
  const perDay = remaining / daysLeft;
  if (perDay <= 1) return `1 juz every ${Math.floor(daysLeft / remaining)} days to finish`;
  return `${perDay.toFixed(1)} juz a day to finish`;
}

// Revision streak: { days, paused }. Missing one day pauses it (the count stays);
// missing two days in a row resets it. Today isn't missed until it's over.
function revisionStreak(events) {
  const revisedDays = new Set(
    events.filter(e => isRevision(e) && e.amount > 0).map(e => e.date)
  );
  const today = todayString();
  const yesterday = shiftDate(today, -1);
  const doneToday = revisedDays.has(today);

  let date = doneToday ? today : yesterday;
  let days = 0;
  let missesInARow = 0;
  while (missesInARow < 2) {
    if (revisedDays.has(date)) {
      days += 1;
      missesInARow = 0;
    } else {
      missesInARow += 1;
    }
    date = shiftDate(date, -1);
  }

  const paused = days > 0 && !doneToday && !revisedDays.has(yesterday);
  return { days, paused };
}
