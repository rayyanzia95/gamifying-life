// Renders planner.html: one day of the academic plan (schedule.js), the week grid
// or the month calendar.
// Ticking a planned study block logs it as 30-min study blocks for its course,
// one event each, all tagged with the block's id so unticking removes exactly those:
// { date, activity: "study", course: "phys", block: "b.2026-11-12.phys-midterm-2-prep" }
// They count like any study block: XP, today's 4, and damage to that course's boss.

let shownDate = todayString();

function plannedTicks(events) {
  return new Set(events.filter(e => isStudy(e) && e.block).map(e => e.block));
}

function toggleBlock(date, block) {
  const events = loadEvents();
  if (plannedTicks(events).has(block.id)) {
    saveEvents(events.filter(e => e.block !== block.id));
  } else {
    const logged = Array.from({ length: blockCount(block) },
      () => ({ date, activity: "study", course: block.course, block: block.id }));
    saveEvents([...events, ...logged]);
  }
  render();
}

// "13:15" → "1:15", like the Planner (no a.m./p.m.; the day reads top to bottom).
function clockLabel(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}`;
}

// A study block gets a tick (not on future days); classes and exams are shown only.
function blockRow(date, block, ticked) {
  const row = document.createElement("li");
  row.className = `plan-row plan-${block.kind}`;

  const time = document.createElement("span");
  time.className = "plan-time";
  time.textContent = `${clockLabel(block.from)}–${clockLabel(block.to)}`;

  const body = document.createElement("div");
  const title = block.kind === "study"
    ? makeCheckbox(block.title, ticked.has(block.id), () => toggleBlock(date, block))
    : document.createElement("span");
  if (block.kind === "study") {
    title.querySelector("input").disabled = date > todayString();
    if (ticked.has(block.id)) title.classList.add("done");
  } else {
    title.textContent = block.title;
  }
  title.classList.add("plan-title");
  body.append(title);

  const count = blockCount(block);
  const blocksText = block.kind === "study" ? `${count} block${count === 1 ? "" : "s"}` : "";
  const details = [block.note, blocksText].filter(Boolean);
  if (details.length > 0) {
    const note = document.createElement("div");
    note.className = "muted plan-note";
    note.textContent = details.join(" · ");
    body.append(note);
  }

  row.append(time, body);
  return row;
}

function drawDay(events) {
  const blocks = scheduleFor(shownDate);
  const ticked = plannedTicks(events);
  const studyBlocks = blocks.filter(b => b.kind === "study");
  const done = studyBlocks.filter(b => ticked.has(b.id));

  const heading = document.createElement("h2");
  heading.textContent = dayLabel(shownDate, { weekday: "long", month: "long", day: "numeric" });
  const sub = document.createElement("span");
  sub.className = "muted";
  sub.textContent = studyBlocks.length > 0 ? `${done.length} of ${studyBlocks.length} done` : "";
  heading.append(sub);

  const list = document.createElement("ul");
  list.className = "plain-list";
  list.append(...blocks.map(block => blockRow(shownDate, block, ticked)));

  const empty = document.createElement("p");
  empty.className = "muted";
  empty.textContent = "Nothing planned";

  document.getElementById("day").replaceChildren(heading, blocks.length > 0 ? list : empty);
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
  document.querySelectorAll("[data-view]").forEach(tab =>
    tab.setAttribute("aria-selected", String(tab.dataset.view === view)));
  for (const name of ["day", "week", "month"]) document.getElementById(name).hidden = view !== name;

  if (view === "week") return drawWeek(events, today);
  if (view === "month") return drawMonth(events, today);
  drawDay(events);
  document.getElementById("nav-label").textContent = "";
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

// In the week or month grid: a day (data-day) opens that day, a study block ticks.
function onGridClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.day) {
    shownDate = target.dataset.day;
    showView("day");
    return;
  }
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

render();
