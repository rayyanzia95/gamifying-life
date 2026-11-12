// Tests for js/sync-merge.js (the sync merge rules). Run: node tests/sync-merge.test.js
// The app has no build step or modules, so this loads the file the same way a <script> tag would.
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require("path").join(__dirname, "../js/sync-merge.js"), "utf8") + "\nthis.api={eventData,canonical,applyRows,mergeDuplicates};", ctx);
const { eventData, canonical, applyRows, mergeDuplicates } = ctx.api;
const row = (id, data, deleted = false) => ({ id, data, deleted, updated_at: "2026-11-11T20:00:00Z" });
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("canonical ignores key order", () =>
  assert.equal(canonical({ date: "d", activity: "a" }), canonical({ activity: "a", date: "d" })));

ok("new remote row is added", () => {
  const r = applyRows([], {}, [row("b", { date: "d", activity: "exercise" })]);
  assert.deepEqual(r.events.map(e => e.id), ["b"]); assert.ok(r.synced.b);
});

ok("remote edit replaces a synced local event", () => {
  const local = [{ id: "a", date: "d", activity: "chore", chore: "dishes" }];
  const synced = { a: canonical(eventData(local[0])) };
  const r = applyRows(local, synced, [row("a", { activity: "chore", chore: "laundry", date: "d" })]);
  assert.equal(r.events[0].chore, "laundry");
});

ok("unsent local edit wins over remote", () => {
  const synced = { a: canonical({ date: "d", activity: "chore", chore: "dishes" }) };
  const local = [{ id: "a", date: "d", activity: "chore", chore: "room" }];
  const r = applyRows(local, synced, [row("a", { date: "d", activity: "chore", chore: "laundry" })]);
  assert.equal(r.events[0].chore, "room"); assert.equal(r.synced.a, synced.a);
});

ok("unsent local removal is not undone", () => {
  const synced = { a: canonical({ date: "d", activity: "exercise" }) };
  const r = applyRows([], synced, [row("a", { date: "d", activity: "exercise" })]);
  assert.equal(r.events.length, 0);
});

ok("remote tombstone removes a synced event", () => {
  const local = [{ id: "a", date: "d", activity: "exercise" }];
  const r = applyRows(local, { a: canonical(eventData(local[0])) }, [row("a", { date: "d", activity: "exercise" }, true)]);
  assert.equal(r.events.length, 0); assert.equal(r.synced.a, undefined);
});

ok("input lists are not mutated", () => {
  const local = [{ id: "a", date: "d", activity: "exercise" }]; const synced = { a: canonical(eventData(local[0])) };
  const copy = JSON.stringify([local, synced]);
  applyRows(local, synced, [row("a", {}, true)]); assert.equal(JSON.stringify([local, synced]), copy);
});

ok("same prayer on two devices merges, ticks kept, smallest id survives", () => {
  const mac = { id: "b2", date: "d", prayer: "fajr", set: "fard", onTime: true, masjid: false };
  const phone = { id: "a1", date: "d", prayer: "fajr", set: "fard", onTime: false, masjid: true };
  const out = mergeDuplicates([mac, phone]);
  assert.equal(out.length, 1); assert.equal(out[0].id, "a1");
  assert.equal(out[0].onTime, true); assert.equal(out[0].masjid, true);
});

ok("both devices reach the same merge", () => {
  const x = { id: "a1", date: "d", activity: "diet", breakfast: "healthy", water: 3 };
  const y = { id: "b2", date: "d", activity: "diet", lunch: "okay", water: 5 };
  assert.deepEqual(mergeDuplicates([x, y]), mergeDuplicates([y, x]));
  const m = mergeDuplicates([x, y])[0];
  assert.equal(m.breakfast, "healthy"); assert.equal(m.lunch, "okay"); assert.equal(m.water, 5);
});

ok("chores, study, exercise duplicates are kept", () => {
  const evs = [{ id: "1", date: "d", activity: "chore", chore: "dishes" }, { id: "2", date: "d", activity: "chore", chore: "dishes" },
    { id: "3", date: "d", activity: "study", course: "phys" }, { id: "4", date: "d", activity: "study", course: "phys" }];
  assert.equal(mergeDuplicates(evs).length, 4);
});

ok("deadline ticked on two days merges to one", () =>
  assert.equal(mergeDuplicates([{ id: "1", date: "d1", activity: "deadline", deadline: "x" },
    { id: "2", date: "d2", activity: "deadline", deadline: "x" }]).length, 1));

ok("different prayers or sets stay separate", () =>
  assert.equal(mergeDuplicates([{ id: "1", date: "d", prayer: "fajr", set: "fard" },
    { id: "2", date: "d", prayer: "fajr", set: "sunnah" }, { id: "3", date: "d", prayer: "dhuhr", set: "fard" }]).length, 3));
