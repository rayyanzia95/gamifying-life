// The Lahore clock on the People top card: a 24 h ring (midnight at the top) with
// their awake hours in green and a gold dot at their time now. The centre says
// their time and whether it's a good time to call. Same 300 viewBox, radius and
// text styles as the Deen dial.

const HOME_CLOCK = { size: 300, r: 80 };

// Minutes after midnight at home right now. getUTCHours() is the time in UTC, so
// adding their offset gives their clock whatever timezone this device is in.
function homeMinutesNow(now) {
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes();
  const shifted = utc + PEOPLE.home.utcOffset * 60;
  return ((shifted % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

// A point on the ring for a time of day: 0 at the top, clockwise.
function clockPoint(minutes, r) {
  const centre = HOME_CLOCK.size / 2;
  const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI - Math.PI / 2;
  return [centre + r * Math.cos(angle), centre + r * Math.sin(angle)];
}

function clockArc(from, to, r) {
  const [x1, y1] = clockPoint(from, r);
  const [x2, y2] = clockPoint(to, r);
  const large = to - from > MINUTES_PER_DAY / 2 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// Two short lines for the centre: ["good time to call", "5 h 10 min left"]
// or ["they're asleep", "up in 2 h 30 min"].
function awakeLines(minutes, from, to) {
  if (minutes >= from && minutes < to) return ["good time to call", `${durationLabel(to - minutes)} left`];
  const until = (from - minutes + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return ["they're asleep", `up in ${durationLabel(until)}`];
}

function homeClockHtml(now) {
  const { name, awakeFrom, awakeTo } = PEOPLE.home;
  const from = toMinutes(awakeFrom);
  const to = toMinutes(awakeTo);
  const minutes = homeMinutesNow(now);
  const { size, r } = HOME_CLOCK;
  const [x, y] = clockPoint(minutes, r);
  const centre = size / 2;
  const [status, detail] = awakeLines(minutes, from, to);
  return `
    <svg class="dial" viewBox="0 0 ${size} ${size}" role="img"
      aria-label="${name} time ${minutesToHhmm(minutes)}">
      <circle class="dial-track" cx="${centre}" cy="${centre}" r="${r}"/>
      <path class="dial-arc prayed" d="${clockArc(from, to, r)}"/>
      <circle class="clock-now" cx="${x}" cy="${y}" r="9"/>
      <text class="dial-now" x="${centre}" y="${centre - 12}">${minutesToHhmm(minutes)}</text>
      <text class="dial-next" x="${centre}" y="${centre + 8}">in ${name}</text>
      <text class="dial-next" x="${centre}" y="${centre + 26}">${status}</text>
      <text class="dial-next" x="${centre}" y="${centre + 42}">${detail}</text>
    </svg>`;
}
