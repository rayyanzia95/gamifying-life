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

// Hizb revised since the cycle started. "YYYY-MM-DD" strings sort like dates,
// so >= works for comparing them.
function revisedTotal(events) {
  return events
    .filter(e => isRevision(e) && e.date >= QURAN.cycleStart)
    .reduce((sum, e) => sum + e.amount, 0);
}

// The hizb you're up to (1–60). Wraps back to 1 after a full revision.
function nextHizb(events) {
  return (revisedTotal(events) % QURAN.total) + 1;
}

// 13 → "Hizb 13 · Juz 7, first half"
function hizbLabel(hizb) {
  const juz = Math.ceil(hizb / 2);
  const half = hizb % 2 === 1 ? "first half" : "second half";
  return `Hizb ${hizb} · Juz ${juz}, ${half}`;
}
