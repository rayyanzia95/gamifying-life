// City builder, part 2 of 5: the state. One pure function turns the event log into the town as it stands, the same
// way XP and levels are worked out: nothing is stored as a total, everything is computed from events.
// No DOM and no three.js here. Needs catalogue.js loaded first.
//
// The events (saved with saveEvents like any other, so they sync):
//   { date, activity: "city-build", project: "docks", slot: "b-quay", at: 1794700000000 }
//   `at` is the moment it was placed (Date.now()). It orders builds, and it decides who keeps a slot when two
//   devices built in the same place while offline: the earlier one stays, the later one comes back unplaced.
// Moving a project edits its event's slot (same id). Removing one deletes the event. Both are free, always.
//
// Never punish: a project whose prerequisite was later moved or removed stays standing, and a build that can't be
// placed (slot taken, no blueprint left) is never lost. It waits in `unplaced` and costs nothing until it is placed.

const isCityBuild = event => event.activity === "city-build";

// One blueprint per overall level gained: none at level 1, the first at level 2, so the first build is earned.
const cityBlueprintsEarned = level => Math.max(Math.floor(level) - 1, 0);

// level: the overall level. options.allowLater: accept the terrain-changing projects (off for the first slice).
// options.earned: how many monuments of each kind have been earned, e.g. { boss: 2, ramadan: 1 }.
// Returns { level, stage, earned, spent, free, built, bySlot, unplaced, has(id), count(id) }.
//   built: [{ slot, project, starter, event }] in the order they went up.
//   unplaced: [{ event, reason }] with reason "unknown" | "fit" | "taken" | "unique" | "blueprint" | "later" | "earned".
function cityState(events, level, options = {}) {
  const earned = cityBlueprintsEarned(level);
  const bySlot = new Map();
  const built = [];
  const unplaced = [];
  let spent = 0;
  const count = id => built.filter(b => b.project === id).length;
  const stand = (slot, project, starter, event) => {
    const entry = { slot, project, starter, event };
    const old = bySlot.get(slot);
    if (old) built.splice(built.indexOf(old), 1); // an upgrade takes the old project's place
    bySlot.set(slot, entry);
    built.push(entry);
  };

  CITY_STARTERS.forEach(s => stand(s.slot, s.project, true, null));

  const monuments = {};
  const ordered = events.filter(isCityBuild)
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
  for (const event of ordered) {
    const project = cityProject(event.project);
    const slot = citySlot(event.slot);
    const reject = reason => unplaced.push({ event, reason });
    if (!project || !slot) { reject("unknown"); continue; }
    if (project.later && !options.allowLater) { reject("later"); continue; }
    if (!cityFits(project, slot)) { reject("fit"); continue; }
    const there = bySlot.get(slot.id);
    const upgrade = there && !there.starter && project.replaces === there.project;
    if (there && !upgrade) { reject("taken"); continue; }
    if (project.unique && count(project.id) > 0) { reject("unique"); continue; }
    if (project.earned) {
      const have = options.earned?.[project.earned] ?? 0;
      if ((monuments[project.earned] ?? 0) >= have) { reject("earned"); continue; }
      monuments[project.earned] = (monuments[project.earned] ?? 0) + 1;
    }
    if (spent + project.cost > earned) { reject("blueprint"); continue; }
    spent += project.cost;
    stand(slot.id, project.id, false, event);
  }

  return {
    level, stage: cityStage(level), earned, spent, free: earned - spent, built, bySlot, unplaced,
    has: id => count(id) > 0, count,
    monumentsLeft: kind => (options.earned?.[kind] ?? 0) - (monuments[kind] ?? 0),
    options,
  };
}

// Can this project go in this slot right now? { ok: true } or { ok: false, reason: "words to show" }.
function cityCanBuild(state, projectId, slotId) {
  const project = cityProject(projectId);
  const slot = citySlot(slotId);
  if (!project || !slot) return { ok: false, reason: "That isn't on the map" };
  if (project.later && !state.options.allowLater) return { ok: false, reason: "Coming later: it changes the land" };
  if (!cityFits(project, slot)) return { ok: false, reason: `Doesn't fit ${slot.name.toLowerCase()}` };
  const there = state.bySlot.get(slot.id);
  if (there && !(project.replaces === there.project && !there.starter)) {
    return { ok: false, reason: there.starter ? "Part of the old town" : `${cityProject(there.project).name} stands here` };
  }
  if (project.replaces && !there) return { ok: false, reason: `Upgrades a ${cityProject(project.replaces).name.toLowerCase()}` };
  if (project.unique && state.has(project.id)) return { ok: false, reason: "The town has one already" };
  const missing = project.needs.filter(id => !state.has(id));
  if (missing.length) return { ok: false, reason: `Needs ${missing.map(id => cityProject(id).name.toLowerCase()).join(" and ")} first` };
  if (project.earned && state.monumentsLeft(project.earned) <= 0) return { ok: false, reason: "Earned, not bought" };
  if (project.cost > state.free) return { ok: false, reason: project.cost > 1 ? `Needs ${project.cost} blueprints` : "No blueprint left" };
  return { ok: true };
}

// The build menu for one slot: every project that could ever go here, buildable ones first.
// [{ project, ok, reason }]. An empty slot that only fits upgrades lists the thing they upgrade.
function cityMenu(state, slotId) {
  const slot = citySlot(slotId);
  const there = state.bySlot.get(slotId);
  return CITY_PROJECTS
    .filter(p => cityFits(p, slot))
    .filter(p => (there ? p.replaces === there.project : !p.replaces || !CITY_PROJECTS.some(q => q.id === p.replaces && cityFits(q, slot))))
    .map(project => ({ project, ...cityCanBuild(state, project.id, slotId) }))
    .sort((a, b) => Number(b.ok) - Number(a.ok));
}

// Free slots worth lighting up in build mode: empty, or holding something that can be upgraded.
function cityOpenSlots(state) {
  return CITY_SLOTS.filter(slot => cityMenu(state, slot.id).length > 0 && !state.bySlot.get(slot.id)?.starter);
}

// Slots where something can be built right now (a blueprint to spend, the prerequisite standing, a monument
// earned): the ones build mode lights up. With nothing to spend this is empty, and build mode is for moving.
function cityBuildableSlots(state) {
  return CITY_SLOTS.filter(slot => cityMenu(state, slot.id).some(option => option.ok));
}

// ---- Writers. Each returns a new events array (never changes the one passed in), or null if it can't be done. ----

function cityBuild(events, state, projectId, slotId, now, date) {
  if (!cityCanBuild(state, projectId, slotId).ok) return null;
  return [...events, { date, activity: "city-build", project: projectId, slot: slotId, at: now }];
}

// Move what stands in one slot to another empty slot it fits. Free. Starters never move.
function cityMove(events, state, fromSlot, toSlot) {
  const entry = state.bySlot.get(fromSlot);
  const target = citySlot(toSlot);
  if (!entry || entry.starter || !target || state.bySlot.has(toSlot)) return null;
  if (!cityFits(cityProject(entry.project), target)) return null;
  return events.map(e => (e === entry.event ? { ...e, slot: toSlot } : e));
}

// Take a project down. Its blueprint comes back. Starters stay.
function cityRemove(events, state, slotId) {
  const entry = state.bySlot.get(slotId);
  if (!entry || entry.starter) return null;
  return events.filter(e => e !== entry.event);
}

// Put an unplaced build somewhere it fits (after two devices built in the same slot).
function cityReplace(events, state, event, toSlot) {
  const check = cityCanBuild(state, event.project, toSlot);
  return check.ok ? events.map(e => (e === event ? { ...e, slot: toSlot } : e)) : null;
}

// Roads that show: both ends in use. A branch's own building ("plot:<id>") always counts as in use.
function cityRoads(state) {
  const used = end => end.startsWith("plot:") || state.bySlot.has(end);
  return CITY_ROADS.filter(road => road.ends.every(used));
}

// One line for the corner of the map: "Village · 2 blueprints".
function citySummary(state) {
  const n = state.free;
  return `${state.stage.name} · ${n === 0 ? "no blueprints" : n === 1 ? "1 blueprint" : `${n} blueprints`}`;
}
