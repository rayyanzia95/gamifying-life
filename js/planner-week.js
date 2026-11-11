// The Week view on planner.html: Sun–Sat columns on a time grid (8:00–17:00),
// each block placed by its time and coloured by course. Evening blocks sit in a
// row underneath. Study blocks are buttons (data-block) that tick like the Day
// view; day names are buttons (data-day) that open that day.
// Only config text goes into this HTML, never anything typed in.

const WEEK_GRID = { startHour: 8, endHour: 17, hourHeight: 44, minBlockHeight: 16 };

const gridMinutes = hhmm => toMinutes(hhmm) - WEEK_GRID.startHour * 60;
const gridPixels = minutes => (minutes / 60) * WEEK_GRID.hourHeight;

function weekBlockClasses(block, ticked) {
  return `week-block plan-${block.kind} course-${block.course ?? "none"}${ticked.has(block.id) ? " done" : ""}`;
}

// A study block on a day that has happened can be ticked; anything else is just shown.
function weekBlockTag(date, block, today) {
  const isTickable = block.kind === "study" && date <= today;
  return isTickable
    ? { open: `<button type="button" data-block="${block.id}" data-date="${date}"`, close: "</button>" }
    : { open: "<div", close: "</div>" };
}

function dayBlockHtml(date, block, ticked, today) {
  const top = Math.max(gridMinutes(block.from), 0);
  const end = Math.min(gridMinutes(block.to), (WEEK_GRID.endHour - WEEK_GRID.startHour) * 60);
  const height = Math.max(gridPixels(end - top) - 2, WEEK_GRID.minBlockHeight);
  const tag = weekBlockTag(date, block, today);
  const check = ticked.has(block.id) ? "✓ " : "";
  return `${tag.open} class="${weekBlockClasses(block, ticked)}" style="top: ${gridPixels(top)}px; height: ${height}px"
    title="${block.title}">${check}${block.title}${tag.close}`;
}

function eveningBlockHtml(date, block, ticked, today) {
  const tag = weekBlockTag(date, block, today);
  const check = ticked.has(block.id) ? "✓ " : "";
  return `${tag.open} class="${weekBlockClasses(block, ticked)} week-chip">${check}${block.title}${tag.close}`;
}

function weekGridHtml(events, week, today) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(week, i));
  const ticked = plannedTicks(events);
  const eveningFrom = WEEK_GRID.endHour * 60;
  const isEvening = block => toMinutes(block.from) >= eveningFrom;
  const columnHeight = gridPixels((WEEK_GRID.endHour - WEEK_GRID.startHour) * 60);

  const hours = Array.from({ length: WEEK_GRID.endHour - WEEK_GRID.startHour - 1 },
    (_, i) => WEEK_GRID.startHour + 1 + i);
  const gutter = `<div class="week-gutter" style="height: ${columnHeight}px">${hours.map(h =>
    `<span style="top: ${gridPixels((h - WEEK_GRID.startHour) * 60)}px">${h % 12 || 12}</span>`).join("")}</div>`;

  const heads = days.map(date => `<button type="button" class="week-head${date === today ? " today" : ""}"
    data-day="${date}">${dayLabel(date, { weekday: "short", day: "numeric" })}</button>`);
  const columns = days.map(date => `<div class="week-col${date === today ? " today" : ""}"
    style="height: ${columnHeight}px; --hour: ${WEEK_GRID.hourHeight}px">${scheduleFor(date)
      .filter(block => !isEvening(block))
      .map(block => dayBlockHtml(date, block, ticked, today)).join("")}</div>`);
  const evenings = days.map(date => `<div class="week-eve">${scheduleFor(date)
    .filter(isEvening)
    .map(block => eveningBlockHtml(date, block, ticked, today)).join("")}</div>`);

  return `<div class="week-scroll"><div class="week-grid">
    <div></div>${heads.join("")}
    ${gutter}${columns.join("")}
    <div class="week-eve-label">Eve</div>${evenings.join("")}
  </div></div>`;
}
