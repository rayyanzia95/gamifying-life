// The Deadlines tab on planner.html, like the Planner's: every deadline this term
// grouped by week (Sun–Sat), course filter chips, Hide done, Jump to this week,
// and "X of Y done" with a bar. Rows come from planner-rows.js.

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
  chip.className = `pl-fchip course-${course.id}`;
  chip.setAttribute("aria-pressed", String(deadlineFilters.courses.has(course.id)));
  chip.textContent = course.name;
  chip.addEventListener("click", () => toggleCourseFilter(course.id));
  return chip;
}

function filterButton(text, pressed, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pl-fbtn";
  if (pressed !== null) button.setAttribute("aria-pressed", String(pressed));
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

// The header: progress over the whole term, then the filter row.
function deadlinesHeader(ticked) {
  const done = DEADLINES.filter(d => ticked.has(deadlineId(d))).length;
  const nav = el("div", "pl-nav");
  const bar = el("span", "pl-pbar");
  bar.append(document.createElement("i"));
  bar.firstChild.style.width = `${DEADLINES.length > 0 ? (done / DEADLINES.length) * 100 : 0}%`;
  nav.append(el("h2", "", "Deadlines"), el("span", "pl-sub", `${done} of ${DEADLINES.length} done this term`), bar);

  const filters = el("div", "pl-filters");
  filters.append(
    ...ACADEMICS.courses.map(filterChip),
    filterButton("Hide done", deadlineFilters.hideDone, () => {
      deadlineFilters.hideDone = !deadlineFilters.hideDone;
      render();
    }),
    filterButton("Jump to this week", null, () =>
      document.getElementById(`deadline-week-${weekStart(todayString())}`)?.scrollIntoView({ behavior: "smooth" })),
  );
  return [nav, filters];
}

// One heading + card per week that has anything left to show.
function deadlineWeeks(shown, ticked) {
  const weeks = [...new Set(shown.map(d => weekStart(d.date)))];
  return weeks.flatMap(week => {
    const readingWeek = isBetween(shiftDate(week, 1), SCHEDULE.readingWeek) ? " · Reading week" : "";
    const heading = el("h3", "pl-wk");
    heading.id = `deadline-week-${week}`;
    heading.append(el("b", "", `Week of ${dayLabel(week, { month: "short", day: "numeric" })}`), readingWeek);
    const list = el("ul", "plain-list pl-list");
    list.append(...shown.filter(d => weekStart(d.date) === week)
      .map(d => planDeadlineRow(d, ticked, { withDate: true })));
    const card = el("section", "pl-card");
    card.append(list);
    return [heading, card];
  });
}

function drawDeadlines(events) {
  const ticked = tickedDeadlines(events);
  const shown = deadlinesBetween("", "9999")
    .filter(d => deadlineFilters.courses.has(d.course))
    .filter(d => !(deadlineFilters.hideDone && ticked.has(deadlineId(d))));
  const weeks = shown.length > 0 ? deadlineWeeks(shown, ticked) : [el("p", "pl-empty", "Nothing matches these filters")];
  document.getElementById("deadlines").replaceChildren(...deadlinesHeader(ticked), ...weeks);
}
