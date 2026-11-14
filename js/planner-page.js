// Renders planner.html: one day of the plan (schedule.js) as flat rows with its deadline
// column, the week grid, the month calendar or the Deadlines tab (planner-deadlines.js).
// Rows come from planner-rows.js.
// Ticking a planned STUDY block logs it as 30-min study blocks for its course,
// one event each, all tagged with the block's id so unticking removes exactly those:
// { date, activity: "study", course: "phys", block: "b.2026-11-12.phys-midterm-2-prep" }
// They count like any study block: XP, today's 4, and damage to that course's boss.
// Ticking a CHORE or MSA row only remembers it, and scoring never sees it:
// { date, activity: "planned", block: "b.2026-11-12.dishes" }

let shownDate = todayString();

// Ids of every ticked block, study or not.
function plannedTicks(events) {
  return new Set(events.filter(e => (isStudy(e) || e.activity === "planned") && e.block).map(e => e.block));
}

function toggleBlock(date, block) {
  const events = loadEvents();
  if (plannedTicks(events).has(block.id)) {
    saveEvents(events.filter(e => e.block !== block.id));
  } else {
    const logged = block.kind === "study"
      ? Array.from({ length: blockCount(block) },
        () => ({ date, activity: "study", course: block.course, block: block.id }))
      : [{ date, activity: "planned", block: block.id }];
    saveEvents([...events, ...logged]);
  }
  render();
}

// "13:15" → "1:15", like the Planner (no a.m./p.m.; the day reads top to bottom).
function clockLabel(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}`;
}

// The schedule card: the day's focus line, then every block as a flat row.
function drawDay(events) {
  const blocks = scheduleFor(shownDate);
  const ticked = plannedTicks(events);
  const tickable = blocks.filter(isTickable);
  const done = tickable.filter(b => ticked.has(b.id)).length;
  const percent = tickable.length > 0 ? (done / tickable.length) * 100 : 0;

  const source = shownDate in PLANNED_DAYS ? "Detailed plan" : shownDate >= SCHEDULE.templateStart
    && shownDate <= SCHEDULE.templateEnd ? "Weekly template" : "";
  const rows = blocks.map(block => planBlockRow(shownDate, block, ticked, b => toggleBlock(shownDate, b)));
  const card = planCard("Schedule", null, rows, "Nothing scheduled");
  card.querySelector(".pl-card-head").append(el("span", "", source));

  document.getElementById("day").replaceChildren(card);
  document.getElementById("nav-label").textContent = dayLabel(shownDate, { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("nav-done").textContent = tickable.length > 0 ? `${done} of ${tickable.length} done` : "";
  document.getElementById("nav-bar").style.width = `${percent}%`;
}

// The column beside the schedule, like the old Planner's: what's due that day, anything
// still open from before today (only when looking at today), and the 7 days after.
function drawDaySide(events) {
  const today = todayString();
  const ticked = tickedDeadlines(events);
  const dueToday = deadlinesBetween(shownDate, shiftDate(shownDate, 1));
  const next = deadlinesBetween(shiftDate(shownDate, 1), shiftDate(shownDate, 8));
  const open = deadlinesBetween("", today).filter(d => !ticked.has(deadlineId(d))); // "" comes before every date
  const rows = (list, withDate) => list.map(d => planDeadlineRow(d, ticked, { withDate }));

  document.getElementById("day-side").replaceChildren(
    planCard("Due this day", dueToday.length, rows(dueToday, false)),
    ...(shownDate === today && open.length > 0
      ? [planCard("Still open from earlier", open.length, rows(open, true))] : []),
    planCard("Next 7 days", next.length, rows(next, true)),
  );
}

const EXAM_STRIP_SIZE = 3;

// In the header: the next few exams not ticked yet, with a countdown.
// Each is a button (data-day) that opens that day.
function drawExamStrip(events, today) {
  const chips = nextExams(events, today, EXAM_STRIP_SIZE).map(exam => {
    const chip = el("button", `pl-exam course-${exam.course}`);
    chip.type = "button";
    chip.dataset.day = exam.date;
    chip.append(el("b", "", countdownLabel(today, exam.date)), ` ${courseShort(exam.course)} ${exam.title}`);
    return chip;
  });
  document.getElementById("exam-strip").replaceChildren(...chips);
}

// ---- Views: Day, Week (planner-week.js) or Month (planner-month.js) ----

let view = "day";

// Where the arrows go: a day, a week or a month back (-1) or forward (1).
function stepDate(date, direction) {
  if (view === "month") return shiftMonth(date, direction);
  return shiftDate(date, direction * (view === "week" ? 7 : 1));
}

function drawWeek(events, today) {
  const week = weekStart(shownDate);
  const short = { month: "short", day: "numeric" };
  document.getElementById("week").innerHTML = weekGridHtml(events, week, today);
  document.getElementById("nav-label").textContent =
    `${dayLabel(week, short)} – ${dayLabel(shiftDate(week, 6), short)}`;
  document.getElementById("go-today").disabled = week === weekStart(today);
}

function drawMonth(events, today) {
  document.getElementById("month").innerHTML = monthGridHtml(events, shownDate, today);
  document.getElementById("nav-label").textContent = dayLabel(shownDate, { month: "long", year: "numeric" });
  document.getElementById("go-today").disabled = monthStart(shownDate) === monthStart(today);
}

function render() {
  const events = loadEvents();
  const today = todayString();
  drawExamStrip(events, today);
  document.querySelectorAll("[data-view]").forEach(tab =>
    tab.setAttribute("aria-selected", String(tab.dataset.view === view)));
  const containers = { day: "day-view", week: "week", month: "month", deadlines: "deadlines" };
  for (const [name, id] of Object.entries(containers)) document.getElementById(id).hidden = view !== name;
  document.getElementById("day-nav").hidden = view === "deadlines"; // the whole term, no arrows
  document.getElementById("nav-progress").hidden = view !== "day";

  if (view === "deadlines") return drawDeadlines(events);
  if (view === "week") return drawWeek(events, today);
  if (view === "month") return drawMonth(events, today);
  drawDay(events);
  drawDaySide(events);
  document.getElementById("go-today").disabled = shownDate === today;
}

function showDate(date) {
  shownDate = date;
  render();
}

function showView(name) {
  view = name;
  render();
}

// In the week grid, month calendar or exam strip: a day (data-day) opens that day,
// a block ticks, a deadline chip (data-deadline) ticks that deadline.
function onGridClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.day) {
    shownDate = target.dataset.day;
    showView("day");
    return;
  }
  if (target.dataset.deadline) return toggleDeadline(target.dataset.deadline);
  const block = scheduleFor(target.dataset.date).find(b => b.id === target.dataset.block);
  if (block) toggleBlock(target.dataset.date, block);
}

document.getElementById("prev-day").addEventListener("click", () => showDate(stepDate(shownDate, -1)));
document.getElementById("next-day").addEventListener("click", () => showDate(stepDate(shownDate, 1)));
document.getElementById("go-today").addEventListener("click", () => showDate(todayString()));
document.querySelectorAll("[data-view]").forEach(tab =>
  tab.addEventListener("click", () => showView(tab.dataset.view)));
document.getElementById("week").addEventListener("click", onGridClick);
document.getElementById("month").addEventListener("click", onGridClick);
document.getElementById("exam-strip").addEventListener("click", onGridClick);

render();
