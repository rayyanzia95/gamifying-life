// Money's top card, beside the badge: budget left this week as the outer green ring,
// the savings goal as a thin gold ring inside it, and the week's days as dots underneath.

const MONEY_RINGS = { outer: 42, inner: 33 };

// An arc of a ring: `length` long, starting `from` along the ring (from the top, clockwise).
// The dash pattern is: nothing for 0, a gap of `from`, the arc, then a gap for the rest.
function ringArc(cls, r, from, length) {
  const C = 2 * Math.PI * r;
  return `<circle class="${cls}" cx="50" cy="50" r="${r}"
    transform="rotate(-90 50 50)" stroke-dasharray="0 ${from} ${length} ${C}"/>`;
}

// 850 → "$8.50". Shared by the Money page.
function dollars(cents) {
  return "$" + (cents / 100).toFixed(2);
}

// The goal the savings ring shows: the latest one, or null if none is set yet.
function currentGoal(events) {
  return savingsGoals(events).at(-1) ?? null;
}

function savedPercent(goal) {
  return Math.round(Math.min(goal.saved / goal.cents, 1) * 100);
}

// "4 days" (today included), or "last day" on Saturday.
function daysToGo(week, today) {
  const left = 7 - daysBetween(week, today);
  return left === 1 ? "last day" : `${left} days`;
}

function ringTextHtml(week, goal, today) {
  const hasBudget = week.budget !== null;
  const main = hasBudget ? dollars(week.left) : "No budget";
  const sub = hasBudget ? `left · ${daysToGo(weekStart(today), today)}` : "set one below";
  const saved = goal ? `saved ${savedPercent(goal)}%` : "";
  return `
    <text class="money-left" x="50" y="50" text-anchor="middle">${main}</text>
    <text class="money-sub" x="50" y="60" text-anchor="middle">${sub}</text>
    <text class="money-sub money-saved" x="50" y="69" text-anchor="middle">${saved}</text>`;
}

function moneyRingsSvg(events, today) {
  const week = moneyWeek(events, weekStart(today));
  const goal = currentGoal(events);
  const { outer, inner } = MONEY_RINGS;
  const leftShare = week.budget ? week.left / week.budget : 0;
  const goalRing = goal
    ? `<circle class="money-saved-track" cx="50" cy="50" r="${inner}"/>` +
      ringArc("money-saved-ring", inner, 0, (savedPercent(goal) / 100) * 2 * Math.PI * inner)
    : "";
  return `
    <svg class="money-rings" viewBox="0 0 100 100" role="img"
      aria-label="Budget left this week${goal ? " and savings goal" : ""}">
      <circle class="money-left-track" cx="50" cy="50" r="${outer}"/>
      ${ringArc("money-left-ring", outer, 0, leftShare * 2 * Math.PI * outer)}
      ${goalRing}
      ${ringTextHtml(week, goal, today)}
    </svg>`;
}

// Sun–Sat: green = a spend logged, gold = a no-spend day, outlined = not logged.
// Same dots as the Exercise card (.session-dot), plus a gold no-spend kind.
function moneyDotsHtml(events, today) {
  const week = weekStart(today);
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const date = shiftDate(week, i);
    const logs = events.filter(e => isMoneyLog(e) && e.date === date);
    const kind = logs.some(e => e.activity === "no-spend") ? "no-spend" : logs.length ? "done" : "";
    const classes = ["session-dot", kind, date === today ? "today" : ""].join(" ").trim();
    return `<div><span class="${classes}"></span>${dayLabel(date, { weekday: "narrow" })}</div>`;
  }).join("");
  const logged = moneyWeek(events, week).loggedDays;
  return `<div class="session-days" role="img" aria-label="${logged} days logged this week">${days}</div>`;
}

function moneyTopHtml(events, today) {
  return `<div class="money-top">${moneyRingsSvg(events, today)}${moneyDotsHtml(events, today)}</div>`;
}
