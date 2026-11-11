// The Deadlines tab on planner.html, like the Planner's: every deadline this term
// grouped by week (Sun–Sat), course filter chips, Hide done, Jump to this week,
// and "X of Y done" with a bar. Rows tick through deadline-list.js.

const deadlineFilters = { courses: new Set(ACADEMICS.courses.map(c => c.id)), hideDone: false };

// The filters only change what's shown, so they redraw without touching events.
function toggleCourseFilter(courseId) {
  const courses = new Set(deadlineFilters.courses);
  if (courses.has(courseId)) courses.delete(courseId);
  else courses.add(courseId);
  deadlineFilters.courses = courses;
  render();
}

function filterChip(course) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = `filter-chip course-${course.id}`;
  chip.setAttribute("aria-pressed", String(deadlineFilters.courses.has(course.id)));
  chip.textContent = course.name;
  chip.addEventListener("click", () => toggleCourseFilter(course.id));
  return chip;
}

function filterButton(text, pressed, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button";
  if (pressed !== null) button.setAttribute("aria-pressed", String(pressed));
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

// The header: progress over the whole term, then the filter row.
function deadlinesHeader(ticked) {
  const done = DEADLINES.filter(d => ticked.has(deadlineId(d))).length;
  const summary = document.createElement("p");
  summary.textContent = `${done} of ${DEADLINES.length} done this term`;
  const bar = document.createElement("div");
  bar.className = "bar";
  const fill = document.createElement("div");
  fill.className = "bar-fill";
  fill.style.width = `${DEADLINES.length > 0 ? (done / DEADLINES.length) * 100 : 0}%`;
  bar.append(fill);

  const filters = document.createElement("div");
  filters.className = "filters";
  filters.append(
    ...ACADEMICS.courses.map(filterChip),
    filterButton("Hide done", deadlineFilters.hideDone, () => {
      deadlineFilters.hideDone = !deadlineFilters.hideDone;
      render();
    }),
    filterButton("Jump to this week", null, () =>
      document.getElementById(`deadline-week-${weekStart(todayString())}`)?.scrollIntoView({ behavior: "smooth" })),
  );
  const card = document.createElement("section");
  card.className = "card";
  card.append(summary, bar, filters);
  return card;
}

// One heading + card per week that has anything left to show.
function deadlineWeeks(shown, ticked) {
  const weeks = [...new Set(shown.map(d => weekStart(d.date)))];
  return weeks.flatMap(week => {
    const heading = document.createElement("h3");
    heading.className = "week-heading";
    heading.id = `deadline-week-${week}`;
    const readingWeek = isBetween(shiftDate(week, 1), SCHEDULE.readingWeek) ? " · Reading week" : "";
    heading.textContent = `Week of ${dayLabel(week, { month: "short", day: "numeric" })}${readingWeek}`;
    const list = document.createElement("ul");
    list.className = "plain-list";
    list.append(...shown.filter(d => weekStart(d.date) === week)
      .map(d => deadlineRow(d, ticked, { withDate: true })));
    const card = document.createElement("section");
    card.className = "card";
    card.append(list);
    return [heading, card];
  });
}

function drawDeadlines(events) {
  const ticked = tickedDeadlines(events);
  const shown = deadlinesBetween("", "9999")
    .filter(d => deadlineFilters.courses.has(d.course))
    .filter(d => !(deadlineFilters.hideDone && ticked.has(deadlineId(d))));
  const empty = document.createElement("p");
  empty.className = "muted";
  empty.textContent = "Nothing matches these filters";
  const weeks = shown.length > 0 ? deadlineWeeks(shown, ticked) : [empty];
  document.getElementById("deadlines").replaceChildren(deadlinesHeader(ticked), ...weeks);
}
