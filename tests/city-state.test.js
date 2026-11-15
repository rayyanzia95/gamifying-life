// Tests for the city builder's catalogue and state (js/city/build/catalogue.js, state.js). Run: node tests/city-state.test.js
// Same style as sync-merge.test.js: the files are loaded the way a <script> tag would, then checked with assert.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
// The real terrain and plots, cut out of city-svg.js (the rest of that file needs a browser).
const svg = load("js/city-svg.js");
const cut = (from, to) => svg.slice(svg.indexOf(from), svg.indexOf(to, svg.indexOf(from)) + to.length);
vm.runInContext(cut("const CITY_TERRAIN", "];") + cut("const CITY_PLOT", "};") + load("js/city/build/catalogue.js") + load("js/city/build/state.js") +
  "\nthis.api={CITY_TERRAIN,CITY_PLOT,CITY_PROJECTS,CITY_SLOTS,CITY_STARTERS,cityCheckCatalogue,cityFits,cityProject,citySlot,cityStage,cityState,ramadansCompleted,cityCanBuild,cityMenu,cityOpenSlots,cityBuildableSlots,cityBuild,cityMove,cityRemove,cityReplace,cityRoads,citySummary};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };
let clock = 1000;
const ev = (project, slot, extra = {}) => ({ id: `e${clock}`, date: "2026-11-14", activity: "city-build", project, slot, at: clock++, ...extra });
const slots = state => state.built.filter(b => !b.starter).map(b => `${b.project}@${b.slot}`);

ok("catalogue matches the real terrain and plots", () => assert.deepEqual(A.cityCheckCatalogue(A.CITY_TERRAIN, A.CITY_PLOT), []));

ok("a new town has its starters and no blueprint until level 2", () => {
  const s = A.cityState([], 1);
  assert.equal(s.built.length, A.CITY_STARTERS.length);
  assert.equal(s.free, 0); assert.equal(s.stage.name, "Hamlet");
  assert.equal(A.cityState([], 2).free, 1);
  assert.ok(s.has("stonebridge") && s.has("rockstairs"));
});

ok("stage names follow the level bands", () =>
  assert.deepEqual([1, 2, 3, 5, 7, 9, 10, 15, 40].map(l => A.cityStage(l).id), ["hamlet", "hamlet", "village", "town", "railtown", "railtown", "cliffside", "capital", "capital"]));

ok("building spends a blueprint", () => {
  const s = A.cityState([ev("docks", "b-quay")], 3);
  assert.deepEqual(slots(s), ["docks@b-quay"]); assert.equal(s.spent, 1); assert.equal(s.free, 1);
});

ok("overspending leaves the latest build unplaced, not lost", () => {
  const s = A.cityState([ev("docks", "b-quay"), ev("watermill", "b-mill")], 2);
  assert.deepEqual(slots(s), ["docks@b-quay"]);
  assert.equal(s.unplaced.length, 1); assert.equal(s.unplaced[0].reason, "blueprint"); assert.equal(s.free, 0);
});

ok("two devices, one slot: the earlier build keeps it", () => {
  const first = ev("docks", "b-quay"), second = ev("watermill", "b-quay");
  const s = A.cityState([second, first], 5); // order in the list doesn't matter, `at` does
  assert.deepEqual(slots(s), ["docks@b-quay"]);
  assert.equal(s.unplaced[0].reason, "taken"); assert.equal(s.spent, 1);
  const moved = A.cityReplace([second, first], s, second, "b-mill");
  assert.deepEqual(slots(A.cityState(moved, 5)).sort(), ["docks@b-quay", "watermill@b-mill"]);
});

ok("prerequisites are checked when building", () => {
  const s = A.cityState([], 5);
  assert.equal(A.cityCanBuild(s, "rivermarket", "b-foot").ok, false);
  assert.match(A.cityCanBuild(s, "rivermarket", "b-foot").reason, /docks/);
  const s2 = A.cityState([ev("docks", "b-quay")], 5);
  assert.equal(A.cityCanBuild(s2, "rivermarket", "b-foot").ok, true);
});

ok("removing a prerequisite never knocks down what was built on it", () => {
  const market = ev("rivermarket", "b-foot");
  const s = A.cityState([market], 5); // docks gone (moved or removed on another device)
  assert.deepEqual(slots(s), ["rivermarket@b-foot"]);
});

ok("zones and footprints decide what fits", () => {
  const s = A.cityState([], 9);
  assert.equal(A.cityCanBuild(s, "docks", "t-garden").ok, false);   // not a riverbank
  assert.equal(A.cityCanBuild(s, "garden", "b-foot").ok, false);    // 2x2 won't fit 1x1
  assert.equal(A.cityCanBuild(s, "garden", "t-garden").ok, true);
  assert.equal(A.cityCanBuild(s, "funicular", "k-rise").ok, false); // needs terraces
});

ok("starters can't be built over, moved or removed", () => {
  const s = A.cityState([], 9);
  assert.equal(A.cityCanBuild(s, "footbridge", "x-mid").ok, false);
  assert.equal(A.cityMove([], s, "x-mid", "x-west"), null);
  assert.equal(A.cityRemove([], s, "k-mid"), null);
});

ok("a footbridge can be upgraded to stone in place", () => {
  const foot = ev("footbridge", "x-west");
  const s = A.cityState([foot], 9);
  assert.equal(A.cityCanBuild(s, "stonebridge", "x-west").ok, true);
  const s2 = A.cityState([foot, ev("stonebridge", "x-west")], 9);
  assert.equal(s2.bySlot.get("x-west").project, "stonebridge");
  assert.equal(s2.spent, 2); assert.equal(s2.count("footbridge"), 0);
  assert.equal(A.cityCanBuild(A.cityState([], 9), "stonebridge", "x-west").ok, false); // nothing to upgrade
});

ok("unique projects are built once", () => {
  const s = A.cityState([ev("square", "p-green"), ev("station", "b-quay")], 9);
  assert.equal(A.cityCanBuild(s, "station", "p-west").ok, false);
  assert.equal(A.cityState([ev("beacon", "s-falls"), ev("beacon", "s-north")], 9).unplaced[0].reason, "unique");
});

ok("terrain-changing projects stay locked unless allowed", () => {
  const e = [ev("docks", "b-quay"), ev("canal", "p-south")];
  assert.equal(A.cityState(e, 9).unplaced[0].reason, "later");
  assert.deepEqual(slots(A.cityState(e, 9, { allowLater: true })).sort(), ["canal@p-south", "docks@b-quay"]);
});

ok("monuments are earned, cost nothing, and can't exceed what was earned", () => {
  const e = [ev("statue", "p-row"), ev("statue", "b-foot")];
  assert.equal(A.cityState(e, 1).built.filter(b => !b.starter).length, 0);
  const s = A.cityState(e, 1, { earned: { boss: 1 } });
  assert.deepEqual(slots(s), ["statue@p-row"]); assert.equal(s.spent, 0); assert.equal(s.unplaced[0].reason, "earned");
  assert.equal(A.cityCanBuild(A.cityState([], 1, { earned: { boss: 1 } }), "statue", "p-row").ok, true);
});

ok("lantern arch needs a completed Ramadan; the same year counts once", () => {
  const done = year => ({ id: `r${year}${clock}`, date: "2027-03-10", activity: "ramadan-complete", year, at: clock++ });
  const e = [ev("lanterns", "p-row")];
  const earned = events => ({ boss: 0, ramadan: A.ramadansCompleted(events) });
  assert.equal(A.cityState(e, 1, { earned: earned([]) }).unplaced[0].reason, "earned");
  assert.deepEqual(slots(A.cityState(e, 1, { earned: earned([done(2027)]) })), ["lanterns@p-row"]);
  assert.equal(A.ramadansCompleted([done(2027), done(2027)]), 1);
  assert.equal(A.ramadansCompleted([done(2027), done(2028)]), 2);
});

ok("moving is free and keeps the blueprint spent", () => {
  const e = [ev("docks", "b-quay")];
  const s = A.cityState(e, 2);
  const moved = A.cityMove(e, s, "b-quay", "b-mill");
  const s2 = A.cityState(moved, 2);
  assert.deepEqual(slots(s2), ["docks@b-mill"]); assert.equal(s2.spent, 1);
  assert.equal(moved[0].id, e[0].id);            // same event, so sync sees an edit
  assert.equal(A.cityMove(e, s, "b-quay", "t-garden"), null); // doesn't fit
});

ok("removing gives the blueprint back", () => {
  const e = [ev("docks", "b-quay")];
  const after = A.cityRemove(e, A.cityState(e, 2), "b-quay");
  assert.equal(A.cityState(after, 2).free, 1);
});

ok("the writers never change the list they were given", () => {
  const e = Object.freeze([Object.freeze(ev("docks", "b-quay"))]);
  const s = A.cityState(e, 5);
  A.cityBuild(e, s, "watermill", "b-mill", 5000, "2026-11-14"); A.cityMove(e, s, "b-quay", "b-mill"); A.cityRemove(e, s, "b-quay");
  assert.equal(e.length, 1); assert.equal(e[0].slot, "b-quay");
});

ok("the menu lists what a slot can take, buildable first", () => {
  const s = A.cityState([], 2);
  const menu = A.cityMenu(s, "b-quay");
  assert.ok(menu[0].ok); assert.ok(menu.some(m => m.project.id === "docks"));
  assert.ok(!menu.some(m => m.project.id === "stonebridge"));
  assert.deepEqual(A.cityMenu(s, "x-west").map(m => m.project.id), ["footbridge"]);
  assert.deepEqual(A.cityMenu(A.cityState([ev("footbridge", "x-west")], 5), "x-west").map(m => m.project.id), ["stonebridge"]);
});

ok("open slots exclude starters and full slots with no upgrade", () => {
  const s = A.cityState([ev("docks", "b-quay")], 5);
  const open = A.cityOpenSlots(s).map(x => x.id);
  assert.ok(!open.includes("x-mid") && !open.includes("b-quay") && open.includes("b-mill"));
});

ok("buildable slots are empty with nothing to spend, and include upgrades when there is", () => {
  assert.equal(A.cityBuildableSlots(A.cityState([ev("docks", "b-quay")], 2)).length, 0);
  const ids = A.cityBuildableSlots(A.cityState([ev("footbridge", "x-west")], 3)).map(x => x.id);
  assert.ok(ids.includes("x-west") && ids.includes("b-mill") && !ids.includes("x-mid"));
});

ok("roads appear when both ends are in use", () => {
  assert.ok(!A.cityRoads(A.cityState([], 5)).some(r => r.id === "r-quay"));
  const s = A.cityState([ev("docks", "b-quay"), ev("square", "p-green")], 5);
  assert.ok(A.cityRoads(s).some(r => r.id === "r-quay") && A.cityRoads(s).some(r => r.id === "r-green-people"));
});

ok("the summary line reads naturally", () => {
  assert.equal(A.citySummary(A.cityState([], 1)), "Hamlet · no blueprints");
  assert.equal(A.citySummary(A.cityState([], 2)), "Hamlet · 1 blueprint");
  assert.equal(A.citySummary(A.cityState([ev("docks", "b-quay")], 4)), "Village · 2 blueprints");
  assert.equal(A.citySummary(A.cityState([ev("docks", "b-quay")], 2)), "Hamlet · no blueprints");
});
// The Deen button's window (js/deen.js), loaded with the real date helpers from storage.js.
const storage = load("js/storage.js"), deen = load("js/deen.js");
const fn = (src, name) => src.slice(src.indexOf(`function ${name}(`), src.indexOf("\n}\n", src.indexOf(`function ${name}(`)) + 3);
const rctx = {}; vm.createContext(rctx);
vm.runInContext(`const RAMADAN_END = "2027-03-09";` + ["dateString", "daysBetween", "shiftDate"].map(n => fn(storage, n)).join("") +
  deen.slice(deen.indexOf("const RAMADAN_BUTTON_DAYS"), deen.indexOf("function toggleRamadan")) +
  "\nthis.api={ramadanButtonOpen,ramadanDone};", rctx);
ok("Ramadan button shows from Eid through Eid + 6 only", () => {
  const open = rctx.api.ramadanButtonOpen;
  assert.deepEqual(["2027-03-09", "2027-03-10", "2027-03-16", "2027-03-17"].map(open), [false, true, true, false]);
  assert.equal(rctx.api.ramadanDone([{ activity: "ramadan-complete", year: 2027 }]), true);
  assert.equal(rctx.api.ramadanDone([{ activity: "ramadan-complete", year: 2026 }]), false);
});

console.log("all city tests passed");
