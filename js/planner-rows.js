// Flat list rows for planner.html, like the old Planner: time · tick · title + note,
// with a course-coloured left edge. One builder for both kinds of row:
//   planBlockRow  a scheduled block (class, break, study, chore, MSA, flex, exam)
//   planDeadlineRow  a Canvas deadline (Due this day, Next 7 days, Deadlines tab)
// The ticking itself lives in planner-page.js (blocks) and deadline-list.js (deadlines).
// Only config text goes into these rows, set with textContent, never anything typed in.

const TICKABLE_KINDS = ["study", "chore", "msa"];
const isTickable = block => TICKABLE_KINDS.includes(block.kind);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// The tick box is the app's own (makeCheckbox), so Settings → Ticks restyles it.
function planTickBox(label, checked, onChange, disabled = false) {
  const box = makeCheckbox("", checked, onChange);
  const input = box.querySelector("input");
  input.setAttribute("aria-label", `Done: ${label}`);
  input.disabled = disabled;
  return box;
}

// time (string or a [line, line] pair) · tick (or an empty cell) · title line + note.
function planRow({ classes, time, tick, tag, title, kindTag, flag, note }) {
  const row = el("li", `pl-row ${classes}`);
  const when = el("span", "pl-tm");
  when.append(...[].concat(time).flatMap((line, i) => (i ? [document.createElement("br"), line] : [line])));
  const head = el("div", "pl-tt");
  if (tag) head.append(el("span", "pl-tag", tag));
  head.append(title);
  if (kindTag) head.append(el("span", `pl-kind ${kindTag}`, kindTag));
  if (flag) head.append(el("span", `pl-flag ${flag.className}`, flag.text));
  const body = el("div");
  body.append(head);
  if (note) body.append(el("div", "pl-dd", note));
  row.append(when, tick ?? el("span", "pl-sp"), body);
  return row;
}

const clockRange = block => `${clockLabel(block.from)}–${clockLabel(block.to)}`;

function planBlockRow(date, block, ticked, onTick) {
  const done = isTickable(block) && ticked.has(block.id);
  const tick = isTickable(block)
    ? planTickBox(block.title, done, () => onTick(block), date > todayString()) : null;
  const count = blockCount(block);
  const blocksText = block.kind === "study" ? `${count} block${count === 1 ? "" : "s"}` : "";
  const isTask = isTickable(block) || block.kind === "exam";
  return planRow({
    classes: `plan-${block.kind} ${isTask ? "pl-task " : ""}course-${block.course ?? "none"}${done ? " done" : ""}`,
    time: clockRange(block),
    tick,
    title: block.title,
    note: [block.note, blocksText].filter(Boolean).join(" · "),
  });
}

// Overdue / Today / Tomorrow / In 2 days, for anything not ticked (plain tasks only get Overdue).
function deadlineFlag(deadline, isDone, today) {
  if (isDone) return null;
  if (deadline.date < today) return { className: "over", text: "Overdue" };
  const days = Math.round((new Date(`${deadline.date}T12:00`) - new Date(`${today}T12:00`)) / 864e5);
  if (days > 2 || deadline.kind === "task") return null;
  return { className: "soon", text: ["Today", "Tomorrow", "In 2 days"][days] };
}

function planDeadlineRow(deadline, ticked, { withDate = false } = {}) {
  const id = deadlineId(deadline);
  const done = ticked.has(id);
  return planRow({
    classes: `pl-task course-${deadline.course}${done ? " done" : ""}${deadline.kind === "exam" ? " plan-exam" : ""}`,
    time: withDate ? [dayLabel(deadline.date), deadline.time] : deadline.time,
    tick: planTickBox(`${courseShort(deadline.course)} ${deadline.title}`, done, () => toggleDeadline(id)),
    tag: courseShort(deadline.course),
    title: deadline.title,
    kindTag: deadline.kind,
    flag: deadlineFlag(deadline, done, todayString()),
    note: deadline.note,
  });
}

// A titled card of rows (the old planner's "Due this day", "Next 7 days"…).
function planCard(title, count, rows, empty = "Nothing due") {
  const card = el("section", "pl-card");
  const heading = el("h3", "pl-card-head", title);
  if (count !== null) heading.append(el("span", "", String(count)));
  const list = el("ul", "plain-list pl-list");
  list.append(...rows);
  card.append(heading, rows.length > 0 ? list : el("p", "pl-empty", empty));
  return card;
}

function legendHtml() {
  const items = [...ACADEMICS.courses.map(c => [c.id, c.name]), ["chore", "Chores"], ["msa", "MSA"], ["flex", "Flex / free"]];
  return `<div class="pl-legend">${items.map(([id, name]) =>
    `<span class="course-${id}"><i></i>${name}</span>`).join("")}</div>`;
}
