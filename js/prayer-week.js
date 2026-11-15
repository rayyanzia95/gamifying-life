// Deen page: the last seven days of the five daily prayers as a small grid, so a pattern shows
// (always late for Asr, never in the masjid for Fajr) that a single day's list can't.
// prayerWeekHtml(events, today) is pure; deen.js calls drawPrayerWeek() from render(). Styles: css/deen.css.

const PRAYER_WEEK_DAYS = 7;

// What happened to one prayer on one day: "none" | "prayed" | "ontime", plus whether it was in the masjid.
function prayerDayMark(events, prayer, date) {
  const main = mainSet(prayer);
  const event = events.find(e => e.date === date && e.prayer === prayer.id && e.set === main.id);
  if (!event) return { state: "none", masjid: false };
  return { state: event.onTime || event.jamaah ? "ontime" : "prayed", masjid: Boolean(event.masjid) };
}

function prayerWeekHtml(events, today) {
  const days = Array.from({ length: PRAYER_WEEK_DAYS }, (_, i) => shiftDate(today, i + 1 - PRAYER_WEEK_DAYS));
  const daily = PRAYERS.filter(p => !p.bonus);
  const words = { none: "not logged", prayed: "prayed", ontime: "prayed on time" };
  const head = days.map(d => `<th scope="col"${d === today ? ' class="is-today"' : ""}>${dayLabel(d).slice(0, 1)}</th>`).join("");
  let prayed = 0, onTime = 0, masjid = 0;
  const rows = daily.map(prayer => {
    const cells = days.map(date => {
      const mark = prayerDayMark(events, prayer, date);
      if (mark.state !== "none") prayed++;
      if (mark.state === "ontime") onTime++;
      if (mark.masjid) masjid++;
      const label = `${prayer.name}, ${dayLabel(date)}: ${words[mark.state]}${mark.masjid ? ", in the masjid" : ""}`;
      return `<td><i class="pw-dot" data-state="${mark.state}"${mark.masjid ? ' data-masjid="1"' : ""} role="img" aria-label="${label}" title="${label}"></i></td>`;
    }).join("");
    return `<tr><th scope="row">${prayer.name}</th>${cells}</tr>`;
  }).join("");
  const total = daily.length * days.length;
  return `<div class="card-row"><span class="card-title">Last 7 days</span><span class="muted">${prayed} of ${total} prayed</span></div>
    <table class="prayer-week"><thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody></table>
    <p class="pw-key muted"><span><i class="pw-dot" data-state="prayed"></i> prayed</span><span><i class="pw-dot" data-state="ontime"></i> on time · ${onTime}</span><span><i class="pw-dot" data-state="ontime" data-masjid="1"></i> masjid · ${masjid}</span></p>`;
}

function drawPrayerWeek(events) {
  const card = document.getElementById("prayer-week");
  if (card) card.innerHTML = prayerWeekHtml(events, todayString());
}
