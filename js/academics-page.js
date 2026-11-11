// Renders academics.html: the Academics level, the bar (study today + deadlines
// this week), the Study today card and this week's deadlines.
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

// Tick: add an event dated today. Untick: remove every tick for that deadline.
function toggleDeadline(id) {
  const events = loadEvents();
  const isTicked = events.some(e => isDeadlineTick(e) && e.deadline === id);
  saveEvents(isTicked
    ? events.filter(e => !(isDeadlineTick(e) && e.deadline === id))
    : [...events, { date: todayString(), activity: "deadline", deadline: id }]);
  render();
}

// "2026-11-10" → "Tue, Nov 10"
function dayLabel(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function courseShort(courseId) {
  return ACADEMICS.courses.find(c => c.id === courseId)?.short ?? courseId;
}

// The tick + title + kind on the left, the time on the right, a note underneath.
function deadlineRow(deadline, ticked) {
  const id = deadlineId(deadline);
  const isDone = ticked.has(id);
  const label = makeCheckbox(`${courseShort(deadline.course)} ${deadline.title}`,
    isDone, () => toggleDeadline(id));
  if (isDone) label.classList.add("done");
  const kind = document.createElement("span");
  kind.className = "kind-tag";
  kind.textContent = deadline.kind;
  label.append(kind);

  const when = document.createElement("span");
  when.className = "muted";
  when.textContent = deadline.time;

  const line = document.createElement("div");
  line.className = "quest";
  line.append(label, when);
  const row = document.createElement("li");
  row.append(line);
  if (deadline.note) {
    const note = document.createElement("div");
    note.className = "muted deadline-note";
    note.textContent = deadline.note;
    row.append(note);
  }
  return row;
}

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
  const xp = xpByBranch(events)[ACADEMICS.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Academics", levelInfo(xp, 1));

  // The bar mixes study today with this week's deadlines.
  const { study, deadlines } = academicsParts(events, todayString());
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
