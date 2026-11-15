// City builder, part 1 of 5: the catalogue. What can be built (CITY_PROJECTS), where (CITY_SLOTS) and the town's
// stage names (CITY_STAGES). Plain data and a few pure helpers: no DOM, no three.js, so tests can load it in Node.
//
// How the pieces fit:
//   - Each overall level earns one blueprint. A blueprint is spent on a project, placed in a free slot.
//   - A slot is a fixed place on the map with a kind ("zone"). A project lists the zones it fits.
//   - Some projects need another one built first (`needs`), so the menu works like a small tech tree.
//   - "Starter" builds are the bridges and stairs the town has always had. They cost nothing and can't be removed.
//
// Cell coordinates are the same as CITY_TERRAIN / CITY_PLOT in js/city-svg.js: x runs east, y runs south, one unit
// is one terrain cell, and a slot's x, y is its top-left corner. Loaded before state.js, models.js and svg.js.

// The town's name at each overall level. `from` is the first level of the stage (same bands as CITY_TIER_FROM).
const CITY_STAGES = [
  { from: 1, id: "hamlet", name: "Hamlet" },
  { from: 3, id: "village", name: "Village" },
  { from: 5, id: "town", name: "Town" },
  { from: 7, id: "railtown", name: "Rail town" },
  { from: 10, id: "cliffside", name: "Cliffside city" },
  { from: 15, id: "capital", name: "Capital" },
];

// Zones. A slot has one or more; a project fits a slot when they share one.
//   crossing  a span over the river          riverbank  land beside the water
//   plain     flat low ground                hill       the low knolls (level 2)
//   clifffoot level ground under a cliff     cliff      one cell where steps or rails can climb a level
//   plateau   the high ground (level 3)      peak       a corner of the high ground with a view
const CITY_ZONE_NAMES = {
  crossing: "River crossing", riverbank: "Riverbank", plain: "Low ground", hill: "Knoll",
  clifffoot: "Under the cliff", cliff: "Cliff face", plateau: "High plateau", peak: "Peak",
};

// side: which way the project pulls the town ("river", "mountain" or "shared"). cost: blueprints.
// size: [cells wide, cells deep] the model is drawn for; it fits a slot at least that big.
// needs: project ids that must already stand somewhere (starters count). replaces: built on top of that project,
// in its slot (an upgrade). unique: only one in the town. later: designed and modelled, but it changes the terrain,
// so the first slice keeps it locked (state.js refuses it unless told `allowLater`).
const CITY_PROJECTS = [
  // ---- toward the river ----
  { id: "footbridge", name: "Footbridge", side: "river", cost: 1, size: [1, 2], zones: ["crossing"], needs: [],
    blurb: "A rope bridge over the canyon. Quick to raise, and it opens the far bank." },
  { id: "stonebridge", name: "Stone bridge", side: "river", cost: 1, size: [1, 2], zones: ["crossing"], needs: [], replaces: "footbridge",
    blurb: "Arches of cut stone where the rope bridge hung. Carts can cross now." },
  { id: "docks", name: "Docks", side: "river", cost: 1, size: [2, 1], zones: ["riverbank"], needs: [],
    blurb: "Timber jetties and the first boats. River trade begins here." },
  { id: "watermill", name: "Watermill", side: "river", cost: 1, size: [2, 1], zones: ["riverbank"], needs: [],
    blurb: "A wheel in the current, turning all day whether you watch or not." },
  { id: "rivermarket", name: "Riverside market", side: "river", cost: 1, size: [1, 1], zones: ["riverbank", "plain"], needs: ["docks"],
    blurb: "Awnings along the quay, stocked by whatever the boats bring in." },
  { id: "canal", name: "Canal", side: "river", cost: 2, size: [1, 2], zones: ["plain"], needs: ["docks"], later: true,
    blurb: "Water cut through the low ground. Changes the land itself." },
  { id: "dam", name: "Dam and reservoir", side: "river", cost: 2, size: [2, 1], zones: ["riverbank"], needs: ["watermill"], later: true,
    blurb: "A wall across the upper river and a lake behind it. Changes the land itself." },

  // ---- toward the mountain ----
  { id: "rockstairs", name: "Rock stairs", side: "mountain", cost: 1, size: [1, 1], zones: ["cliff"], needs: [],
    blurb: "Steps cut into the cliff, one level up." },
  { id: "terraces", name: "Terraced street", side: "mountain", cost: 1, size: [2, 1], zones: ["clifffoot", "hill"], needs: ["rockstairs"],
    blurb: "Houses stepping up the rock, each roof a neighbour's front garden." },
  { id: "lookout", name: "Lookout", side: "mountain", cost: 1, size: [1, 1], zones: ["peak"], needs: ["terraces"],
    blurb: "A pavilion on the highest corner. From here you can see how far the town has come." },
  { id: "garden", name: "Hilltop garden", side: "mountain", cost: 1, size: [2, 2], zones: ["plateau", "hill"], needs: [],
    blurb: "Cypress, a fountain and quiet paths above the noise." },
  { id: "quarry", name: "Quarry", side: "mountain", cost: 1, size: [2, 2], zones: ["plateau", "hill"], needs: ["rockstairs"],
    blurb: "A stepped pit, a crane and blocks waiting to become the next building." },
  { id: "funicular", name: "Funicular", side: "mountain", cost: 1, size: [1, 1], zones: ["cliff"], needs: ["terraces"],
    blurb: "A little car on rails that climbs the cliff so you don't have to." },
  { id: "tunnel", name: "Rail tunnel", side: "mountain", cost: 2, size: [1, 1], zones: ["cliff"], needs: ["station"], later: true,
    blurb: "The line goes through the rock. Changes the land itself." },

  // ---- shared ----
  { id: "square", name: "Market square", side: "shared", cost: 1, size: [2, 2], zones: ["plain", "plateau"], needs: [],
    blurb: "Paving, a well and room for everyone. Every town needs a middle." },
  { id: "station", name: "Railway station", side: "shared", cost: 1, size: [2, 1], zones: ["plain", "plateau", "riverbank"], needs: ["square"], unique: true,
    blurb: "A platform, a clock and a train that runs while a streak is alive." },
  { id: "beacon", name: "Beacon tower", side: "shared", cost: 1, size: [1, 1], zones: ["peak", "riverbank"], needs: [], unique: true,
    blurb: "One tall light. On the peak it watches the valley; on the bank it guides the boats." },

  // ---- monuments: earned by what you did, never bought (cost 0, placed like any project) ----
  { id: "statue", name: "Victory statue", side: "monument", cost: 0, size: [1, 1], zones: ["plain", "plateau", "hill", "riverbank"], needs: [], earned: "boss",
    blurb: "Raised for an exam boss defeated." },
  { id: "lanterns", name: "Lantern arch", side: "monument", cost: 0, size: [1, 1], zones: ["plain", "plateau", "hill", "riverbank"], needs: [], earned: "ramadan",
    blurb: "Left standing after a Ramadan completed." },
];

// face: the way the model's front points (n, s, e, w): toward the water, the view or the street.
// level: the rock level the slot stands on (0 water, 1 bank, 2 and 3 rock), matching CITY_TERRAIN.
// A crossing has x (the deck's centre line), y0 and y1 (where it starts and ends) and the level at each end.
// A cliff slot has low and high (the levels it joins) and climbs toward `face`. deck: true means it climbs to a
// bridge deck over the water, not to rock (the two flights at the south ends of the starter bridges).
const CITY_SLOTS = [
  // river crossings
  { id: "x-mid", name: "Middle crossing", zones: ["crossing"], x: 7, y: 3.5, w: 1, h: 2.5, face: "s", level: 2, ends: [2, 2] },
  { id: "x-east", name: "East crossing", zones: ["crossing"], x: 11, y: 4.5, w: 1, h: 2.5, face: "s", level: 2, ends: [2, 2] },
  { id: "x-west", name: "West crossing", zones: ["crossing"], x: 3, y: 3, w: 1, h: 2, face: "s", level: 2, ends: [2, 1] },

  // riverbanks
  { id: "b-mill", name: "Mill bank", zones: ["riverbank"], x: 0, y: 3, w: 2, h: 1, face: "n", level: 1 },
  { id: "b-quay", name: "West quay", zones: ["riverbank"], x: 3, y: 5, w: 2, h: 1, face: "n", level: 1 },
  { id: "b-foot", name: "Bridge foot", zones: ["riverbank", "plain"], x: 8, y: 6, w: 1, h: 1, face: "n", level: 1 },
  { id: "b-east", name: "East bank", zones: ["riverbank"], x: 12, y: 5, w: 2, h: 1, face: "s", level: 2 },
  { id: "b-mouth", name: "River mouth", zones: ["riverbank"], x: 13, y: 9, w: 1, h: 1, face: "n", level: 1 },

  // low ground
  { id: "p-green", name: "Town green", zones: ["plain"], x: 3, y: 6, w: 2, h: 2, face: "s", level: 1 },
  { id: "p-west", name: "West meadow", zones: ["plain"], x: 0, y: 6, w: 2, h: 2, face: "e", level: 1 },
  { id: "p-row", name: "Market row", zones: ["plain"], x: 8, y: 7, w: 1, h: 1, face: "w", level: 1 },
  { id: "p-south", name: "South field", zones: ["plain"], x: 2, y: 8, w: 1, h: 2, face: "e", level: 1 },

  // knolls
  { id: "h-south", name: "South knoll", zones: ["hill"], x: 8, y: 8, w: 2, h: 2, face: "n", level: 2 },
  { id: "h-west", name: "West knoll", zones: ["hill"], x: 0, y: 8, w: 2, h: 2, face: "e", level: 2 },

  // under the cliff
  { id: "f-west", name: "Cliff foot", zones: ["clifffoot"], x: 3, y: 2, w: 2, h: 1, face: "s", level: 2 },

  // cliff faces (one cell each; `face` is the way it climbs)
  { id: "k-mid", name: "Mid cliff", zones: ["cliff"], x: 7, y: 2, w: 1, h: 1, face: "n", level: 2, low: 2, high: 3 },
  { id: "k-bridge", name: "Bridge steps", zones: ["cliff"], x: 7, y: 6, w: 1, h: 1, face: "n", level: 1, low: 1, high: 2, deck: true },
  { id: "k-east", name: "East steps", zones: ["cliff"], x: 11, y: 7, w: 1, h: 1, face: "n", level: 1, low: 1, high: 2, deck: true },
  { id: "k-south", name: "Knoll steps", zones: ["cliff"], x: 7, y: 7, w: 1, h: 1, face: "s", level: 1, low: 1, high: 2 },
  { id: "k-rise", name: "East rise", zones: ["cliff"], x: 8, y: 2, w: 1, h: 1, face: "n", level: 2, low: 2, high: 3 },
  { id: "k-fall", name: "Falls path", zones: ["cliff"], x: 2, y: 1, w: 1, h: 1, face: "e", level: 2, low: 2, high: 3 },
  { id: "k-knoll", name: "Knoll path", zones: ["cliff"], x: 10, y: 8, w: 1, h: 1, face: "w", level: 1, low: 1, high: 2 },

  // high plateau
  { id: "t-garden", name: "High terrace", zones: ["plateau"], x: 5, y: 0, w: 2, h: 2, face: "s", level: 3 },
  { id: "t-yard", name: "High yard", zones: ["plateau"], x: 9, y: 0, w: 2, h: 2, face: "s", level: 3 },
  { id: "t-east", name: "East plateau", zones: ["plateau"], x: 11, y: 2, w: 2, h: 2, face: "w", level: 3 },

  // peaks
  { id: "s-falls", name: "Falls peak", zones: ["peak"], x: 2, y: 0, w: 1, h: 1, face: "s", level: 3 },
  { id: "s-north", name: "North peak", zones: ["peak"], x: 13, y: 0, w: 1, h: 1, face: "w", level: 3 },
  { id: "s-east", name: "East peak", zones: ["peak"], x: 13, y: 3, w: 1, h: 1, face: "w", level: 3 },
];

// What the town starts with: today's two stone bridges and four flights of steps. Free, and they stay put.
const CITY_STARTERS = [
  { project: "stonebridge", slot: "x-mid" }, { project: "stonebridge", slot: "x-east" },
  { project: "rockstairs", slot: "k-mid" }, { project: "rockstairs", slot: "k-bridge" },
  { project: "rockstairs", slot: "k-east" }, { project: "rockstairs", slot: "k-south" },
];

// Paved paths. Each appears once both ends are in use (a slot with something built, or a branch's own building,
// named "plot:<branch>"). via: the cells the path runs through, as [x, y] cell centres, low ground only.
const CITY_ROADS = [
  { id: "r-quay", ends: ["b-quay", "p-green"], via: [[4, 5.9], [4, 6.2]] },
  { id: "r-green-people", ends: ["p-green", "plot:people"], via: [[4.9, 7], [5.1, 7]] },
  { id: "r-meadow", ends: ["p-west", "p-green"], via: [[2, 7], [2.5, 7], [3, 7]] },
  { id: "r-row", ends: ["p-row", "plot:money"], via: [[8.5, 7.5], [9, 7.5]] },
  { id: "r-foot", ends: ["b-foot", "p-row"], via: [[8.5, 6.9], [8.5, 7.1]] },
  { id: "r-high", ends: ["t-garden", "t-yard"], via: [[7, 1.6], [7.5, 1.6], [8, 1.6], [8.5, 1.6], [9, 1.6]] },
  { id: "r-east", ends: ["t-yard", "t-east"], via: [[10.5, 2.1], [11, 2.4]] },
  { id: "r-knoll", ends: ["h-south", "plot:money"], via: [[9.5, 8.1], [9.5, 7.9]] },
];

const cityProject = id => CITY_PROJECTS.find(p => p.id === id);
const citySlot = id => CITY_SLOTS.find(s => s.id === id);

function cityStage(level) {
  return CITY_STAGES.filter(s => level >= s.from).pop() ?? CITY_STAGES[0];
}

// Does the project's footprint fit the slot, either way round, and do they share a zone?
function cityFits(project, slot) {
  const [w, d] = project.size;
  const room = (w <= slot.w && d <= slot.h) || (d <= slot.w && w <= slot.h);
  return room && project.zones.some(z => slot.zones.includes(z));
}

// Checks the tables against a terrain grid (rows of "~123" characters) and each other. Returns a list of problems,
// empty when all is well. tests/city-state.test.js runs it against the real CITY_TERRAIN, so a typo in a slot
// (off the map, in the river, overlapping a building) fails the tests instead of drawing something odd.
function cityCheckCatalogue(terrain, plots = {}) {
  const problems = [];
  const levelAt = (c, r) => { const ch = terrain[r]?.[c]; return ch === "~" ? 0 : Number(ch) || 0; };
  const taken = new Map();
  Object.entries(plots).forEach(([id, p]) => {
    for (let c = Math.round(p.x) - 1; c <= Math.round(p.x); c++) for (let r = Math.round(p.y) - 1; r <= Math.round(p.y); r++) taken.set(`${c},${r}`, `plot:${id}`);
  });
  const ids = new Set();
  CITY_SLOTS.forEach(slot => {
    if (ids.has(slot.id)) problems.push(`slot id used twice: ${slot.id}`);
    ids.add(slot.id);
    if (slot.zones.includes("crossing")) {
      const col = Math.floor(slot.x);
      const wet = [];
      for (let r = Math.ceil(slot.y); r < Math.floor(slot.y + slot.h); r++) wet.push(levelAt(col, r));
      if (!wet.length || wet.some(l => l !== 0)) problems.push(`${slot.id}: a crossing must span water`);
      return;
    }
    for (let c = slot.x; c < slot.x + slot.w; c++) for (let r = slot.y; r < slot.y + slot.h; r++) {
      if (terrain[r]?.[c] === undefined) { problems.push(`${slot.id}: cell ${c},${r} is off the map`); continue; }
      const level = levelAt(c, r);
      const want = slot.zones.includes("cliff") ? slot.low : slot.level;
      if (level !== want) problems.push(`${slot.id}: cell ${c},${r} is level ${level}, expected ${want}`);
      const key = `${c},${r}`;
      if (taken.has(key)) problems.push(`${slot.id}: cell ${key} is already used by ${taken.get(key)}`);
      taken.set(key, slot.id);
    }
    if (slot.zones.includes("cliff")) {
      const [dx, dy] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[slot.face];
      if (!slot.deck && levelAt(slot.x + dx, slot.y + dy) !== slot.high) problems.push(`${slot.id}: does not climb to level ${slot.high}`);
    }
    if (slot.zones.includes("riverbank")) {
      const edge = [];
      for (let c = slot.x - 1; c <= slot.x + slot.w; c++) for (let r = slot.y - 1; r <= slot.y + slot.h; r++) edge.push(levelAt(c, r));
      if (!edge.includes(0)) problems.push(`${slot.id}: a riverbank slot must touch water`);
    }
  });
  CITY_PROJECTS.forEach(p => {
    [...p.needs, ...(p.replaces ? [p.replaces] : [])].forEach(n => { if (!cityProject(n)) problems.push(`${p.id}: needs unknown project ${n}`); });
    if (!CITY_SLOTS.some(s => cityFits(p, s))) problems.push(`${p.id}: fits no slot`);
  });
  CITY_STARTERS.forEach(s => {
    if (!cityProject(s.project) || !citySlot(s.slot)) problems.push(`starter ${s.project}@${s.slot}: unknown project or slot`);
    else if (!cityFits(cityProject(s.project), citySlot(s.slot))) problems.push(`starter ${s.project} does not fit ${s.slot}`);
  });
  CITY_ROADS.forEach(road => road.ends.forEach(end => {
    if (!end.startsWith("plot:") && !citySlot(end)) problems.push(`road ${road.id}: unknown end ${end}`);
  }));
  return problems;
}
