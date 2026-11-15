// Tests for People rhythm (js/score-people.js). Run: node tests/people.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const ctx = {}; vm.createContext(ctx);
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
vm.runInContext(["config", "config-academics", "scoring", "score-chores", "score-health", "score-academics", "score-money", "score-personal", "score-people", "score-levels", "storage"].map(n => load(`js/${n}.js`)).join("\n") +
  "\nthis.api={isDue,peopleList,scoreEvent,xpByBranch,PEOPLE};", ctx);
const A = ctx.api;
const ok = (name, fn) => { fn(); console.log("ok -", name); };
const person = { id: "p1", date: "2026-10-01", activity: "person", name: "Mom", group: "lahore", rhythm: "weekly" };
const call = date => ({ date, activity: "contact", name: "Mom", group: "lahore", kind: "call" });

ok("due once the rhythm has passed", () => assert.equal(A.isDue(person, [person, call("2026-11-01")], "2026-11-09"), true));
ok("not due on the rhythm day", () => assert.equal(A.isDue(person, [person, call("2026-11-01")], "2026-11-08"), false));
ok("not due right after a contact", () => assert.equal(A.isDue(person, [person, call("2026-11-14")], "2026-11-14"), false));
ok("no rhythm is never due", () => assert.equal(A.isDue({ ...person, rhythm: undefined }, [person], "2027-01-01"), false));
ok("never contacted counts from when added", () => assert.equal(A.isDue(person, [person], "2026-10-20"), true));
ok("removed person hidden but old contacts still score", () => {
  const events = [person, call("2026-11-02")];
  const after = events.filter(e => e.id !== "p1");
  assert.equal(A.peopleList(after).length, 0);
  const xp = A.xpByBranch(after).people;
  assert.equal(xp, A.PEOPLE.checkInXp + A.PEOPLE.homeCallXp);
});
