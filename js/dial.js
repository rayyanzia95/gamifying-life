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

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// The prayer window you're in right now, or undefined between windows.
function currentWindow(windows, now) {
  return windows.find(w => now >= w.start && now < w.end);
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

// Dua extras: gold beads on prayed arcs, sun/moon for adhkar, a gold halo for the day.
// Anything new since the last draw gets a class that animates it in.
// The halo sits just inside the arcs (clear of the centre text); the sun and moon sit on
// the ring as little badges. The sun goes a bit after sunrise so it doesn't hit Fajr's bead.
const DUA_MARKS = { beadRadius: 5, haloRadius: 66, badgeRadius: 8.5, sunAfterSunrise: 20 };

// One bead per dua after prayers, on the prayed fard arcs in order (Fajr first).
function duaBeads(windows, prayedIds, count, countBefore) {
  return windows
    .filter(w => w.id !== "tahajjud" && prayedIds.includes(w.id))
    .slice(0, count)
    .map((w, i) => {
      const [x, y] = pointAt(DIAL.radius, (w.start + w.end) / 2);
      const pop = i >= countBefore ? " pop" : "";
      return `<circle class="dua-bead${pop}" cx="${x}" cy="${y}" r="${DUA_MARKS.beadRadius}"/>`;
    })
    .join("");
}

function sunShape(x, y) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map(degrees => {
    const a = (degrees * Math.PI) / 180;
    const [x1, y1, x2, y2] = [x + 4.5 * Math.cos(a), y + 4.5 * Math.sin(a), x + 6.5 * Math.cos(a), y + 6.5 * Math.sin(a)];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  });
  return `<circle cx="${x}" cy="${y}" r="2.8"/>${rays.join("")}`;
}

function moonShape(x, y) {
  return `<path d="M ${x + 1.5} ${y - 5} a 5 5 0 1 0 0 10 a 6.2 6.2 0 0 1 0 -10 z"/>`;
}

// Sun after sunrise for morning adhkar, moon at Maghrib for evening. Faint until done.
function adhkarMark(shape, minutes, done, wasDone) {
  const [x, y] = pointAt(DIAL.radius, minutes).map(Number);
  const classes = ["dua-mark", done ? "done" : "", done && !wasDone ? "pop" : ""].join(" ").trim();
  return `<g class="${classes}">
    <circle class="dua-badge" cx="${x}" cy="${y}" r="${DUA_MARKS.badgeRadius}"/>${shape(x, y)}</g>`;
}

// Gold ring just outside the arcs, filling with every dua today (out of dua.max).
function duaHalo(dua, before) {
  const r = DUA_MARKS.haloRadius;
  const centre = DIAL.size / 2;
  const length = 2 * Math.PI * r;
  const track = `<circle class="dua-halo-track" cx="${centre}" cy="${centre}" r="${r}"/>`;
  if (dua.count === 0) return track;

  const filled = (dua.count / dua.max) * length;
  const from = (Math.min(before.count, dua.count) / dua.max) * length;
  const grow = dua.count > before.count ? " grow" : "";
  return `${track}
    <circle class="dua-halo${grow}" cx="${centre}" cy="${centre}" r="${r}"
      style="--from: ${from.toFixed(1)}px; --length: ${length.toFixed(1)}px"
      stroke-dasharray="${filled.toFixed(1)} ${length.toFixed(1)}"
      transform="rotate(-90 ${centre} ${centre})"/>`;
}

function duaMarksHtml(windows, prayedIds, dua, before) {
  const sunrise = windows.find(w => w.id === "fajr").end + DUA_MARKS.sunAfterSunrise;
  const maghrib = windows.find(w => w.id === "maghrib").start;
  return duaHalo(dua, before)
    + adhkarMark(sunShape, sunrise, dua.morning, before.morning)
    + adhkarMark(moonShape, maghrib, dua.evening, before.evening)
    + duaBeads(windows, prayedIds, dua.afterPrayers, before.afterPrayers);
}

// dua is duaToday(); before is the same thing from the last draw, so only what changed animates.
function dialHtml(windows, prayedIds, now, dua, before = dua) {
  const centre = DIAL.size / 2;
  const current = currentWindow(windows, now);
  const next = windows.find(w => w.start > now);
  const heading = current ? prayerName(current.id) : clockLabel(now);
  const subline = next ? `${prayerName(next.id)} in ${durationLabel(next.start - now)}` : "";
  const [hx1, hy1] = pointAt(DIAL.radius - 14, now);
  const [hx2, hy2] = pointAt(DIAL.radius + 14, now);

  return `
    <svg class="dial" viewBox="0 0 ${DIAL.size} ${DIAL.size}" role="img"
      aria-label="Prayer dial. Now: ${heading}. ${subline}. ${dua.count} of ${dua.max} dua today.">
      <circle class="dial-track" cx="${centre}" cy="${centre}" r="${DIAL.radius}"/>
      ${windows.map(w => windowArc(w, prayedIds)).join("")}
      ${duaMarksHtml(windows, prayedIds, dua, before)}
      <line class="dial-hand" x1="${hx1}" y1="${hy1}" x2="${hx2}" y2="${hy2}"/>
      <text class="dial-now" x="${centre}" y="${centre - 4}">${heading}</text>
      <text class="dial-next" x="${centre}" y="${centre + 14}">${subline}</text>
    </svg>`;
}
