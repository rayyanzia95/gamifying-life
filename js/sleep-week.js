// The week of nights on the Health page: the last 7 nights as bars, bedtime at
// the bottom up to wake at the top. Times are minutes from the morning's midnight
// (bedMinutes in scoring.js), so 22:30 is -90 and 06:20 is 380.
// Two faint gold bands: ±30 min around your usual bedtime (consistency) and
// ±30 min around Fajr (the end of tahajjud time and the start of Fajr).

const SLEEP_WEEK = {
  nights: 7,
  width: 260,
  height: 190,
  plotTop: 14,
  plotHeight: 140,
  left: 26,          // hour labels sit left of this
  firstBar: 46,
  barGap: 32,
  barWidth: 8,
  fajrBand: 30,      // minutes either side of Fajr
  labelEvery: 120,   // an hour line every 2 hours
};

// The last 7 nights, oldest first: { date, night } where night is the sleep event or null.
function weekOfNights(events, today) {
  return Array.from({ length: SLEEP_WEEK.nights }, (_, i) => {
    const date = shiftDate(today, i - (SLEEP_WEEK.nights - 1));
    const night = events.find(e => isSleep(e) && e.date === date) ?? null;
    return { date, night };
  });
}

function isLogged(night) {
  return night !== null && minutesInBed(night) !== null;
}

// The pieces of a night's bar: bed to wake, with a gap where you were up for Fajr.
function barPieces(night, date) {
  const bed = bedMinutes(night.bed);
  const wake = toMinutes(night.wake);
  const fajr = toMinutes(prayerTimesFor(date).fajr);
  const gap = night.fajrGap ?? 0;
  if (gap === 0 || fajr <= bed || fajr >= wake) return [[bed, wake]];
  return [[bed, fajr], [Math.min(fajr + gap, wake), wake]].filter(([from, to]) => to > from);
}

// The time range the chart shows: every night, both bands, rounded out to whole hours.
function weekRange(nights, fajr, usual) {
  const bedBy = bedMinutes(SLEEP.bedBy);
  const logged = nights.filter(({ night }) => isLogged(night)).map(({ night }) => night);
  const lows = [bedBy, ...logged.map(n => bedMinutes(n.bed)), ...(usual === null ? [] : [usual - 30])];
  const highs = [fajr + SLEEP_WEEK.fajrBand, ...logged.map(n => toMinutes(n.wake))];
  return {
    from: Math.floor((Math.min(...lows) - 30) / 60) * 60,
    to: Math.ceil(Math.max(...highs) / 60) * 60,
  };
}

// "6a" for 360, "10p" for -120, "12a" for midnight: short 12 h labels.
function hourLabel(minutes) {
  const [time, suffix] = clock12(minutes).split(" ");
  return time.split(":")[0] + suffix[0];
}

function weekdayLetter(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "narrow" });
}

function sleepWeekHtml(events, today) {
  const W = SLEEP_WEEK;
  const nights = weekOfNights(events, today);
  const fajr = toMinutes(prayerTimesFor(today).fajr);
  const usual = usualBedtime(events, today);
  const { from, to } = weekRange(nights, fajr, usual);
  const y = minutes => (W.plotTop + ((to - minutes) / (to - from)) * W.plotHeight).toFixed(1);
  const right = W.width - 4;
  const band = (low, high) =>
    `<rect class="week-band" x="${W.left}" y="${y(high)}" width="${right - W.left}"
      height="${y(low) - y(high)}" rx="3"/>`;

  // Hour lines every 2 hours, skipping any that would crowd the Fajr label.
  const firstLine = Math.ceil(from / W.labelEvery) * W.labelEvery;
  const hours = [];
  for (let m = firstLine; m <= to; m += W.labelEvery) {
    if (Math.abs(m - fajr) < 60) continue;
    hours.push(`
      <line class="week-grid" x1="${W.left}" x2="${right}" y1="${y(m)}" y2="${y(m)}"/>
      <text class="week-label" x="12" y="${+y(m) + 3}">${hourLabel(m)}</text>`);
  }

  const bedBy = bedMinutes(SLEEP.bedBy);
  const bars = nights.map(({ date, night }, i) => {
    const x = W.firstBar + i * W.barGap;
    const isToday = date === today;
    const day = `<text class="week-day${isToday ? " today" : ""}" x="${x}" y="186">${weekdayLetter(date)}</text>`;
    if (!isLogged(night)) {
      const end = bedBy + SLEEP.hours * 60;
      return `${day}<rect class="week-missing" x="${x - W.barWidth / 2}" y="${y(end)}"
        width="${W.barWidth}" height="${y(bedBy) - y(end)}" rx="2"/>`;
    }
    const pieces = barPieces(night, date).map(([low, high]) =>
      `<rect class="week-bar${isToday ? " today" : ""}" x="${x - W.barWidth / 2}" y="${y(high)}"
        width="${W.barWidth}" height="${Math.max(y(low) - y(high), 3)}" rx="2"/>`).join("");
    const checks = sleepChecks(night, events);
    const dot = `<circle class="week-dot${checks.bedtime ? " met" : ""}" cx="${x}"
      cy="${+y(bedMinutes(night.bed)) + 7}" r="2.5"/>`;
    const hoursAsleep = (minutesAsleep(night) / 60).toFixed(1);
    const label = `<text class="week-hours${checks.hours ? " met" : ""}" x="${x}" y="172">${hoursAsleep}</text>`;
    return day + pieces + dot + label;
  }).join("");

  return `
    <svg class="sleep-week" viewBox="0 0 ${W.width} ${W.height}" role="img"
      aria-label="Last ${W.nights} nights: bedtime at the bottom, wake at the top">
      ${hours.join("")}
      ${usual === null ? "" : band(usual - 30, usual + 30)}
      ${band(fajr - W.fajrBand, fajr + W.fajrBand)}
      <text class="week-label fajr" x="12" y="${+y(fajr) + 3}">Fajr</text>
      <line class="week-bedby" x1="${W.left}" x2="${right}" y1="${y(bedBy)}" y2="${y(bedBy)}"/>
      ${bars}
    </svg>`;
}
