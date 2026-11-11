const STORAGE_KEY = "gamifying-life-events";

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dateString(d) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function todayString() {
  return dateString(new Date());
}

// Whole days from one "YYYY-MM-DD" date to another. Uses UTC so a clock change
// can never make a day 23 or 25 hours long.
function daysBetween(from, to) {
  const toUtc = date => {
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86400000);
}

// "2026-11-10" shifted by -1 → "2026-11-09". Date handles month/year rollover.
function shiftDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  return dateString(new Date(year, month - 1, day + days));
}

// The Sunday that starts this date's week. getDay() is 0 on Sunday.
function weekStart(date) {
  const [year, month, day] = date.split("-").map(Number);
  return shiftDate(date, -new Date(year, month - 1, day).getDay());
}
