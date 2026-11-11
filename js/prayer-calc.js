// Prayer times calculated from the sun, for days the masjid timetable doesn't cover.
// Same shape as a PRAYER_TIMES entry, so the dial can't tell the difference.
// Uses PRAYER_METHOD (config.js) and the sun maths in sun.js.

// 1083.4 minutes -> "18:03"
function minutesToHhmm(minutes) {
  const rounded = Math.round(minutes);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(rounded / 60))}:${pad(rounded % 60)}`;
}

function calculatedPrayerTimes(date) {
  const method = PRAYER_METHOD;
  const { noon, declination } = solarDay(date);
  const sunrise = sunriseMinutes(date);
  const sunset = sunsetMinutes(date);
  const night = sunrise + MINUTES_PER_DAY - sunset;

  // Asr starts when a shadow is its object's length (plus its noon shadow).
  const lat = toRadians(LOCATION.lat);
  const asrAltitude = toDegrees(Math.atan(
    1 / (method.asrShadow + Math.tan(Math.abs(lat - declination)))
  ));

  // NaN = the sun never gets that far below the horizon tonight (summer).
  const fajrByAngle = noon - minutesFromNoon(-method.fajrAngle, declination);
  const ishaByAngle = noon + minutesFromNoon(-method.ishaAngle, declination);
  const earliestFajr = sunrise - night * method.fajrNightPortion;
  const latestIsha = sunset + night * method.ishaNightPortion;

  return {
    fajr: minutesToHhmm(Number.isNaN(fajrByAngle) ? earliestFajr : Math.max(fajrByAngle, earliestFajr)),
    dhuhr: minutesToHhmm(noon + method.dhuhrDelay),
    asr: minutesToHhmm(noon + minutesFromNoon(asrAltitude, declination)),
    maghrib: minutesToHhmm(sunset),
    isha: minutesToHhmm(Number.isNaN(ishaByAngle) ? latestIsha : Math.min(ishaByAngle, latestIsha)),
  };
}

// The masjid's times when we have them, otherwise calculated ones.
function prayerTimesFor(date) {
  return PRAYER_TIMES[date] ?? calculatedPrayerTimes(date);
}
