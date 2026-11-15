// The "Edit chores" fold on chores.html. The edited list is saved as one synced config event
// ({ list, archived }, see choreListAll in score-chores.js). Ids never change on rename, so old ticks
// keep scoring; archiving only hides a chore, it never deletes history.

const CHORE_LIMITS = { xp: 500, times: 14, everyWeeks: 4 };
const CHORE_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- Pure helpers (no page needed) ----

// "Clean the car!" → "clean-the-car", then -2, -3… until no chore already uses it.
function choreIdFor(name, takenIds) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "chore";
  const free = n => !takenIds.includes(n === 1 ? base : `${base}-${n}`);
  let n = 1;
  while (!free(n)) n += 1;
  return n === 1 ? base : `${base}-${n}`;
}

const clampWhole = (value, max) => Math.min(Math.max(Math.round(Number(value)) || 1, 1), max);

// A chore from the form's raw fields, keeping what the form doesn't edit (id, short label).
// times and everyWeeks of 1 are the default, so they are left out; so is an empty hint.
function choreFromFields(base, fields) {
  const { short, id } = base;
  return {
    id,
    name: fields.name.trim() || base.name,
    ...(short ? { short } : {}),
    xp: clampWhole(fields.xp, CHORE_LIMITS.xp),
    ...(clampWhole(fields.times, CHORE_LIMITS.times) > 1 ? { times: clampWhole(fields.times, CHORE_LIMITS.times) } : {}),
    ...(clampWhole(fields.everyWeeks, CHORE_LIMITS.everyWeeks) > 1 ? { everyWeeks: clampWhole(fields.everyWeeks, CHORE_LIMITS.everyWeeks) } : {}),
    ...(CHORE_DAYS.includes(fields.hint) ? { hint: fields.hint } : {}),
  };
}

// events with the "chores" config event set to { list, archived } (one event, later `at` wins).
function withChoresConfig(events, list, archived) {
  const old = events.find(e => e.activity === "config" && e.key === "chores");
  const next = { ...old, date: todayString(), activity: "config", key: "chores", value: { list, archived }, at: Date.now() };
  return old ? events.map(e => (e === old ? next : e)) : [...events, next];
}

// ---- The editor on the page ----

function saveChores(events, list, archived, message) {
  const undo = commitWithUndo(all => withChoresConfig(all, list, archived));
  render();
  drawChoreEditor();
  showUndo(message, undo, () => { render(); drawChoreEditor(); });
}

function choreField(label, input) {
  const wrap = document.createElement("label");
  wrap.className = "chore-field";
  const text = document.createElement("span");
  text.textContent = label;
  wrap.append(text, input);
  return wrap;
}

function choreInput(type, name, value, attrs = {}) {
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.value = value;
  Object.entries(attrs).forEach(([k, v]) => input.setAttribute(k, v));
  return input;
}

function choreDaySelect(current) {
  const select = document.createElement("select");
  select.name = "hint";
  ["", ...CHORE_DAYS].forEach(day => select.append(new Option(day || "none", day, false, day === (current ?? ""))));
  return select;
}

function choreButton(text, onClick, type = "button") {
  const button = document.createElement("button");
  button.type = type;
  button.className = "chore-btn";
  button.textContent = text;
  if (onClick) button.addEventListener("click", onClick);
  return button;
}

function choreEditRow(chore) {
  const form = document.createElement("form");
  form.className = "chore-edit-row";
  const number = (name, value, max) => choreInput("number", name, value, { min: 1, max, inputmode: "numeric" });
  form.append(
    choreField("Name", choreInput("text", "name", chore.name, { maxlength: 40, required: "" })),
    choreField("XP", number("xp", chore.xp, CHORE_LIMITS.xp)),
    choreField("Times a week", number("times", chore.times ?? 1, CHORE_LIMITS.times)),
    choreField("Every N weeks", number("everyWeeks", chore.everyWeeks ?? 1, CHORE_LIMITS.everyWeeks)),
    choreField("Usual day", choreDaySelect(chore.hint)),
  );
  const actions = document.createElement("div");
  actions.className = "chore-actions";
  actions.append(choreButton("Save", null, "submit"), choreButton("Archive", () => archiveChore(chore.id)));
  form.append(actions);
  form.addEventListener("submit", event => {
    event.preventDefault();
    saveEditedChore(chore, Object.fromEntries(new FormData(form)));
  });
  return form;
}

function saveEditedChore(chore, fields) {
  const events = loadEvents();
  const edited = choreFromFields(chore, fields);
  const list = choreListAll(events).map(c => (c.id === chore.id ? edited : c));
  saveChores(events, list, choreArchivedIds(events), `${edited.name} saved`);
}

function archiveChore(choreId) {
  const events = loadEvents();
  const name = choreListAll(events).find(c => c.id === choreId).name;
  saveChores(events, choreListAll(events), [...choreArchivedIds(events), choreId], `${name} archived`);
}

function restoreChore(choreId) {
  const events = loadEvents();
  const name = choreListAll(events).find(c => c.id === choreId).name;
  saveChores(events, choreListAll(events), choreArchivedIds(events).filter(id => id !== choreId), `${name} restored`);
}

function addNewChore(name) {
  const events = loadEvents();
  const all = choreListAll(events);
  const fresh = choreFromFields({ id: choreIdFor(name, all.map(c => c.id)), name }, { name, xp: 10, times: 1, everyWeeks: 1, hint: "" });
  saveChores(events, [...all, fresh], choreArchivedIds(events), `${fresh.name} added`);
}

function choreAddForm() {
  const form = document.createElement("form");
  form.className = "chore-add";
  form.append(choreInput("text", "name", "", { maxlength: 40, placeholder: "New chore", "aria-label": "New chore name", required: "" }), choreButton("Add", null, "submit"));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = new FormData(form).get("name").trim();
    if (name) addNewChore(name);
  });
  return form;
}

function archivedRow(chore) {
  const row = document.createElement("div");
  row.className = "chore-archived";
  const name = document.createElement("span");
  name.textContent = chore.name;
  row.append(name, choreButton("Restore", () => restoreChore(chore.id)));
  return row;
}

function drawChoreEditor() {
  const events = loadEvents();
  const archived = choreArchivedIds(events);
  const all = choreListAll(events);
  const heading = text => Object.assign(document.createElement("h3"), { textContent: text });
  const parts = [
    ...all.filter(c => !archived.includes(c.id)).map(choreEditRow),
    choreAddForm(),
    ...(archived.length > 0 ? [heading("Archived"), ...all.filter(c => archived.includes(c.id)).map(archivedRow)] : []),
  ];
  document.getElementById("chore-editor-body").replaceChildren(...parts);
}

if (typeof document !== "undefined" && document.getElementById("chore-editor-body")) drawChoreEditor();
