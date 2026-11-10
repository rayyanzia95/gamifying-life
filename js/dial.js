// The 24-hour prayer dial on the Deen page.
// Midnight is at the top and the day runs clockwise. Times are minutes after midnight.

const MINUTES_PER_DAY = 24 * 60;
const DIAL = { size: 270, radius: 80, labelRadius: 104, gapMinutes: 3 };

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

// Each prayer's window for a date, or null if the timetable doesn't cover it.
function prayerWindows(date) {
  const times = PRAYER_TIMES[date];
  if (!times) return null;
  const t = Object.fromEntries(
    Object.entries(times).map(([id, hhmm]) => [id, toMinutes(hhmm)])
  );

  // Tahajjud: last third of the night that ends at today's Fajr.
  const yesterday = PRAYER_TIMES[shiftDate(date, -1)];
  const lastMaghrib = yesterday ? toMinutes(yesterday.maghrib) : t.maghrib;
  const night = t.fajr + MINUTES_PER_DAY - lastMaghrib;

  return [
    { id: "tahajjud", start: t.fajr - night / 3, end: t.fajr },
    { id: "fajr", start: t.fajr, end: sunriseMinutes(date) },
    { id: "dhuhr", start: t.dhuhr, end: t.asr },
    { id: "asr", start: t.asr, end: t.maghrib },
    { id: "maghrib", start: t.maghrib, end: t.isha },
    // Isha really runs into the night; the dial stops it at midnight to stay one day.
    { id: "isha", start: t.isha, end: MINUTES_PER_DAY },
  ];
}

function pointAt(radius, minutes) {
  const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI - Math.PI / 2;
  const centre = DIAL.size / 2;
  return [centre + radius * Math.cos(angle), centre + radius * Math.sin(angle)]
    .map(n => n.toFixed(1));
}

function arcPath(radius, start, end) {
  const [x1, y1] = pointAt(radius, start);
  const [x2, y2] = pointAt(radius, end);
  const largeArc = end - start > MINUTES_PER_DAY / 2 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function prayerName(id) {
  return PRAYERS.find(p => p.id === id).name;
}

function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}

function clockLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const suffix = hours < 12 ? "am" : "pm";
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours % 12 || 12}:${mins} ${suffix}`;
}

function windowArc(w, prayedIds) {
  const classes = ["dial-arc"];
  if (w.id === "tahajjud") classes.push("bonus");
  if (prayedIds.includes(w.id)) classes.push("prayed");
  const [x, y] = pointAt(DIAL.labelRadius, (w.start + w.end) / 2);
  const path = arcPath(DIAL.radius, w.start + DIAL.gapMinutes, w.end - DIAL.gapMinutes);
  return `
    <path class="${classes.join(" ")}" d="${path}"/>
    <text class="dial-label" x="${x}" y="${y}">${prayerName(w.id)}</text>`;
}

function dialHtml(windows, prayedIds, now) {
  const centre = DIAL.size / 2;
  const current = windows.find(w => now >= w.start && now < w.end);
  const next = windows.find(w => w.start > now);
  const heading = current ? prayerName(current.id) : clockLabel(now);
  const subline = next ? `${prayerName(next.id)} in ${durationLabel(next.start - now)}` : "";
  const [hx1, hy1] = pointAt(DIAL.radius - 14, now);
  const [hx2, hy2] = pointAt(DIAL.radius + 14, now);

  return `
    <svg class="dial" viewBox="0 0 ${DIAL.size} ${DIAL.size}" role="img"
      aria-label="Prayer dial. Now: ${heading}. ${subline}">
      <circle class="dial-track" cx="${centre}" cy="${centre}" r="${DIAL.radius}"/>
      ${windows.map(w => windowArc(w, prayedIds)).join("")}
      <line class="dial-hand" x1="${hx1}" y1="${hy1}" x2="${hx2}" y2="${hy2}"/>
      <text class="dial-now" x="${centre}" y="${centre - 4}">${heading}</text>
      <text class="dial-next" x="${centre}" y="${centre + 14}">${subline}</text>
    </svg>`;
}
