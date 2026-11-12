// Renders money.html: the Money level beside the rings (money-rings.js), the bar
// (today logged + the payout this week is on track for), Log a spend, This week
// (budget, spent, left, by category) and Savings (goal + deposits).
// The event shapes are listed in scoring.js under "Money".

const MAX_DOLLARS = 100000; // anything bigger is a typo

// "8.50" or "$8.50" → 850. null if it isn't a positive amount.
function parseCents(text) {
  const value = Number(text.trim().replace(/^\$/, ""));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_DOLLARS) return null;
  return Math.round(value * 100);
}

function isNoSpendOn(date) {
  return e => e.activity === "no-spend" && e.date === date;
}

function categoryName(id) {
  return MONEY.categories.find(c => c.id === id)?.name ?? id;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

// Removes one event equal to `event` (the copy the page was drawn from).
// JSON.stringify turns both into text, so two separate copies can be compared.
function removeEvent(event) {
  const events = loadEvents();
  const key = JSON.stringify(event);
  const index = events.findIndex(e => JSON.stringify(e) === key);
  if (index === -1) return;
  saveEvents(events.filter((_, i) => i !== index));
  render();
}

// A list row: text on the left, a small × that removes the event on the right.
function removableRow(text, event) {
  const row = document.createElement("li");
  row.className = "money-row";
  const remove = document.createElement("button");
  remove.className = "money-remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove " + text);
  remove.addEventListener("click", () => removeEvent(event));
  row.append(text, remove);
  return row;
}

// "Left" … "$56.50"
function valueRow(label, value) {
  const row = document.createElement("li");
  row.className = "money-row";
  const amount = document.createElement("span");
  amount.textContent = value;
  row.append(label, amount);
  return row;
}

function heading(text, sub) {
  const h2 = document.createElement("h2");
  h2.textContent = text;
  const span = document.createElement("span");
  span.className = "muted";
  span.textContent = sub;
  h2.append(span);
  return h2;
}

function mutedLine(text) {
  const p = document.createElement("p");
  p.className = "muted money-hint";
  p.textContent = text;
  return p;
}

// A small form: an optional name box, an amount box and a button. onSave gets (cents, name).
// It's a real <form>, so Enter saves too; preventDefault stops the browser reloading the page.
function amountForm({ button, cents = null, name = null, onSave }) {
  const form = document.createElement("form");
  form.className = "money-form";
  const nameInput = name === null ? null : Object.assign(document.createElement("input"), {
    className: "money-input", value: name, maxLength: 40, placeholder: "Goal, e.g. Emergency fund",
  });
  const amountInput = Object.assign(document.createElement("input"), {
    className: "money-input", inputMode: "decimal", placeholder: "$0.00",
    value: cents === null ? "" : (cents / 100).toFixed(2),
  });
  amountInput.setAttribute("aria-label", button + " amount");
  const save = Object.assign(document.createElement("button"), { className: "filter-button", textContent: button });
  const error = Object.assign(document.createElement("p"), { className: "money-error", hidden: true });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = parseCents(amountInput.value);
    const label = nameInput ? nameInput.value.trim() : "";
    if (nameInput && !label) return showError(error, "Give it a name");
    if (value === null) return showError(error, "Type an amount, like 25.00");
    onSave(value, label);
  });
  form.append(...[nameInput, amountInput, save].filter(Boolean), error);
  return form;
}

// A form folded away under a link-like summary ("Change budget").
function foldedForm(summaryText, form) {
  const fold = document.createElement("details");
  fold.className = "money-fold";
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  fold.append(summary, form);
  return fold;
}

// ---- Log a spend ----

const MAX_DAYS_BACK = 7; // the Log card can go back this far, to fix or fill in a day

// The day the Log card is showing, and the spend being edited on it (if any).
// Page state only: a reload goes back to today.
let logDate = todayString();
let editing = null;

function showDay(date) {
  logDate = date;
  editing = null;
  document.getElementById("amount").value = "";
  showError(document.getElementById("log-error"), "");
  render();
}

function stepDay(step) {
  const today = todayString();
  const next = shiftDate(logDate, step);
  if (next > today || daysBetween(next, today) > MAX_DAYS_BACK) return;
  showDay(next);
}

// Saves a spend on the shown day. If one is being edited, it takes that spend's place.
function addSpend(category) {
  const input = document.getElementById("amount");
  const error = document.getElementById("log-error");
  const cents = parseCents(input.value);
  if (cents === null) {
    showError(error, "Type the amount first, like 8.50");
    input.focus();
    return;
  }
  const spend = { date: logDate, activity: "spend", cents, category };
  const key = JSON.stringify(editing);
  const events = loadEvents();
  const editIndex = editing ? events.findIndex(e => JSON.stringify(e) === key) : -1;
  // A spend means the day isn't a no-spend day any more.
  const kept = events.filter(e => !isNoSpendOn(logDate)(e));
  saveEvents(editIndex === -1
    ? [...kept, spend]
    : kept.map(e => (JSON.stringify(e) === key ? spend : e)));
  input.value = "";
  editing = null;
  showError(error, "");
  render();
}

function toggleNoSpend() {
  const events = loadEvents();
  const isSet = events.some(isNoSpendOn(logDate));
  saveEvents(isSet
    ? events.filter(e => !isNoSpendOn(logDate)(e))
    : [...events, { date: logDate, activity: "no-spend" }]);
  render();
}

// Tap a spend to edit it: its amount fills the box and its chip lights up. Tap again to cancel.
function editSpend(spend) {
  editing = editing && JSON.stringify(editing) === JSON.stringify(spend) ? null : spend;
  document.getElementById("amount").value = editing ? (spend.cents / 100).toFixed(2) : "";
  render();
}

// The category chips and the no-spend button are made once; tapping a chip saves.
function setupLog() {
  const chips = MONEY.categories.map(category => {
    const chip = Object.assign(document.createElement("button"),
      { type: "button", className: "filter-button", textContent: category.name });
    chip.dataset.category = category.id;
    chip.addEventListener("click", () => addSpend(category.id));
    return chip;
  });
  document.getElementById("categories").replaceChildren(...chips);
  document.getElementById("no-spend").addEventListener("click", toggleNoSpend);
  document.getElementById("day-prev").addEventListener("click", () => stepDay(-1));
  document.getElementById("day-next").addEventListener("click", () => stepDay(1));
}

function spendRow(spend) {
  const row = removableRow("", spend);
  const open = Object.assign(document.createElement("button"), {
    type: "button", className: "row-tap",
    textContent: `${dollars(spend.cents)} · ${categoryName(spend.category)}`,
  });
  open.setAttribute("aria-label", "Edit " + open.textContent);
  open.addEventListener("click", () => editSpend(spend));
  row.prepend(open);
  return row;
}

function drawLog(events, today) {
  const spends = events.filter(e => isSpend(e) && e.date === logDate);
  const noSpend = events.some(isNoSpendOn(logDate));
  const label = logDate === today ? dayLabel(logDate) : dayLabel(logDate) + " (earlier)";
  document.getElementById("log-date").textContent = label;
  document.getElementById("day-prev").disabled = daysBetween(logDate, today) >= MAX_DAYS_BACK;
  document.getElementById("day-next").disabled = logDate >= today;
  document.getElementById("today-list").replaceChildren(...spends.map(spendRow));
  document.querySelectorAll("#categories .filter-button").forEach(chip => {
    const lit = editing !== null && chip.dataset.category === editing.category;
    chip.setAttribute("aria-pressed", String(lit));
  });
  const button = document.getElementById("no-spend");
  button.hidden = spends.length > 0;
  const day = logDate === today ? "today" : "this day";
  button.textContent = noSpend ? `✓ No spend ${day}` : `No spend ${day}`;
  button.setAttribute("aria-pressed", String(noSpend));
}

// "🔥 12 days logged · ★ 2 no-spend this month": any logged day counts, one missed day pauses.
function drawStreak(events, today) {
  const streak = dayStreak(moneyLogDays(events));
  const stars = noSpendDaysInMonth(events, today.slice(0, 7));
  const line = document.getElementById("streak-line");
  const parts = [];
  if (streak.days > 0) {
    const word = streak.days === 1 ? "day" : "days";
    parts.push(`🔥 ${streak.days} ${word} logged${streak.paused ? " (paused)" : ""}`);
  }
  if (stars > 0) parts.push(`★ ${stars} no-spend this month`);
  line.textContent = parts.join(" · ");
  line.hidden = parts.length === 0;
}

// ---- This week: budget, spent, left ----

// Changing the budget again this week edits this week's; otherwise it starts this week.
function setBudget(cents) {
  const today = todayString();
  const events = loadEvents();
  const thisWeeks = events.find(e => e.activity === "budget" && e.date >= weekStart(today));
  saveEvents(thisWeeks
    ? events.map(e => (e === thisWeeks ? { ...e, cents } : e))
    : [...events, { date: today, activity: "budget", cents }]);
  render();
}

function payoutHint(week) {
  const need = MONEY.payoutMinDays - week.loggedDays;
  if (need > 0) {
    return `On track for ${week.onTrack} XP · log ${need} more day${need === 1 ? "" : "s"} to bank it`;
  }
  return `On track for ${week.onTrack} XP · banked after Saturday`;
}

// "Food out $20.00" for each category spent on this week, biggest first.
function categoryRows(events, week) {
  const spends = events.filter(e => isSpend(e) && e.date >= week && e.date < shiftDate(week, 7));
  return MONEY.categories
    .map(c => ({ name: c.name, cents: sumCents(spends.filter(e => e.category === c.id)) }))
    .filter(c => c.cents > 0)
    .sort((a, b) => b.cents - a.cents)
    .map(c => valueRow(c.name, dollars(c.cents)));
}

function drawWeek(events, today) {
  const start = weekStart(today);
  const week = moneyWeek(events, start);
  const range = { month: "short", day: "numeric" };
  const title = heading("This week", `${dayLabel(start, range)}–${dayLabel(shiftDate(start, 6), range)}`);
  const card = document.getElementById("week");
  if (week.budget === null) {
    card.replaceChildren(title, mutedLine("Set a weekly budget to see what's left and earn the payout."),
      amountForm({ button: "Set budget", onSave: setBudget }));
    return;
  }
  const totals = document.createElement("ul");
  totals.className = "plain-list";
  totals.append(valueRow("Budget", dollars(week.budget)), valueRow("Spent", dollars(week.spent)),
    valueRow("Left", dollars(week.left)));
  const byCategory = document.createElement("ul");
  byCategory.className = "plain-list money-categories";
  byCategory.append(...categoryRows(events, start));
  card.replaceChildren(title, totals, byCategory, mutedLine(payoutHint(week)),
    foldedForm("Change budget", amountForm({ button: "Save", cents: week.budget, onSave: setBudget })));
}

// ---- Savings: goal and deposits ----

// Editing a goal you haven't reached keeps its start date, so its deposits still count.
// Once a goal is reached, saving starts a new one from today.
function saveGoal(cents, name) {
  const events = loadEvents();
  const goal = currentGoal(events);
  if (goal && !goal.reached) {
    const index = events.findLastIndex(e => e.activity === "savings-goal" && e.date === goal.date);
    saveEvents(events.map((e, i) => (i === index ? { ...e, name, cents } : e)));
  } else {
    saveEvents([...events, { date: todayString(), activity: "savings-goal", name, cents }]);
  }
  render();
}

function addDeposit(cents) {
  saveEvents([...loadEvents(), { date: todayString(), activity: "deposit", cents }]);
  render();
}

function goalHtml(goal) {
  const box = document.createElement("div");
  const name = Object.assign(document.createElement("p"), { className: "money-goal", textContent: goal.name });
  const bar = document.createElement("div");
  bar.className = "hp-bar";
  const fill = Object.assign(document.createElement("div"), { className: "hp-fill money-saved-fill" });
  fill.style.width = savedPercent(goal) + "%";
  bar.append(fill);
  const status = goal.reached ? ` · ✓ reached, +${MONEY.goalXp} XP` : "";
  box.append(name, bar,
    mutedLine(`${dollars(goal.saved)} / ${dollars(goal.cents)} · ${savedPercent(goal)}%${status}`));
  return box;
}

function drawSavings(events, today) {
  const week = weekStart(today);
  const deposits = events.filter(e => isDeposit(e) && e.date >= week && e.date <= today);
  const sub = deposits.length ? "deposit XP earned this week" : `+${MONEY.depositXp} for this week's first deposit`;
  const goal = currentGoal(events);
  const goalPart = !goal
    ? [mutedLine("Pick something to save for."), amountForm({ button: "Set goal", name: "", onSave: saveGoal })]
    : [goalHtml(goal), foldedForm(goal.reached ? "Start a new goal" : "Edit goal", goal.reached
      ? amountForm({ button: "Set goal", name: "", onSave: saveGoal })
      : amountForm({ button: "Save", name: goal.name, cents: goal.cents, onSave: saveGoal }))];
  const list = document.createElement("ul");
  list.className = "plain-list";
  list.append(...deposits.map(d => removableRow(`${dollars(d.cents)} · ${dayLabel(d.date)}`, d)));
  document.getElementById("savings").replaceChildren(heading("Savings", sub), ...goalPart,
    amountForm({ button: "Add deposit", onSave: addDeposit }), list);
}

function render() {
  const events = loadEvents();
  const today = todayString();
  const xp = xpByBranch(events)[MONEY.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Money", levelInfo(xp, 1));
  document.getElementById("money-top").innerHTML = moneyTopHtml(events, today);

  // The bar mixes today (logged or not) with the payout this week is on track for.
  const parts = moneyParts(events, today);
  const core = parts.today.core + parts.week.core;
  const extra = parts.today.extra + parts.week.extra;
  fillBar(core, extra, parts.today.goal + parts.week.goal);
  document.getElementById("progress-label").textContent =
    `${core + extra} / ${parts.today.goal + parts.week.goal} XP · logged today + payout on track`;

  drawLog(events, today);
  drawStreak(events, today);
  drawWeek(events, today);
  drawSavings(events, today);
}

setupLog();
render();
