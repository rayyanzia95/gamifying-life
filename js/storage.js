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

// "2026-11-10" → "Tue, Nov 10". Pass other toLocaleDateString options for
// other shapes, e.g. { month: "short", day: "numeric" } → "Nov 10".
function dayLabel(date, options = { weekday: "short", month: "short", day: "numeric" }) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
}

// ---- Times of day, as minutes after midnight ----

const MINUTES_PER_DAY = 24 * 60;

// "22:40" -> 1360
function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

// 1083.4 minutes -> "18:03"
function minutesToHhmm(minutes) {
  const rounded = Math.round(minutes);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(rounded / 60))}:${pad(rounded % 60)}`;
}

// 95 -> "1 h 35 min"
function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}
