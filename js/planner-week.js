// The Week view on planner.html: Sun–Sat columns on a time grid (8:00–17:00),
// each block placed by its time and coloured by course. Evening blocks sit in a
// row underneath. Tickable blocks are buttons (data-block) that tick like the Today
// view; day names are buttons (data-day) that open that day; the deadlines due that
// day are chips (data-deadline) under the name.
// Only config text goes into this HTML, never anything typed in.

const WEEK_GRID = { startHour: 8, endHour: 17, hourHeight: 48, minBlockHeight: 16 };

const gridMinutes = hhmm => toMinutes(hhmm) - WEEK_GRID.startHour * 60;
const gridPixels = minutes => (minutes / 60) * WEEK_GRID.hourHeight;

function weekBlockClasses(block, ticked) {
  const done = isTickable(block) && ticked.has(block.id);
  return `pl-blk plan-${block.kind} course-${block.course ?? "none"}${done ? " done" : ""}`;
}

// A tickable block on a day that has happened can be ticked; anything else is just shown.
function weekBlockTag(date, block, today) {
  return isTickable(block) && date <= today
    ? { open: `<button type="button" data-block="${block.id}" data-date="${date}"`, close: "</button>" }
    : { open: "<div", close: "</div>" };
}

function dayBlockHtml(date, block, ticked, today) {
  const top = Math.max(gridMinutes(block.from), 0);
  const end = Math.min(gridMinutes(block.to), (WEEK_GRID.endHour - WEEK_GRID.startHour) * 60);
  const height = Math.max(gridPixels(end - top) - 2, WEEK_GRID.minBlockHeight);
  const tag = weekBlockTag(date, block, today);
  const check = isTickable(block) && ticked.has(block.id) ? "✓ " : "";
  const times = height > 30 ? `<small>${clockRange(block)}</small>` : "";
  return `${tag.open} class="${weekBlockClasses(block, ticked)}" style="top: ${gridPixels(top)}px; height: ${height}px"
    title="${block.title}"><b>${check}${block.title}</b>${times}${tag.close}`;
}

function eveningBlockHtml(date, block, ticked, today) {
  const tag = weekBlockTag(date, block, today);
  const check = isTickable(block) && ticked.has(block.id) ? "✓ " : "";
  return `${tag.open} class="${weekBlockClasses(block, ticked)} pl-chip">${check}${clockLabel(block.from)} ${block.title}${tag.close}`;
}

// A deadline due that day, as a chip under the day name; tapping it ticks it.
function dueChipHtml(deadline, ticked) {
  const classes = ["pl-chip", `course-${deadline.course}`, deadline.kind === "exam" ? "exam" : "",
    ticked.has(deadlineId(deadline)) ? "done" : ""].filter(Boolean).join(" ");
  return `<button type="button" class="${classes}" data-deadline="${deadlineId(deadline)}"
    title="${courseShort(deadline.course)}: ${deadline.title} (${deadline.time})">${deadline.title}</button>`;
}

function weekGridHtml(events, week, today) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(week, i));
  const ticked = plannedTicks(events);
  const deadlinesTicked = tickedDeadlines(events);
  const eveningFrom = WEEK_GRID.endHour * 60;
  const isEvening = block => toMinutes(block.from) >= eveningFrom;
  const columnHeight = gridPixels((WEEK_GRID.endHour - WEEK_GRID.startHour) * 60);

  const hours = Array.from({ length: WEEK_GRID.endHour - WEEK_GRID.startHour - 1 },
    (_, i) => WEEK_GRID.startHour + 1 + i);
  const gutter = `<div class="pl-gutter" style="height: ${columnHeight}px">${hours.map(h =>
    `<span style="top: ${gridPixels((h - WEEK_GRID.startHour) * 60)}px">${h % 12 || 12}</span>`).join("")}</div>`;

  const heads = days.map(date => `<div class="pl-whead${date === today ? " today" : ""}">
    <button type="button" class="pl-dayname" data-day="${date}">${dayLabel(date, { weekday: "short", day: "numeric" })}</button>
    <div class="pl-due">${deadlinesBetween(date, shiftDate(date, 1)).map(d => dueChipHtml(d, deadlinesTicked)).join("")}</div></div>`);
  const columns = days.map(date => `<div class="pl-col${date === today ? " today" : ""}"
    style="height: ${columnHeight}px; --hour: ${WEEK_GRID.hourHeight}px">${scheduleFor(date)
      .filter(block => !isEvening(block))
      .map(block => dayBlockHtml(date, block, ticked, today)).join("")}</div>`);
  const evenings = days.map(date => `<div class="pl-eve">${scheduleFor(date)
    .filter(isEvening)
    .map(block => eveningBlockHtml(date, block, ticked, today)).join("")}</div>`);

  return `<div class="pl-wscroll"><div class="pl-week">
    <div></div>${heads.join("")}
    ${gutter}${columns.join("")}
    <div class="pl-eve-label">Eve</div>${evenings.join("")}
  </div></div>${legendHtml()}`;
}
