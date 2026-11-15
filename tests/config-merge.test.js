// Tests for synced config events and the editable chore list. Run: node tests/config-merge.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const ok = (name, fn) => { fn(); console.log("ok -", name); };
const ctx = { todayString: () => "2026-11-14", localStorage: { getItem: () => null, setItem() {} }, window: { dispatchEvent() {} }, Event: function () {} };
vm.createContext(ctx);
const storage = load("js/storage.js");
const editor = load("js/chores-editor.js");
vm.runInContext(load("js/sync-merge.js") + load("js/config.js") + load("js/score-chores.js") + storage.slice(storage.indexOf("function configValue"), storage.indexOf("function dateString")) +
  editor.slice(0, editor.indexOf("// ---- The editor on the page")) +
  "\nthis.api={mergeDuplicates,configValue,choreListAll,choreList,scoreChore,choreIdFor,choreFromFields,withChoresConfig,CHORES};", ctx);
vm.runInContext("function weekStart(d){const t=new Date(d+'T12:00Z');t.setUTCDate(t.getUTCDate()-t.getUTCDay());return t.toISOString().slice(0,10)}function shiftDate(d,n){const t=new Date(d+'T12:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)}function earlierMatches(events,e,from,m){return events.filter(x=>x!==e&&m(x)&&x.date>=from&&x.date<=e.date&&events.indexOf(x)<events.indexOf(e)).length}", ctx);
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

const saved = list => [cfg("c", "chores", { list, archived: ["desk"] }, 1)];
ok("edited list resolves over the default, archived hidden, new added", () => {
  const events = saved([{ id: "laundry", name: "Wash clothes", xp: 30 }, { id: "car", name: "Car", xp: 5 }]);
  const names = A.choreList(events).map(c => c.name);
  assert.ok(names.includes("Wash clothes") && names.includes("Car") && !names.includes("Laundry") && !names.includes("Clean desk"));
  assert.equal(A.choreList([]).length, A.CHORES.list.length);
});
ok("archived and renamed chores' old ticks still score", () => {
  const tick = id => ({ id: "t" + id, date: "2026-11-10", activity: "chore", chore: id });
  const events = [...saved([{ id: "laundry", name: "Wash clothes", xp: 30 }]), tick("desk"), tick("laundry")];
  assert.equal(A.scoreChore(events[1], events).core, 10);
  assert.equal(A.scoreChore(events[2], events).core, 30);
});
ok("ids are slugified and unique", () => {
  assert.equal(A.choreIdFor("Clean the car!", []), "clean-the-car");
  assert.equal(A.choreIdFor("Clean the car", ["clean-the-car"]), "clean-the-car-2");
});
ok("form fields clamp and drop defaults", () => {
  const c = A.choreFromFields({ id: "x", name: "X" }, { name: " Y ", xp: "9999", times: "1", everyWeeks: "2", hint: "Fri" });
  assert.deepEqual(JSON.parse(JSON.stringify(c)), { id: "x", name: "Y", xp: 500, everyWeeks: 2, hint: "Fri" });
});
ok("saving replaces the one config event", () => {
  const out = A.withChoresConfig(saved([]), [], []);
  assert.equal(out.length, 1);
});
