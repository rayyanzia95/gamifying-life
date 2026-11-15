// Tests for saved-setting migration in js/settings.js. Run: node tests/settings.test.js
// settings.js is loaded in a vm with a fake localStorage, cut off before applyAppearance (the rest needs a browser).
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const load = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const settingsSrc = load("js/settings.js");
const logic = settingsSrc.slice(0, settingsSrc.indexOf("function applyAppearance"));
const ok = (name, fn) => { fn(); console.log("ok -", name); };

function settingsWith(saved) {
  const ctx = { localStorage: { getItem: () => JSON.stringify(saved) } };
  vm.createContext(ctx);
  vm.runInContext(load("js/config.js") + logic + "\nthis.api={loadSettings,EXPERIMENTAL_LAYOUTS};", ctx);
  return ctx.api;
}

for (const old of ["glow", "toast", "ringburst", "lockon", "unfurl"]) {
  ok(`retired level-up "${old}" reads as ring`, () => assert.equal(settingsWith({ levelUp: old }).loadSettings().levelUp, "ring"));
}
ok("kept level-up effects stay", () => {
  for (const kept of ["none", "ring", "burst", "banner", "hud", "rpg"]) assert.equal(settingsWith({ levelUp: kept }).loadSettings().levelUp, kept);
});
ok("a parked layout is honoured", () => assert.equal(settingsWith({ layout: "orrery" }).loadSettings().layout, "orrery"));
ok("an unknown layout falls back to the default", () => assert.equal(settingsWith({ layout: "nope" }).loadSettings().layout, "classic"));
ok("a retired palette still maps", () => assert.equal(settingsWith({ paletteDark: "candle" }).loadSettings().paletteDark, "amber"));
ok("parked layouts are listed", () => assert.deepEqual([...settingsWith({}).EXPERIMENTAL_LAYOUTS], ["orrery", "wheel", "codex"]));
