// The 24-hour prayer dial on the Deen page.
// Midnight is at the top and the day runs clockwise. Times are minutes after midnight.

// size is the drawing area; extra room past the ring keeps the prayer names inside it.
// labelRadius is where a name starts: just clear of the ring's outer edge (radius + 7).
const DIAL = { size: 300, radius: 80, labelRadius: 93, gapMinutes: 3 };

// Each prayer's window for a date (masjid times, or calculated ones past the timetable).
function prayerWindows(date) {
  const t = Object.fromEntries(
    Object.entries(prayerTimesFor(date)).map(([id, hhmm]) => [id, toMinutes(hhmm)])
  );

  // Tahajjud: last third of the night that ends at today's Fajr.
  const lastMaghrib = toMinutes(prayerTimesFor(shiftDate(date, -1)).maghrib);
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

function clockLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const suffix = hours < 12 ? "am" : "pm";
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours % 12 || 12}:${mins} ${suffix}`;
}

// A prayer's name just outside the ring, anchored so it grows away from the ring:
// names on the right start at the point, names on the left end there, and names near
// the top or bottom sit above or below it. So no name ever runs back over the ring.
function prayerLabel(w, prayed) {
  const minutes = (w.start + w.end) / 2;
  const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI - Math.PI / 2;
  const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
  const SIDE = 0.35; // how far off vertical/horizontal before a name counts as on a side
  const anchor = dx > SIDE ? "start" : dx < -SIDE ? "end" : "middle";
  const baseline = dy > SIDE ? "hanging" : dy < -SIDE ? "auto" : "middle";
  const [x, y] = pointAt(DIAL.labelRadius, minutes);
  return `<text class="dial-label${prayed ? " prayed" : ""}" x="${x}" y="${y}"
    text-anchor="${anchor}" dominant-baseline="${baseline}">${prayerName(w.id)}</text>`;
}

function windowArc(w, prayedIds) {
  const prayed = prayedIds.includes(w.id);
  const classes = ["dial-arc"];
  if (w.id === "tahajjud") classes.push("bonus");
  if (prayed) classes.push("prayed");
  const path = arcPath(DIAL.radius, w.start + DIAL.gapMinutes, w.end - DIAL.gapMinutes);
  return `
    <path class="${classes.join(" ")}" d="${path}"/>
    ${prayerLabel(w, prayed)}`;
}

// Dua extras: a gold halo for the day just inside the arcs, and one line under the
// prayer name in the centre: sun (morning adhkar), a bead per dua after prayers, moon
// (evening adhkar). Faint until done; anything new since the last draw animates in.
// rowY: how far below the centre the line sits. beadGap: bead to bead.
// iconGap: last bead to the sun/moon (bigger, so the sun's rays don't touch a bead).
const DUA_MARKS = { haloRadius: 66, rowY: 28, beadRadius: 3, beadGap: 9, iconGap: 13 };

// Beads sit centred under the prayer name; side -1 = sun on the left, 1 = moon on the right.
function beadX(i) {
  return DIAL.size / 2 + (i - (DAILY_FARDS - 1) / 2) * DUA_MARKS.beadGap;
}

function iconX(side) {
  return DIAL.size / 2 + side * (((DAILY_FARDS - 1) / 2) * DUA_MARKS.beadGap + DUA_MARKS.iconGap);
}

// One small bead per fard; gold for each dua after prayers made today.
function duaBeads(count, countBefore) {
  const y = DIAL.size / 2 + DUA_MARKS.rowY;
  return Array.from({ length: DAILY_FARDS }, (_, i) => {
    const classes = ["dua-bead", i < count ? "done" : "", i < count && i >= countBefore ? "pop" : ""];
    return `<circle class="${classes.join(" ").trim()}" cx="${beadX(i)}" cy="${y}" r="${DUA_MARKS.beadRadius}"/>`;
  }).join("");
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

// Sun (first in the line) for morning adhkar, moon (last) for evening. Faint until done.
function adhkarMark(shape, side, done, wasDone) {
  const y = DIAL.size / 2 + DUA_MARKS.rowY;
  const classes = ["dua-mark", done ? "done" : "", done && !wasDone ? "pop" : ""].join(" ").trim();
  return `<g class="${classes}">${shape(iconX(side), y)}</g>`;
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

function duaMarksHtml(dua, before) {
  return duaHalo(dua, before)
    + adhkarMark(sunShape, -1, dua.morning, before.morning)
    + duaBeads(dua.afterPrayers, before.afterPrayers)
    + adhkarMark(moonShape, 1, dua.evening, before.evening);
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
      ${duaMarksHtml(dua, before)}
      <line class="dial-hand" x1="${hx1}" y1="${hy1}" x2="${hx2}" y2="${hy2}"/>
      <text class="dial-now" x="${centre}" y="${centre - 10}">${heading}</text>
      <text class="dial-next" x="${centre}" y="${centre + 8}">${subline}</text>
    </svg>`;
}
