// Renders academics.html: the Academics level beside the boss lineup (bosses.js),
// the bar (study today + deadlines this week), the Study today card, this week's
// deadlines and the Bosses card.
// Each 30-min block is one event: { date, activity: "study", course: "phys" }
// Each ticked deadline is one event: { date, activity: "deadline", deadline: "phys-lab-7-report" }

// ---- Study blocks ----

function addBlock(courseId) {
  saveEvents([...loadEvents(), { date: todayString(), activity: "study", course: courseId }]);
  render();
}

// Undo today's latest block for this course.
function removeBlock(courseId) {
  const events = loadEvents();
  const today = todayString();
  const last = events.findLast(e => isStudy(e) && e.course === courseId && e.date === today);
  if (!last) return;
  saveEvents(events.filter(e => e !== last));
  render();
}

// A day counts toward the streak once it meets the daily goal (4 blocks).
// Forgiving like Quran: one missed day pauses it, two in a row reset it.
function studyStreak(events) {
  const perDay = {};
  for (const e of events.filter(isStudy)) perDay[e.date] = (perDay[e.date] || 0) + 1;
  const goalDays = Object.keys(perDay).filter(date => perDay[date] >= ACADEMICS.blocksPerDay);
  return dayStreak(new Set(goalDays));
}

// "1 more for today's goal", or "Goal met · +2 bonus" once past it.
function studyHint(count) {
  const left = ACADEMICS.blocksPerDay - count;
  if (left > 0) return `${left} more for today's goal`;
  return left === 0 ? "Goal met" : `Goal met · +${-left} bonus`;
}

function courseRow(course, count) {
  const onStep = delta => (delta > 0 ? addBlock(course.id) : removeBlock(course.id));
  const row = document.createElement("li");
  row.append(makeStepper(course.name, count, Infinity, onStep,
    { step: 1, unit: course.short + " blocks", format: n => String(n) }));
  return row;
}

function drawStudy(events) {
  const today = todayString();
  const blocks = events.filter(e => isStudy(e) && e.date === today);
  const countFor = courseId => blocks.filter(e => e.course === courseId).length;

  const heading = document.createElement("h2");
  heading.textContent = "Study today";
  const sub = document.createElement("span");
  sub.className = "muted";
  sub.textContent = `${blocks.length} / ${ACADEMICS.blocksPerDay} blocks · ${ACADEMICS.blockMinutes} min each`;
  heading.append(sub);

  const list = document.createElement("ul");
  list.className = "plain-list";
  list.append(...ACADEMICS.courses.map(course => courseRow(course, countFor(course.id))));

  const hint = document.createElement("p");
  hint.className = "muted";
  hint.append(studyHint(blocks.length), " ", streakBadge(studyStreak(events)));

  document.getElementById("study").replaceChildren(heading, list, hint);
}

// ---- Deadlines ----

// Deadline rows and their ticks are in deadline-list.js.

// "Next week: ASTRO Quiz: Modules 7–8, CMPUT Assignment 3, PHYS Midterm 2 and 4 more".
// Exams first, then assignments, so the big ones get named.
function nextWeekLine(week) {
  const next = deadlinesBetween(shiftDate(week, 7), shiftDate(week, 14));
  if (next.length === 0) return "Nothing due next week";
  const order = { exam: 0, assignment: 1 };
  const big = [...next].sort((a, b) => (order[a.kind] ?? 2) - (order[b.kind] ?? 2)).slice(0, 3);
  const names = big.map(d => `${courseShort(d.course)} ${d.title}`).join(", ");
  const more = next.length - big.length;
  return `Next week: ${names}${more > 0 ? ` and ${more} more` : ""}`;
}

// One small date heading, then that day's deadlines.
function dayGroups(due, ticked) {
  const dates = [...new Set(due.map(d => d.date))];
  return dates.flatMap(date => {
    const day = document.createElement("p");
    day.className = "muted day-label";
    day.textContent = dayLabel(date);
    const list = document.createElement("ul");
    list.className = "plain-list";
    list.append(...due.filter(d => d.date === date).map(d => deadlineRow(d, ticked)));
    return [day, list];
  });
}

function drawThisWeek(events) {
  const week = weekStart(todayString());
  const due = deadlinesBetween(week, shiftDate(week, 7));

  const heading = document.createElement("h2");
  heading.textContent = "This week";
  const sub = document.createElement("span");
  sub.className = "muted";
  sub.textContent = `${dayLabel(week)} – ${dayLabel(shiftDate(week, 6))}`;
  heading.append(sub);

  const empty = document.createElement("p");
  empty.className = "muted";
  empty.textContent = "Nothing due this week";
  const groups = due.length > 0 ? dayGroups(due, tickedDeadlines(events)) : [empty];

  const next = document.createElement("p");
  next.className = "muted";
  next.textContent = nextWeekLine(week);

  document.getElementById("this-week").replaceChildren(heading, ...groups, next);
}

function render() {
  const events = loadEvents();
  const today = todayString();
  const xp = xpByBranch(events)[ACADEMICS.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Academics", levelInfo(xp, 1));
  document.getElementById("boss-lineup").innerHTML = bossLineupHtml(events, today);
  document.getElementById("bosses").innerHTML = bossListHtml(events, today);

  // The bar mixes study today with this week's deadlines.
  const { study, deadlines } = academicsParts(events, today);
  const core = study.core + deadlines.core;
  const extra = study.extra + deadlines.extra;
  const goal = study.goal + deadlines.goal;
  fillBar(core, extra, goal);
  document.getElementById("progress-label").textContent =
    `${core + extra} / ${goal} XP · study today + deadlines this week`;

  drawStudy(events);
  drawThisWeek(events);
}

render();
