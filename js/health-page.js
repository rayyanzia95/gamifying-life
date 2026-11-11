// Renders health.html: the Health level beside the week of nights (sleep-week.js),
// the bar (sleep today + sessions this week), the Sleep card and the Exercise card.
// Last night is saved as one event dated this morning:
// { date, activity: "sleep", bed: "22:40", wake: "07:10", fajrGap: 20 }

function todaySleep(events) {
  const today = todayString();
  return events.find(e => isSleep(e) && e.date === today) ?? { date: today, activity: "sleep" };
}

// Merge changes into today's sleep event and swap it in for the old one.
// Spread (...) copies the object, so nothing saved earlier is changed in place.
function saveSleep(changes) {
  const events = loadEvents();
  const updated = { ...todaySleep(events), ...changes };
  const others = events.filter(e => !(isSleep(e) && e.date === updated.date));
  saveEvents([...others, updated]);
  render();
}

// Bed and wake streak: a night counts once both times are logged.
// Forgiving like Quran: one missed night pauses it, two in a row reset it.
function sleepStreak(events) {
  const nights = events.filter(e => isSleep(e) && minutesInBed(e) !== null).map(e => e.date);
  return dayStreak(new Set(nights));
}

// A labelled <input type="time">. An emptied field saves as no time at all.
function timeField(text, value, field) {
  const label = document.createElement("label");
  label.className = "field";
  const input = document.createElement("input");
  input.type = "time";
  input.value = value ?? "";
  input.addEventListener("change", () => saveSleep({ [field]: input.value || undefined }));
  label.append(text, input);
  return label;
}

function fajrGapStepper(gap) {
  const onStep = delta => saveSleep({ fajrGap: Math.max(gap + delta, 0) });
  const stepper = makeStepper("", gap, Infinity, onStep,
    { step: SLEEP.fajrStep, unit: "minutes", format: n => n + " min" });
  const row = document.createElement("div");
  row.className = "field";
  row.append("Awake for Fajr", stepper);
  return row;
}

// "8 h 10 min", plus "(7 h 50 min asleep)" when some time went to Fajr.
function sleepSummary(night) {
  const inBed = minutesInBed(night);
  if (inBed === null) return "Log last night's bed and wake times";
  const asleep = minutesAsleep(night);
  return asleep === inBed
    ? durationLabel(inBed)
    : `${durationLabel(inBed)} in bed · ${durationLabel(asleep)} asleep`;
}

// The three goals with ✓ or ✗. Only drawn once a bedtime is in.
function sleepCheckList(night, events) {
  const checks = sleepChecks(night, events);
  const usual = checks.usual === null
    ? `needs ${SLEEP.usual.minNights} nights logged`
    : `usual ${minutesToHhmm((checks.usual + MINUTES_PER_DAY) % MINUTES_PER_DAY)}`;
  const rows = [
    [checks.bedtime, `In bed by ${SLEEP.bedBy}`],
    [checks.hours, `${SLEEP.hours} h+ sleep`],
    [checks.consistent, `Within ${SLEEP.usual.withinMinutes} min of usual (${usual})`],
  ].map(([met, text]) => {
    const item = document.createElement("li");
    item.className = met ? "met" : "muted";
    item.textContent = (met ? "✓ " : "✗ ") + text;
    return item;
  });
  const list = document.createElement("ul");
  list.className = "checks";
  list.append(...rows);
  return list;
}

function drawSleep(events) {
  const night = todaySleep(events);
  const streak = sleepStreak(events);

  const title = document.createElement("div");
  title.className = "card-row";
  const heading = document.createElement("h2");
  heading.textContent = "Sleep";
  title.append(heading, streak.days > 0 ? streakBadge(streak) : "");

  const summary = document.createElement("p");
  summary.className = "sleep-summary";
  summary.textContent = sleepSummary(night);

  document.getElementById("sleep").replaceChildren(
    title,
    timeField("Bed", night.bed, "bed"),
    timeField("Woke", night.wake, "wake"),
    fajrGapStepper(night.fajrGap ?? 0),
    summary,
    night.bed ? sleepCheckList(night, events) : "",
  );
}

// ---- Exercise: one weekly counter for gym and climbing ----

function addSession() {
  saveEvents([...loadEvents(), { date: todayString(), activity: "exercise" }]);
  render();
}

// Undo this week's latest session. findLast searches from the end of the array.
function removeSession() {
  const events = loadEvents();
  const week = weekStart(todayString());
  const last = events.findLast(e => isExercise(e) && e.date >= week);
  if (!last) return;
  saveEvents(events.filter(e => e !== last));
  render();
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Sun–Sat dots: filled on days with a session, outlined for today.
// Screen readers get one summary instead of seven dots.
function sessionDots(dates, week, today) {
  const days = WEEKDAY_LETTERS.map((letter, i) => {
    const date = shiftDate(week, i);
    const dot = document.createElement("span");
    dot.className = ["session-dot", dates.includes(date) ? "done" : "", date === today ? "today" : ""]
      .join(" ").trim();
    const day = document.createElement("div");
    day.append(dot, letter);
    return day;
  });
  const row = document.createElement("div");
  row.className = "session-days";
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", `Sessions on ${new Set(dates).size} days this week`);
  row.append(...days);
  return row;
}

// "2 to go · 4 days left", "1 to go · last day", or "Target met · +1 bonus".
function sessionHint(count, week, today) {
  const left = EXERCISE.perWeek - count;
  if (left <= 0) return left < 0 ? `Target met · +${-left} bonus` : "Target met for the week";
  const daysLeft = 7 - daysBetween(week, today);
  return `${left} to go · ${daysLeft === 1 ? "last day" : daysLeft + " days left"}`;
}

function drawExercise(events) {
  const today = todayString();
  const week = weekStart(today);
  const dates = sessionDates(events, week);

  const heading = document.createElement("h2");
  heading.textContent = "Exercise";
  const onStep = delta => (delta > 0 ? addSession() : removeSession());
  const stepper = makeStepper("this week", dates.length, Infinity, onStep,
    { step: 1, target: EXERCISE.perWeek, unit: "sessions" });
  const hint = document.createElement("p");
  hint.className = "muted";
  hint.textContent = sessionHint(dates.length, week, today);

  document.getElementById("exercise").replaceChildren(
    heading, stepper, sessionDots(dates, week, today), hint,
  );
}

function render() {
  const events = loadEvents();
  const today = todayString();
  const xp = xpByBranch(events)[SLEEP.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Health", levelInfo(xp, 1));
  document.getElementById("sleep-week").innerHTML = sleepWeekHtml(events, today);

  // The bar mixes sleep today with this week's sessions.
  const { sleep, exercise } = healthParts(events, today);
  const core = sleep.core + exercise.core;
  const extra = sleep.extra + exercise.extra;
  const goal = sleep.goal + exercise.goal;
  fillBar(core, extra, goal);
  document.getElementById("progress-label").textContent =
    `${core + extra} / ${goal} XP · sleep today + sessions this week`;

  drawSleep(events);
  drawExercise(events);
}

render();
