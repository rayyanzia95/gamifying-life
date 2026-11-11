// Deadline rows with a tick, shared by academics.html (This week) and planner.html
// (the Day sidebar and the Deadlines tab). Each page defines its own render(),
// which a tick calls to redraw.
// A tick is one event dated the day you ticked it: { date, activity: "deadline", deadline: id }

// Tick: add an event dated today. Untick: remove every tick for that deadline.
function toggleDeadline(id) {
  const events = loadEvents();
  const isTicked = events.some(e => isDeadlineTick(e) && e.deadline === id);
  saveEvents(isTicked
    ? events.filter(e => !(isDeadlineTick(e) && e.deadline === id))
    : [...events, { date: todayString(), activity: "deadline", deadline: id }]);
  render();
}

// The tick + title + kind on the left, the time on the right, a note underneath.
// withDate puts the day before the time ("Mon, Nov 16 · 5:00 p.m."), for lists
// that span several days.
function deadlineRow(deadline, ticked, { withDate = false } = {}) {
  const id = deadlineId(deadline);
  const isDone = ticked.has(id);
  const label = makeCheckbox(`${courseShort(deadline.course)} ${deadline.title}`,
    isDone, () => toggleDeadline(id));
  if (isDone) label.classList.add("done");
  const kind = document.createElement("span");
  kind.className = "kind-tag";
  kind.textContent = deadline.kind;
  label.append(kind);

  const when = document.createElement("span");
  when.className = "muted deadline-when";
  when.textContent = withDate ? `${dayLabel(deadline.date)} · ${deadline.time}` : deadline.time;

  const line = document.createElement("div");
  line.className = "quest";
  line.append(label, when);
  const row = document.createElement("li");
  row.append(line);
  if (deadline.note) {
    const note = document.createElement("div");
    note.className = "muted deadline-note";
    note.textContent = deadline.note;
    row.append(note);
  }
  return row;
}

// A titled list of deadline rows, or a quiet line when there are none.
function deadlineSection(title, deadlines, ticked, { withDate = false, empty = "Nothing due" } = {}) {
  const heading = document.createElement("h3");
  heading.className = "list-heading";
  heading.textContent = title;
  const count = document.createElement("span");
  count.className = "muted";
  count.textContent = String(deadlines.length);
  heading.append(count);
  if (deadlines.length === 0) {
    const none = document.createElement("p");
    none.className = "muted";
    none.textContent = empty;
    return [heading, none];
  }
  const list = document.createElement("ul");
  list.className = "plain-list";
  list.append(...deadlines.map(d => deadlineRow(d, ticked, { withDate })));
  return [heading, list];
}
