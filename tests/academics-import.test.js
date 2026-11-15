// Tests for pasted deadlines (js/score-academics.js). Run: node tests/academics-import.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
vm.runInContext(load("js/config.js") + load("js/config-academics.js") + load("js/score-academics.js") +
  "\nthis.api={parseDeadlineLines,importedDeadlines,applyImportedDeadlines,DEADLINES,REPO_DEADLINE_COUNT,DEADLINE_IMPORT};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("good lines become rows", () => {
  const r = A.parseDeadlineLines("CMPUT 201, Assignment 4, 2026-12-01\n\nphys, Lab 9, 2026-12-02");
  assert.equal(r.errors.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(r.rows)), [
    { course: "cmput", title: "Assignment 4", due: "2026-12-01", kind: "assignment" },
    { course: "phys", title: "Lab 9", due: "2026-12-02", kind: "assignment" }]);
});
ok("commas in a title stay in the title", () =>
  assert.equal(A.parseDeadlineLines("PHYS 124, Lab 9, part 2, 2026-12-02").rows[0].title, "Lab 9, part 2"));
ok("bad date is an error with its line number", () => {
  const r = A.parseDeadlineLines("PHYS 124, Lab, 2026-02-30\nPHYS 124, Lab, 12/01/2026");
  assert.equal(r.rows.length, 0);
  assert.deepEqual(r.errors.map(e => e.line), [1, 2]);
});
ok("missing field and unknown course are errors", () => {
  const r = A.parseDeadlineLines("PHYS 124, 2026-12-01\nMATH 100, Quiz, 2026-12-01\nPHYS 124, , 2026-12-01");
  assert.equal(r.errors.length, 3);
});
ok("duplicates are skipped (in the paste and against existing rows)", () => {
  const r = A.parseDeadlineLines("CMPUT 201, A4, 2026-12-01\ncmput, a4, 2026-12-01");
  assert.equal(r.rows.length, 1);
  assert.equal(r.skipped.length, 1);
  const again = A.parseDeadlineLines("PHYS 124, Lab 7 report, 2026-11-24", A.DEADLINES);
  assert.equal(again.skipped.length, 1);
  assert.equal(again.rows.length, 0);
});
ok("exam flag sets the exam kind and hp", () => {
  const row = A.parseDeadlineLines("ASTRO 101, Final, 2026-12-15, exam").rows[0];
  assert.equal(row.kind, "exam");
  assert.equal(row.hp, A.DEADLINE_IMPORT.examHp);
});
ok("imported events merge on top of the repo rows, and swap cleanly", () => {
  const ev = [{ id: "x", activity: "deadline-import", course: "phys", title: "Final", due: "2026-12-20", kind: "exam", hp: 10 }];
  A.applyImportedDeadlines(ev);
  assert.equal(A.DEADLINES.length, A.REPO_DEADLINE_COUNT + 1);
  A.applyImportedDeadlines([]);
  assert.equal(A.DEADLINES.length, A.REPO_DEADLINE_COUNT);
});
