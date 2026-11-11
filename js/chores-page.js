// Renders chores.html: the Chores level, this week's bar and the list of quests.
// A tick is saved as { date, activity: "chore", chore: "dishes" }, one event per time done.

function addChore(choreId) {
  saveEvents([...loadEvents(), { date: todayString(), activity: "chore", chore: choreId }]);
  render();
}

// Undo this week's latest tick of a chore. findLast searches from the end of the array.
function removeChore(choreId) {
  const events = loadEvents();
  const week = weekStart(todayString());
  const last = events.findLast(e => isChore(e, choreId) && e.date >= week);
  if (!last) return;
  saveEvents(events.filter(e => e !== last));
  render();
}

// Today as a short weekday, e.g. "Fri", to compare with the hints in CHORES.
function todayShortDay() {
  return new Date().toLocaleDateString("en-US", { weekday: "short" });
}

// An every-two-weeks chore that last week's tick still covers.
function coveredByLastWeek(events, chore, week, countThisWeek) {
  return Boolean(chore.everyWeeks) && countThisWeek === 0 && choreDueThisWeek(events, chore, week) === 0;
}

// The faint note on the right: "done last week", "today", "usually Fri", "due" or nothing.
function choreNote(events, chore, week, countThisWeek) {
  if (coveredByLastWeek(events, chore, week, countThisWeek)) return "done last week";
  const left = choreLeftThisWeek(events, chore, week);
  if (chore.hint) return left > 0 && chore.hint === todayShortDay() ? "today" : "usually " + chore.hint;
  if (chore.everyWeeks && left > 0) return "due";
  return "";
}

// A counter for chores done several times a week, a tick for the rest.
function choreControl(events, chore, week, countThisWeek) {
  if (coveredByLastWeek(events, chore, week, countThisWeek)) {
    return document.createTextNode("✓ " + chore.name);
  }
  if (choreTarget(chore) > 1) {
    const onStep = delta => (delta > 0 ? addChore(chore.id) : removeChore(chore.id));
    return makeStepper(chore.name, countThisWeek, Infinity, onStep,
      { step: 1, target: choreTarget(chore), unit: chore.name.toLowerCase() });
  }
  const isDone = countThisWeek > 0;
  return makeCheckbox(chore.name, isDone, () => (isDone ? removeChore(chore.id) : addChore(chore.id)));
}

function drawQuests(events, week) {
  const rows = CHORES.list.map(chore => {
    const countThisWeek = choreCount(events, chore.id, week, shiftDate(week, 7));
    const note = document.createElement("span");
    note.className = "muted";
    note.textContent = choreNote(events, chore, week, countThisWeek);

    const row = document.createElement("li");
    row.className = "quest";
    row.append(choreControl(events, chore, week, countThisWeek), note);
    return row;
  });
  document.getElementById("quests").replaceChildren(...rows);
}

function drawWeekBar({ core, extra, goal, done }) {
  const corePercent = Math.min((core / goal) * 100, 100);
  const bonusPercent = Math.min((extra / goal) * 100, 100 - corePercent);
  document.getElementById("bar-fill").style.width = corePercent + "%";
  document.getElementById("bonus-fill").style.width = bonusPercent + "%";
  document.getElementById("progress-label").textContent = `${core + extra} / ${goal} XP this week`;

  const fullWeek = done
    ? `Full week done: +${CHORES.weekBonus} bonus`
    : `Every quest done this week: +${CHORES.weekBonus} bonus`;
  const included = extra > 0 ? ` · includes ${extra} bonus XP` : "";
  document.getElementById("bonus").textContent = fullWeek + included;
}

function render() {
  const events = loadEvents();
  const week = weekStart(todayString());
  const xp = xpByBranch(events)[CHORES.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Chores", levelInfo(xp, 1));
  drawWeekBar(choreWeek(events, week));
  drawQuests(events, week);
}

render();
