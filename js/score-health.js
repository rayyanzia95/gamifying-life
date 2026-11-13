// Health scoring: sleep, exercise and diet, plus healthParts.

// ---- Sleep ----
// A night belongs to the morning you wake. Bedtimes are measured from that
// morning's midnight, so 22:40 is -80 and 00:15 is 15. Anything from noon on
// counts as the evening before.

function isSleep(event) {
  return event.activity === "sleep";
}

function bedMinutes(hhmm) {
  const minutes = toMinutes(hhmm);
  return minutes >= MINUTES_PER_DAY / 2 ? minutes - MINUTES_PER_DAY : minutes;
}

// Minutes in bed, from bedtime to the final wake. null until both times are in.
function minutesInBed(event) {
  if (!event.bed || !event.wake) return null;
  const minutes = toMinutes(event.wake) - bedMinutes(event.bed);
  return minutes > 0 ? minutes : null;
}

// Minutes asleep: time in bed minus the time awake for Fajr.
function minutesAsleep(event) {
  const inBed = minutesInBed(event);
  return inBed === null ? null : Math.max(inBed - (event.fajrGap ?? 0), 0);
}

// Average bedtime of the last few logged nights before `date`, or null with too few.
// toSorted returns a sorted copy, so the events array isn't changed.
function usualBedtime(events, date) {
  const nights = events
    .filter(e => isSleep(e) && e.bed && e.date < date)
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .slice(-SLEEP.usual.nights);
  if (nights.length < SLEEP.usual.minNights) return null;
  return nights.reduce((sum, e) => sum + bedMinutes(e.bed), 0) / nights.length;
}

// Which of the night's goals it met, keyed like SLEEP.xp, plus the usual bedtime.
function sleepChecks(event, events) {
  const bed = event.bed ? bedMinutes(event.bed) : null;
  const asleep = minutesAsleep(event);
  const usual = usualBedtime(events, event.date);
  return {
    bedtime: bed !== null && bed <= bedMinutes(SLEEP.bedBy),
    hours: asleep !== null && asleep >= SLEEP.hours * 60,
    consistent: bed !== null && usual !== null && Math.abs(bed - usual) <= SLEEP.usual.withinMinutes,
    usual,
  };
}

function scoreSleep(event, events) {
  const checks = sleepChecks(event, events);
  const core = Object.entries(SLEEP.xp).reduce((sum, [goal, xp]) => sum + (checks[goal] ? xp : 0), 0);
  return { branch: SLEEP.branch, core, extra: 0 };
}

function sleepGoal() {
  return Object.values(SLEEP.xp).reduce((sum, xp) => sum + xp, 0);
}

// ---- Exercise: weekly sessions ----
// One event per session: { date, activity: "exercise" }. The first EXERCISE.perWeek
// sessions of a week (Sun–Sat) are core XP; any more are bonus.

function isExercise(event) {
  return event.activity === "exercise";
}

function scoreExercise(event, events) {
  const before = earlierMatches(events, event, weekStart(event.date), isExercise);
  const isCore = before < EXERCISE.perWeek;
  return { branch: EXERCISE.branch, core: isCore ? EXERCISE.xp : 0, extra: isCore ? 0 : EXERCISE.xp };
}

// The dates of this week's sessions, oldest first (a date repeats for two sessions in a day).
function sessionDates(events, week) {
  const end = shiftDate(week, 7);
  return events.filter(e => isExercise(e) && e.date >= week && e.date < end).map(e => e.date);
}

// The week's sessions for the bar and the Home ring: { count, core, extra, goal }.
function exerciseWeek(events, week) {
  const count = sessionDates(events, week).length;
  const coreCount = Math.min(count, EXERCISE.perWeek);
  return {
    count,
    core: coreCount * EXERCISE.xp,
    extra: (count - coreCount) * EXERCISE.xp,
    goal: EXERCISE.perWeek * EXERCISE.xp,
  };
}

// ---- Diet: one event per day ----
// { date, activity: "diet", breakfast: "healthy", lunch: "okay", water: 6, creatine: true }

function isDiet(event) {
  return event.activity === "diet";
}

function mealXp(ratingId) {
  return DIET.ratings.find(r => r.id === ratingId)?.xp ?? 0;
}

function scoreDiet(event) {
  const meals = DIET.meals.reduce((sum, meal) => sum + mealXp(event[meal.id]), 0);
  const glasses = event.water ?? 0;
  const water = glasses >= DIET.water.glasses ? DIET.water.xp : 0;
  // Glasses past the target are bonus, counted only up to bonusUpTo.
  const extraGlasses = Math.min(glasses, DIET.water.bonusUpTo) - DIET.water.glasses;
  const creatine = event.creatine ? DIET.creatineXp : 0;
  return {
    branch: DIET.branch,
    core: meals + water + creatine,
    extra: Math.max(extraGlasses, 0) * DIET.water.bonusXp,
  };
}

// Best rating for every meal, plus water and creatine: 40.
function dietGoal() {
  const best = Math.max(...DIET.ratings.map(r => r.xp));
  return DIET.meals.length * best + DIET.water.xp + DIET.creatineXp;
}

// Health mixes daily parts with a weekly one: sleep and diet count today,
// sessions count over the week. Used by the Health bar and the Home ring.
function healthParts(events, today) {
  const night = events.find(e => isSleep(e) && e.date === today);
  const sleep = night ? scoreSleep(night, events) : { core: 0, extra: 0 };
  const day = events.find(e => isDiet(e) && e.date === today);
  const diet = day ? scoreDiet(day) : { core: 0, extra: 0 };
  return {
    sleep: { core: sleep.core, extra: sleep.extra, goal: sleepGoal() },
    diet: { core: diet.core, extra: diet.extra, goal: dietGoal() },
    exercise: exerciseWeek(events, weekStart(today)),
  };
}
