// Tests for the Rewards page's example-perks card (js/rewards-page.js). Run: node tests/rewards.test.js
// The helper is cut out of the page file (the rest of it needs a browser), like city-state.test.js does.
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const page = load("js/rewards-page.js");
const start = page.indexOf("const perkStartersOpen");
vm.runInContext(load("js/config.js") + page.slice(start, page.indexOf(";\n", start) + 2) +
  "\nthis.api={perkStartersOpen,PERK_STARTERS,BRANCHES};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };

ok("open with no events", () => assert.equal(A.perkStartersOpen([]), true));
ok("open with unrelated events", () => assert.equal(A.perkStartersOpen([{ activity: "chore" }, { activity: "perk-claimed", perk: "x" }]), true));
ok("closed once there is a perk", () => assert.equal(A.perkStartersOpen([{ activity: "perk", id: "a" }]), false));
ok("closed once the ideas were dealt with", () => assert.equal(A.perkStartersOpen([{ activity: "perk-starters-done" }]), false));
ok("starters are valid perks", () => {
  const ids = ["overall", ...A.BRANCHES.map(b => b.id)];
  assert.equal(A.PERK_STARTERS.length, 5);
  for (const s of A.PERK_STARTERS) assert.ok(ids.includes(s.branch) && s.level >= 2 && s.text.length > 0 && s.text.length <= 60);
});
