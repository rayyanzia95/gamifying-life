// Where the sun is for LOCATION, using NOAA's simplified solar equations.
// Accurate to about a minute, which is plenty for drawing the dial.
// All times are minutes after local midnight.

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// Solar noon and the sun's declination for a "YYYY-MM-DD" date.
function solarDay(date) {
  const [year, month, day] = date.split("-").map(Number);
  const dayOfYear = (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  // How far clock noon and solar noon drift apart through the year (minutes).
  const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));

  // How far north or south of the equator the sun is today (radians).
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);

  const noon = 720 - 4 * LOCATION.lng - equationOfTime + LOCATION.utcOffset * 60;
  return { noon, declination };
}

// Minutes between solar noon and the sun being at `altitude` degrees
// (negative = below the horizon). NaN if the sun never gets there that day,
// e.g. 18° below the horizon on an Edmonton summer night.
function minutesFromNoon(altitude, declination) {
  const lat = toRadians(LOCATION.lat);
  const cosHourAngle = (Math.sin(toRadians(altitude)) - Math.sin(lat) * Math.sin(declination))
    / (Math.cos(lat) * Math.cos(declination));
  if (cosHourAngle < -1 || cosHourAngle > 1) return NaN;
  return 4 * toDegrees(Math.acos(cosHourAngle));
}

// -0.833° = sun's top edge on the horizon, allowing for refraction.
const HORIZON = -0.833;

function sunriseMinutes(date) {
  const { noon, declination } = solarDay(date);
  return noon - minutesFromNoon(HORIZON, declination);
}

function sunsetMinutes(date) {
  const { noon, declination } = solarDay(date);
  return noon + minutesFromNoon(HORIZON, declination);
}
