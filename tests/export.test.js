// Tests for the CSV export helpers (js/export-csv.js). Run: node tests/export.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js/export-csv.js"), "utf8") +
  "\nthis.api={eventsToCsv,eventDetails};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("header and plain rows", () =>
  assert.equal(A.eventsToCsv([{ date: "2026-11-14", activity: "study", xp: 10, details: "course=phys" }]),
    "date,activity,xp,details\r\n2026-11-14,study,10,course=phys"));
ok("commas are quoted", () =>
  assert.ok(A.eventsToCsv([{ date: "d", activity: "a", xp: 1, details: "a=1, b=2" }]).endsWith('"a=1, b=2"')));
ok("quotes are doubled", () =>
  assert.ok(A.eventsToCsv([{ date: "d", activity: "a", xp: 1, details: 'note=say "hi"' }]).endsWith('"note=say ""hi"""')));
ok("newlines stay inside quotes", () =>
  assert.ok(A.eventsToCsv([{ date: "d", activity: "a", xp: 1, details: "x\ny" }]).endsWith('"x\ny"')));
ok("blank xp stays blank", () =>
  assert.ok(A.eventsToCsv([{ date: "d", activity: "a", details: "" }]).endsWith("\r\nd,a,,")));
ok("details skip date, activity and id", () =>
  assert.equal(A.eventDetails({ id: "1", date: "d", activity: "a", course: "phys", n: 2 }), "course=phys; n=2"));
