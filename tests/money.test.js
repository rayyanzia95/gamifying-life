// Tests for js/score-money.js helpers. Run: node tests/money.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
vm.runInContext(load("js/score-money.js") + "\nthis.api={budgetCardOpen};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("budget card open with no events", () => assert.equal(A.budgetCardOpen([]), true));
ok("budget card open with other events", () => assert.equal(A.budgetCardOpen([{ activity: "spend", cents: 100 }]), true));
ok("budget card closed once any budget exists", () =>
  assert.equal(A.budgetCardOpen([{ activity: "budget", cents: 5000, date: "2020-01-01" }]), false));
