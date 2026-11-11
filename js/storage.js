const STORAGE_KEY = "gamifying-life-events";

// Every event carries a hidden random `id`, so sync can tell "edited" (same id, new fields)
// from "added" (new id) and "removed" (id gone). Pages never need to look at it: editing with
// { ...e, field } copies the id along. Events from before ids existed get one the first time
// they're loaded, and that's saved straight away so the id stays the same on every reload.
function withIds(events) {
  return events.map(e => (e.id ? e : { ...e, id: crypto.randomUUID() }));
}

function readStoredEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadEvents() {
  const stored = readStoredEvents();
  const events = withIds(stored);
  if (events.some((e, i) => e !== stored[i])) localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  return events;
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withIds(events)));
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

// From today to a date: "in 5 days", "tomorrow", "today", or "3 days ago".
function countdownLabel(today, date) {
  const days = daysBetween(today, date);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
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

// 1350 -> "10:30 pm", -90 -> "10:30 pm" too: 12 h like the phone's time pickers.
// The double % wraps negatives (bedtimes before midnight) into 0–1439.
function clock12(minutes) {
  const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const suffix = hours < 12 ? "am" : "pm";
  return `${hours % 12 || 12}:${String(wrapped % 60).padStart(2, "0")} ${suffix}`;
}

// 95 -> "1 h 35 min"
function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}
