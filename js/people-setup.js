// People setup (people.html): add several people at once with a contact rhythm,
// change a rhythm, or remove someone. Person events: see score-people.js.
// Needs people-page.js helpers (button, errorLine, showError, removeButton, sameName, render).

let setupOpen = false;

function selectOf(options, value, label) {
  const select = Object.assign(document.createElement("select"), { className: "money-input" });
  select.setAttribute("aria-label", label);
  select.append(...options.map(o => Object.assign(document.createElement("option"),
    { value: o.id, textContent: o.name, selected: o.id === value })));
  return select;
}

// Names to add from a box with one name per line: trimmed, no blanks, no repeats, none already listed.
function newNames(text, existing) {
  const lines = text.split("\n").map(l => l.trim().slice(0, MAX_NAME_LENGTH)).filter(Boolean);
  return lines.filter((n, i) => !existing.some(p => sameName(p.name, n)) &&
    lines.findIndex(m => sameName(m, n)) === i);
}

function saveSetup(message, change) {
  const undo = commitWithUndo(change);
  showUndo(message, undo, render);
  render();
}

function addPeople(text, group, rhythm, error) {
  const names = newNames(text, peopleList(loadEvents()));
  if (names.length === 0) return showError(error, "Type at least one new name");
  const date = todayString();
  saveSetup(names.length === 1 ? `Added ${names[0]}` : `Added ${names.length} people`,
    events => [...events, ...names.map(name => ({ date, activity: "person", name, group, rhythm }))]);
}

// Edit = replace the event, keeping its id (and date), so the change syncs as one person.
function setRhythm(person, rhythm) {
  saveSetup(`Rhythm set for ${person.name}`, events =>
    events.map(e => (e.id === person.id ? { ...e, rhythm } : e)));
}

// Removing hides them; their past calls and texts keep their XP.
function removePerson(person) {
  saveSetup(`Removed ${person.name}`, events => events.filter(e => e.id !== person.id));
}

function setupPersonRow(person) {
  const li = Object.assign(document.createElement("li"), { className: "money-row people-setup-row" });
  const name = Object.assign(document.createElement("span"), { textContent: person.name });
  const pick = selectOf([{ id: "", name: "No rhythm" }, ...PEOPLE_RHYTHMS], person.rhythm || "", `Rhythm for ${person.name}`);
  pick.addEventListener("change", () => setRhythm(person, pick.value));
  li.append(name, pick, removeButton(person.name, () => removePerson(person)));
  return li;
}

function setupForm() {
  const names = Object.assign(document.createElement("textarea"),
    { className: "money-input people-names", placeholder: "Names, one per line" });
  names.setAttribute("aria-label", "Names, one per line");
  const group = selectOf(PEOPLE.groups, PEOPLE.groups[0].id, "Group");
  const rhythm = selectOf(PEOPLE_RHYTHMS, "weekly", "Rhythm");
  const error = errorLine();
  const add = button("Add", () => addPeople(names.value, group.value, rhythm.value, error));
  const form = Object.assign(document.createElement("div"), { className: "people-form" });
  form.append(names, group, rhythm, add, error);
  return form;
}

function setupFold(people) {
  const fold = Object.assign(document.createElement("details"), { className: "money-fold", open: setupOpen });
  fold.addEventListener("toggle", () => { setupOpen = fold.open; });
  const summary = Object.assign(document.createElement("summary"), { textContent: "Set up people" });
  const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
  list.append(...people.map(setupPersonRow));
  fold.append(summary, setupForm(), list);
  return fold;
}
