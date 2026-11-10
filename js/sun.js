// Sunrise for LOCATION, using NOAA's simplified solar equations.
// Accurate to about a minute, which is plenty for drawing the dial.

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

// Minutes after local midnight that the sun rises on a "YYYY-MM-DD" date.
function sunriseMinutes(date) {
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

  // 90.833° = sun's centre just below the horizon, allowing for refraction.
  const lat = toRadians(LOCATION.lat);
  const hourAngle = Math.acos(
    Math.cos(toRadians(90.833)) / (Math.cos(lat) * Math.cos(declination))
    - Math.tan(lat) * Math.tan(declination)
  );

  const sunriseUtc = 720 - 4 * (LOCATION.lng + toDegrees(hourAngle)) - equationOfTime;
  return sunriseUtc + LOCATION.utcOffset * 60;
}
