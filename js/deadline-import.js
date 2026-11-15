// "Import deadlines" fold on the planner's Deadlines tab: paste one line per deadline,
// preview it (with per-line errors), then save. Parsing lives in score-academics.js.

let importDraft = "";

function importPreview(text) {
  const { rows, errors, skipped } = parseDeadlineLines(text, DEADLINES);
  const box = el("div", "import-preview");
  const list = el("ul", "plain-list");
  list.append(...rows.map(r => el("li", "", `${courseShort(r.course)} · ${r.title} · ${dayLabel(r.due)}${r.hp ? " · exam" : ""}`)),
    ...errors.map(e => el("li", "import-error", `Line ${e.line}: ${e.message}`)));
  box.append(list);
  if (skipped.length > 0) box.append(el("p", "muted", `${skipped.length} duplicate${skipped.length === 1 ? "" : "s"} skipped`));
  return { box, rows, errors };
}

function saveImport(rows) {
  const undo = commitWithUndo(events => [...events,
    ...rows.map(r => ({ date: todayString(), activity: DEADLINE_IMPORT.activity, ...r }))]);
  importDraft = "";
  render();
  showUndo(`Added ${rows.length} deadline${rows.length === 1 ? "" : "s"}`, undo, render);
}

function removeImported(id) {
  const undo = commitWithUndo(events => events.filter(e => e.id !== id));
  render();
  showUndo("Removed deadline", undo, render);
}

function importedList(events) {
  const imported = events.filter(isDeadlineImport);
  if (imported.length === 0) return [];
  const list = el("ul", "plain-list import-done");
  list.append(...imported.map(e => {
    const remove = el("button", "import-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${e.title}`);
    remove.addEventListener("click", () => removeImported(e.id));
    const row = el("li", "", `${courseShort(e.course)} · ${e.title} · ${dayLabel(e.due)}`);
    row.append(remove);
    return row;
  }));
  return [el("p", "muted", "Imported"), list];
}

function importFold(events) {
  const fold = el("details", "money-fold import-fold");
  fold.open = importDraft !== "";
  fold.append(el("summary", "", "Import deadlines"));
  const area = el("textarea", "import-text");
  area.rows = 5;
  area.value = importDraft;
  area.placeholder = "CMPUT 201, Assignment 4, 2026-12-01\nPHYS 124, Final, 2026-12-15, exam";
  const preview = el("div");
  const add = el("button", "pl-fbtn", "Add 0 deadlines");
  add.type = "button";
  let parsed = [];
  const refresh = () => {
    importDraft = area.value;
    const result = importPreview(area.value);
    parsed = result.rows;
    preview.replaceChildren(result.box);
    add.textContent = `Add ${parsed.length} deadline${parsed.length === 1 ? "" : "s"}`;
    add.disabled = parsed.length === 0;
  };
  area.addEventListener("input", refresh);
  add.addEventListener("click", () => saveImport(parsed));
  refresh();
  fold.append(area, preview, add, ...importedList(events));
  return fold;
}
