// The Money calendar card: one month at a time with ‹ › arrows. Each day shows a dot
// (green = spend logged, gold = no spend, outline = not logged) and its total; under
// the grid: the month's total, days logged, and category bars. Tapping one of the last
// 7 days opens it in the Log card (showDay in money-page.js). No XP of its own.

// First day of the month shown, "YYYY-MM-01". Page state only: a reload goes back to this month.
let calendarMonth = todayString().slice(0, 7) + "-01";

function monthDays(first) {
  const [year, month] = first.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function nextMonthStart(first) {
  return shiftDate(first, monthDays(first));
}

function previousMonthStart(first) {
  return shiftDate(first, -1).slice(0, 7) + "-01";
}

function monthTitle(first) {
  return dayLabel(first, { month: "long", year: "numeric" });
}

// The earliest month with a log ("YYYY-MM-01"), or null. The ‹ arrow stops there.
function firstLogMonth(events) {
  const first = [...moneyLogDays(events)].sort()[0];
  return first ? first.slice(0, 7) + "-01" : null;
}

function stepMonth(step, events) {
  const next = step > 0 ? nextMonthStart(calendarMonth) : previousMonthStart(calendarMonth);
  const earliest = firstLogMonth(events);
  if (next > todayString() || !earliest || next < earliest) return;
  calendarMonth = next;
  render();
}

function monthArrow(label, text, disabled, onClick) {
  const button = Object.assign(document.createElement("button"),
    { type: "button", className: "arrow small", textContent: text, disabled });
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

// One day cell. Days in the Log card's reach are buttons; the rest are plain.
function calendarDay(date, events, today) {
  const spends = events.filter(e => isSpend(e) && e.date === date);
  const spent = sumCents(spends);
  const noSpend = events.some(isNoSpendOn(date));
  const logged = spends.length > 0 || noSpend;
  const reachable = date <= today && daysBetween(date, today) <= MAX_DAYS_BACK;
  const cell = document.createElement(reachable ? "button" : "div");
  cell.className = "cal-day" + (date === today ? " now" : "") + (date > today ? " future" : "");
  if (reachable) {
    cell.type = "button";
    cell.setAttribute("aria-label", `Open ${dayLabel(date)} in the Log card`);
    cell.addEventListener("click", () => {
      showDay(date);
      document.getElementById("log").scrollIntoView({ behavior: "smooth" });
    });
  }
  const dot = Object.assign(document.createElement("span"),
    { className: "session-dot" + (!logged ? "" : spends.length ? " done" : " no-spend") });
  const amount = Object.assign(document.createElement("span"), {
    className: "cal-amount" + (logged && spends.length === 0 ? " zero" : ""),
    textContent: !logged ? "" : "$" + Math.round(spent / 100),
  });
  cell.append(Number(date.slice(8)), dot, amount);
  return cell;
}

function calendarGrid(events, today) {
  const grid = document.createElement("div");
  grid.className = "cal";
  grid.append(...[..."SMTWTFS"].map(letter =>
    Object.assign(document.createElement("div"), { className: "cal-head", textContent: letter })));
  const [year, month] = calendarMonth.split("-").map(Number);
  const blanks = new Date(year, month - 1, 1).getDay();
  grid.append(...Array.from({ length: blanks }, () => document.createElement("div")));
  for (let n = 0; n < monthDays(calendarMonth); n++) {
    grid.append(calendarDay(shiftDate(calendarMonth, n), events, today));
  }
  return grid;
}

// Category bars for the month, biggest first, each as wide as its share of the biggest.
function monthCategoryBars(spends) {
  const rows = MONEY.categories
    .map(c => ({ name: c.name, cents: sumCents(spends.filter(e => e.category === c.id)) }))
    .filter(c => c.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  return rows.map(row => {
    const bar = document.createElement("div");
    bar.className = "cat-bar";
    const track = document.createElement("div");
    track.className = "mini";
    const fill = document.createElement("div");
    fill.style.width = (row.cents / rows[0].cents) * 100 + "%";
    track.append(fill);
    const amount = Object.assign(document.createElement("span"), { className: "amt", textContent: dollars(row.cents) });
    bar.append(Object.assign(document.createElement("span"), { textContent: row.name }), track, amount);
    return bar;
  });
}

function legendHtml() {
  return '<div class="cal-legend"><span class="done">logged</span><span class="no-spend">no spend</span>'
    + '<span>not logged</span></div>';
}

function drawCalendar(events, today) {
  const end = nextMonthStart(calendarMonth);
  const inMonth = events.filter(e => isMoneyLog(e) && e.date >= calendarMonth && e.date < end);
  const spends = inMonth.filter(isSpend);
  const daysLogged = new Set(inMonth.map(e => e.date)).size;
  const daysSoFar = Math.min(monthDays(calendarMonth), Math.max(daysBetween(calendarMonth, today) + 1, 0));
  const noSpendDays = noSpendDaysInMonth(events, calendarMonth.slice(0, 7));
  const earliest = firstLogMonth(events);
  const arrows = document.createElement("span");
  arrows.className = "cal-arrows";
  arrows.append(
    monthArrow("Previous month", "‹", !earliest || previousMonthStart(calendarMonth) < earliest,
      () => stepMonth(-1, events)),
    monthArrow("Next month", "›", end > today, () => stepMonth(1, events)));
  const legend = document.createElement("div");
  legend.innerHTML = legendHtml();
  document.getElementById("calendar").replaceChildren(
    heading(monthTitle(calendarMonth), ""), legend.firstChild, calendarGrid(events, today),
    mutedLine(`Spent ${dollars(sumCents(spends))} · ${daysLogged} / ${daysSoFar} days logged · ${noSpendDays} no-spend`),
    ...monthCategoryBars(spends));
  document.querySelector("#calendar h2 .muted").append(arrows);
}
