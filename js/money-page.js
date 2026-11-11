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

function addSpend(category) {
  const input = document.getElementById("amount");
  const error = document.getElementById("log-error");
  const cents = parseCents(input.value);
  if (cents === null) {
    showError(error, "Type the amount first, like 8.50");
    input.focus();
    return;
  }
  const today = todayString();
  // A spend means today isn't a no-spend day any more.
  const events = loadEvents().filter(e => !isNoSpendOn(today)(e));
  saveEvents([...events, { date: today, activity: "spend", cents, category }]);
  input.value = "";
  showError(error, "");
  render();
}

function toggleNoSpend() {
  const today = todayString();
  const events = loadEvents();
  const isSet = events.some(isNoSpendOn(today));
  saveEvents(isSet
    ? events.filter(e => !isNoSpendOn(today)(e))
    : [...events, { date: today, activity: "no-spend" }]);
  render();
}

// The category chips and the no-spend button are made once; tapping a chip saves.
function setupLog() {
  const chips = MONEY.categories.map(category => {
    const chip = Object.assign(document.createElement("button"),
      { type: "button", className: "filter-button", textContent: category.name });
    chip.addEventListener("click", () => addSpend(category.id));
    return chip;
  });
  document.getElementById("categories").replaceChildren(...chips);
  document.getElementById("no-spend").addEventListener("click", toggleNoSpend);
}

function drawLog(events, today) {
  const spends = events.filter(e => isSpend(e) && e.date === today);
  const noSpend = events.some(isNoSpendOn(today));
  document.getElementById("log-date").textContent = dayLabel(today);
  document.getElementById("today-list").replaceChildren(...spends.map(spend =>
    removableRow(`${dollars(spend.cents)} · ${categoryName(spend.category)}`, spend)));
  const button = document.getElementById("no-spend");
  button.hidden = spends.length > 0;
  button.textContent = noSpend ? "✓ No spend today" : "No spend today";
  button.setAttribute("aria-pressed", String(noSpend));
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
  drawWeek(events, today);
  drawSavings(events, today);
}

setupLog();
render();
