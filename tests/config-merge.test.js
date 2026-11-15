// Tests for synced config events. Run: node tests/config-merge.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const ok = (name, fn) => { fn(); console.log("ok -", name); };
const ctx = {};
vm.createContext(ctx);
const storage = load("js/storage.js");
vm.runInContext(load("js/sync-merge.js") + storage.slice(storage.indexOf("function configValue"), storage.indexOf("function dateString")) +
  "\nthis.api={mergeDuplicates,configValue};", ctx);
const A = ctx.api;
const cfg = (id, key, value, at) => ({ id, date: "2026-11-14", activity: "config", key, value, at });

ok("later at wins across two devices", () => {
  const merged = A.mergeDuplicates([cfg("a", "chores", { list: [1] }, 100), cfg("b", "chores", { list: [2] }, 200)]);
  assert.equal(merged.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(A.configValue(merged, "chores", null))), { list: [2] });
});
ok("different keys stay separate", () =>
  assert.equal(A.mergeDuplicates([cfg("a", "x", 1, 1), cfg("b", "y", 2, 2)]).length, 2));
ok("fallback when none saved", () => assert.equal(A.configValue([], "chores", "dflt"), "dflt"));
