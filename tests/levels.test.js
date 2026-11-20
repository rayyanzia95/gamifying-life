// Tests for per-branch level costs (LEVELS.branchCost, branchLevelInfo in js/scoring.js). Run: node tests/levels.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
vm.runInContext(load("js/config.js") + load("js/scoring.js") + "\nthis.api={branchLevelInfo,levelInfo,LEVELS,BRANCHES};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };
const same = (got, want) => assert.deepStrictEqual({ ...got }, want);

ok("Deen 1300 XP is still level 1 (cost 1500)", () => same(A.branchLevelInfo(1300, "deen"), { level: 1, into: 1300, cost: 1500 }));
ok("Deen 1500 XP reaches level 2 (next cost 1750)", () => same(A.branchLevelInfo(1500, "deen"), { level: 2, into: 0, cost: 1750 }));
ok("Chores 300 XP is level 2, 150 in (150 then 175)", () => same(A.branchLevelInfo(300, "chores"), { level: 2, into: 150, cost: 175 }));
ok("Health keeps the base costs", () => same(A.branchLevelInfo(600, "health"), { level: 2, into: 0, cost: 700 }));
ok("unknown branch falls back to x1", () => same(A.branchLevelInfo(0, "nope"), { level: 1, into: 0, cost: 600 }));
ok("costs are whole numbers", () => {
  for (const b of A.BRANCHES) for (const xp of [0, 123, 999, 5000]) {
    const i = A.branchLevelInfo(xp, b.id);
    assert.ok(Number.isInteger(i.into));
    assert.ok(Number.isInteger(i.cost));
  }
});
ok("every branch has a cost multiplier", () => { for (const b of A.BRANCHES) assert.ok(A.LEVELS.branchCost[b.id] > 0, b.id); });
ok("overall is unchanged (x3 on the sum)", () => same(A.levelInfo(1800, A.LEVELS.overallMultiplier), { level: 2, into: 0, cost: 2100 }));
