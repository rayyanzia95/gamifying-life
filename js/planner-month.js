// The Month view on planner.html: a Sun–Sat calendar. Each day shows its
// deadlines as course-coloured chips (exams in orange, ticked ones crossed out),
// how many of its planned rows (study, chore, MSA) are done, and a thin bar. Each day is a button
// (data-day) that opens it in the Day view.
// Only config text goes into this HTML, never anything typed in.

const MONTH_CHIPS = 3; // deadlines shown per day before "+2 more"

// "2026-11-14" → "2026-11-01"
const monthStart = date => `${date.slice(0, 7)}-01`;

// The first of the month `step` months away: ("2026-11-14", 1) → "2026-12-01".
function shiftMonth(date, step) {
  const [year, month] = date.split("-").map(Number);
  return dateString(new Date(year, month - 1 + step, 1));
}

function monthChipHtml(deadline, ticked) {
  const classes = [`pl-mchip course-${deadline.course}`,
    deadline.kind === "exam" ? "exam" : "",
    ticked.has(deadlineId(deadline)) ? "done" : ""].filter(Boolean).join(" ");
  return `<span class="${classes}">${courseShort(deadline.course)} ${deadline.title}</span>`;
}

function monthDayHtml(date, month, today, planned, ticked) {
  const tickables = scheduleFor(date).filter(isTickable);
  const done = tickables.filter(b => planned.has(b.id)).length;
  const due = deadlinesBetween(date, shiftDate(date, 1));

  const classes = ["pl-mday", date.slice(0, 7) !== month ? "out" : "", date === today ? "today" : ""]
    .filter(Boolean).join(" ");
  const count = tickables.length > 0 ? `<small>${done}/${tickables.length}</small>` : "";
  const chips = due.slice(0, MONTH_CHIPS).map(d => monthChipHtml(d, ticked)).join("");
  const more = due.length > MONTH_CHIPS ? `<span class="pl-more">+${due.length - MONTH_CHIPS} more</span>` : "";
  const bar = tickables.length > 0
    ? `<span class="pl-mini"><i style="width: ${(done / tickables.length) * 100}%"></i></span>` : "";
  return `<button type="button" class="${classes}" data-day="${date}">
    <span class="pl-mdate">${Number(date.slice(8))}${count}</span>${chips}${more}${bar}</button>`;
}

// Whole weeks (Sun–Sat) covering the month that `date` is in.
function monthGridHtml(events, date, today) {
  const month = date.slice(0, 7);
  const last = shiftDate(shiftMonth(date, 1), -1);
  const days = [];
  for (let day = weekStart(monthStart(date)); day <= last || dayOfWeek(day) !== 0; day = shiftDate(day, 1)) {
    days.push(day);
  }
  const planned = plannedTicks(events);
  const ticked = tickedDeadlines(events);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map(name => `<span class="pl-mname">${name}</span>`).join("");
  const cells = days.map(day => monthDayHtml(day, month, today, planned, ticked)).join("");
  return `<div class="pl-mgrid">${names}${cells}</div>${legendHtml()}`;
}
