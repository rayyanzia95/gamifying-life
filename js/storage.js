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

// "2026-11-10" shifted by -1 → "2026-11-09". Date handles month/year rollover.
function shiftDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  return dateString(new Date(year, month - 1, day + days));
}
