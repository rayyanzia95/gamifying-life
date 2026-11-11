// Renders people.html: the People level beside the Lahore clock (people-clock.js),
// the bar (checked in today + calls home this week), Keep in touch (a row per person
// with Call / Text / Visit) and Dates (birthdays and the anniversary).
// Names and dates are typed in here and saved as events on this device only.
// The event shapes are listed in scoring.js under "People".

const MAX_NAME_LENGTH = 40;
const CLOCK_REFRESH_MS = 60 * 1000;
const KIND_VERBS = { call: "called", text: "texted", visit: "visited" };

function button(text, onClick, pressed = null) {
  const b = Object.assign(document.createElement("button"),
    { type: "button", className: "filter-button", textContent: text });
  if (pressed !== null) b.setAttribute("aria-pressed", String(pressed));
  b.addEventListener("click", onClick);
  return b;
}

function textInput(placeholder) {
  const input = Object.assign(document.createElement("input"),
    { className: "money-input", maxLength: MAX_NAME_LENGTH, placeholder });
  input.setAttribute("aria-label", placeholder);
  return input;
}

function errorLine() {
  return Object.assign(document.createElement("p"), { className: "people-error", hidden: true });
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function heading(text, sub) {
  const h2 = document.createElement("h2");
  h2.textContent = text;
  const span = Object.assign(document.createElement("span"), { className: "muted", textContent: sub });
  h2.append(span);
  return h2;
}

// A small × that removes something, labelled for screen readers.
function removeButton(what, onClick) {
  const b = Object.assign(document.createElement("button"),
    { type: "button", className: "money-remove", textContent: "×" });
  b.setAttribute("aria-label", "Remove " + what);
  b.addEventListener("click", onClick);
  return b;
}

function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ---- Keep in touch ----

// "texted today", "called yesterday", "visited 12 days ago", or "not yet".
function lastLabel(contact, today) {
  if (!contact) return "not yet";
  const days = daysBetween(contact.date, today);
  const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return `${KIND_VERBS[contact.kind]} ${when}`;
}

// One tap logs a call/text/visit for today; tapping it again takes it back.
function toggleContact(person, kind) {
  const today = todayString();
  const events = loadEvents();
  const matches = e => isContact(e) && e.date === today && e.name === person.name && e.kind === kind;
  const last = events.findLastIndex(matches);
  saveEvents(last === -1
    ? [...events, { date: today, activity: "contact", name: person.name, group: person.group, kind }]
    : events.filter((_, i) => i !== last));
  render();
}

function personRow(person, events, today) {
  const row = Object.assign(document.createElement("li"), { className: "people-row" });
  const who = Object.assign(document.createElement("div"), { className: "people-who", textContent: person.name });
  const last = Object.assign(document.createElement("small"),
    { textContent: lastLabel(lastContact(events, person.name), today) });
  who.append(last);
  const group = PEOPLE.groups.find(g => g.id === person.group);
  const kinds = PEOPLE.kinds.filter(kind => kind.id !== "visit" || group?.visits);
  const buttons = kinds.map(kind => {
    const done = events.some(e => isContact(e) && e.date === today &&
      e.name === person.name && e.kind === kind.id);
    return button(done ? `${kind.name} ✓` : kind.name, () => toggleContact(person, kind.id), done);
  });
  row.append(who, ...buttons);
  return row;
}

function addPerson(name, group, error) {
  const clean = name.trim();
  if (!clean) return showError(error, "Type a name first");
  const events = loadEvents();
  if (peopleList(events).some(p => sameName(p.name, clean))) {
    return showError(error, `${clean} is already on the list`);
  }
  saveEvents([...events, { date: todayString(), activity: "person", name: clean, group }]);
  render();
}

// Removing someone drops them from the list; their past calls and texts keep their XP.
function removePerson(name) {
  saveEvents(loadEvents().filter(e => !(e.activity === "person" && e.name === name)));
  render();
}

// "Add or remove people": type a name, then tap a group to save.
function manageFold(people) {
  const fold = Object.assign(document.createElement("details"), { className: "money-fold" });
  const summary = Object.assign(document.createElement("summary"), { textContent: "Add or remove people" });
  const input = textInput("Name");
  const error = errorLine();
  const chips = Object.assign(document.createElement("div"), { className: "filters" });
  chips.append(...PEOPLE.groups.map(group => button(group.name, () => addPerson(input.value, group.id, error))));
  const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
  list.append(...people.map(person => {
    const li = Object.assign(document.createElement("li"), { className: "money-row" });
    li.append(person.name, removeButton(person.name, () => removePerson(person.name)));
    return li;
  }));
  const form = Object.assign(document.createElement("div"), { className: "people-form" });
  form.append(input, chips, error);
  fold.append(summary, form, list);
  return fold;
}

function drawPeople(events, today) {
  const people = peopleList(events);
  const parts = [heading("Keep in touch", dayLabel(today))];
  if (people.length === 0) {
    parts.push(Object.assign(document.createElement("p"),
      { className: "muted", textContent: "Add the people you want to keep in touch with." }));
  }
  for (const group of PEOPLE.groups) {
    const inGroup = people.filter(p => p.group === group.id);
    if (inGroup.length === 0) continue;
    const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
    list.append(...inGroup.map(p => personRow(p, events, today)));
    parts.push(Object.assign(document.createElement("p"), { className: "people-group", textContent: group.name }), list);
  }
  parts.push(manageFold(people));
  document.getElementById("people").replaceChildren(...parts);
}

// ---- Dates ----

function toggleWished(upcoming) {
  const events = loadEvents();
  const matches = e => isWished(e) && e.label === upcoming.label && e.on === upcoming.on;
  saveEvents(events.some(matches)
    ? events.filter(e => !matches(e))
    : [...events, { date: todayString(), activity: "wished", label: upcoming.label, on: upcoming.on }]);
  render();
}

function removeDate(label) {
  saveEvents(loadEvents().filter(e => !(e.activity === "people-date" && e.label === label)));
  render();
}

// The date picker gives "2026-12-04"; only the month and day are kept, so it repeats every year.
function addDate(label, value, kind, error) {
  const clean = label.trim();
  if (!clean) return showError(error, "Say whose or what, like Ammi's birthday");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return showError(error, "Pick the date");
  const events = loadEvents();
  if (events.some(e => e.activity === "people-date" && sameName(e.label, clean))) {
    return showError(error, `${clean} is already there`);
  }
  saveEvents([...events, { date: todayString(), activity: "people-date", label: clean, kind, day: value.slice(5) }]);
  render();
}

function dateRow(upcoming, events, today) {
  const row = Object.assign(document.createElement("li"), { className: "people-row" });
  const who = Object.assign(document.createElement("div"), { className: "people-who", textContent: upcoming.label });
  const when = `${dayLabel(upcoming.on, { month: "short", day: "numeric" })} · ${countdownLabel(today, upcoming.on)}`;
  who.append(Object.assign(document.createElement("small"), { textContent: when }));
  row.append(who);
  if (upcoming.days <= PEOPLE.wishWindowDays) {
    const done = events.some(e => isWished(e) && e.label === upcoming.label && e.on === upcoming.on);
    row.append(button(done ? "Wished ✓" : "Wished / gift done", () => toggleWished(upcoming), done));
  }
  row.append(removeButton(upcoming.label, () => removeDate(upcoming.label)));
  return row;
}

// "Add a date": type whose/what, pick the date, then tap Birthday / Anniversary / Other.
function dateForm() {
  const form = Object.assign(document.createElement("div"), { className: "people-form" });
  const label = textInput("Whose / what");
  const day = Object.assign(document.createElement("input"), { className: "money-input", type: "date" });
  day.setAttribute("aria-label", "Date");
  const error = errorLine();
  const chips = Object.assign(document.createElement("div"), { className: "filters" });
  chips.append(...PEOPLE.dateKinds.map(kind =>
    button(kind.name, () => addDate(label.value, day.value, kind.id, error))));
  form.append(label, day, chips, error);
  return form;
}

function drawDates(events, today) {
  const dates = upcomingDates(events, today);
  const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
  list.append(...dates.map(d => dateRow(d, events, today)));
  const fold = Object.assign(document.createElement("details"), { className: "money-fold" });
  fold.append(Object.assign(document.createElement("summary"), { textContent: "Add a date" }), dateForm());
  if (dates.length === 0) fold.open = true;
  document.getElementById("dates").replaceChildren(heading("Dates", "soonest first"), list, fold);
}

// ---- Page ----

function drawClock() {
  document.getElementById("people-clock").innerHTML = homeClockHtml(new Date());
}

function render() {
  const events = loadEvents();
  const today = todayString();
  const xp = xpByBranch(events)[PEOPLE.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("People", levelInfo(xp, 1));
  drawClock();

  // The bar mixes today (checked in or not) with this week's calls home.
  const parts = peopleParts(events, today);
  const core = parts.today.core + parts.week.core;
  const extra = parts.today.extra + parts.week.extra;
  const goal = parts.today.goal + parts.week.goal;
  fillBar(core, extra, goal);
  document.getElementById("progress-label").textContent =
    `${core + extra} / ${goal} XP · checked in today + ${parts.week.count} / ${PEOPLE.callsHomePerWeek} calls home`;

  drawPeople(events, today);
  drawDates(events, today);
}

render();
setInterval(drawClock, CLOCK_REFRESH_MS);
