// Tests for js/score-money.js helpers. Run: node tests/money.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const scoring = load("js/scoring.js");
const em = scoring.indexOf("function earlierMatches");
vm.runInContext(load("js/config.js") + scoring.slice(em, scoring.indexOf("\n}\n", em) + 3) + load("js/score-money.js") + "\nthis.api={budgetCardOpen,cleanNote,buildSpend,isSpend,scoreMoneyLog};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("budget card open with no events", () => assert.equal(A.budgetCardOpen([]), true));
ok("budget card open with other events", () => assert.equal(A.budgetCardOpen([{ activity: "spend", cents: 100 }]), true));
ok("budget card closed once any budget exists", () =>
  assert.equal(A.budgetCardOpen([{ activity: "budget", cents: 5000, date: "2020-01-01" }]), false));

ok("note is trimmed and capped at 60", () => {
  assert.equal(A.cleanNote("  lunch  "), "lunch");
  assert.equal(A.cleanNote("x".repeat(90)).length, 60);
  assert.equal(A.cleanNote(undefined), "");
});
ok("edited spend keeps id and date", () => {
  const old = { id: "a1", date: "2026-11-10", activity: "spend", cents: 500, category: "food", note: "old" };
  const next = A.buildSpend(old, { date: "2026-11-14", cents: 850, category: "fun", note: "" });
  assert.equal(next.id, "a1");
  assert.equal(next.date, "2026-11-10");
  assert.equal(next.cents, 850);
  assert.equal(next.category, "fun");
  assert.ok(!("note" in next));
});
ok("new spend gets the note", () => {
  const s = A.buildSpend(null, { date: "2026-11-14", cents: 100, category: "food", note: " tea " });
  assert.deepEqual(JSON.parse(JSON.stringify(s)), { date: "2026-11-14", activity: "spend", cents: 100, category: "food", note: "tea" });
});
ok("note does not change what counts as a spend or logged day", () => {
  const a = { date: "2026-11-14", activity: "spend", cents: 100, category: "food" };
  const b = { ...a, note: "lunch" };
  assert.equal(A.isSpend(b), true);
  assert.equal(JSON.stringify(A.scoreMoneyLog(a, [a])), JSON.stringify(A.scoreMoneyLog(b, [b])));
});
