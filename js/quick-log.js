// Home quick logging: pure writers. Each saves the SAME event shape its branch page saves (see the
// function named in each comment) and returns an undo function. No page render() here: Home redraws itself.
// Needs storage.js, config.js, scoring.js and the score-*.js files (mainSet, isChore, isStudy, isDiet...).
//
// Undo works by event id: whatever the tap added is removed, whatever it removed or changed is put back,
// and everything else (say, events sync pulled in meanwhile) is left alone.

const MAX_SPEND_DOLLARS = 100000; // same typo limit as money-page.js

function qlId() {
  return crypto.randomUUID();
}

// Save change(events) and return the undo. change must not mutate its argument.
function qlCommit(change) {
  const before = loadEvents();
  const after = change(before);
  saveEvents(after);
  const was = new Map(before.map(e => [e.id, e]));
  const now = new Set(after.map(e => e.id));
  const added = after.filter(e => !was.has(e.id));
  const changed = after.filter(e => was.has(e.id) && was.get(e.id) !== e);
  const removed = before.filter(e => !now.has(e.id));
  const restore = [...removed, ...changed.map(e => was.get(e.id))];
  const gone = new Set([...added, ...changed].map(e => e.id));
  return () => saveEvents([...loadEvents().filter(e => !gone.has(e.id)), ...restore]);
}

// This week's latest match, like the "undo the latest tick" buttons on the branch pages.
const qlLastThisWeek = (events, matches) =>
  events.findLast(e => matches(e) && e.date >= weekStart(todayString()));

const qlWithout = (events, target) => events.filter(e => e !== target);

// Deen: the fard tick, like toggleDone(prayerId, mainSet.id) in deen.js. Unticking also drops that prayer's
// other events for today (as the Deen page does) and lowers "dua after prayers" if it is now too high.
function qlTogglePrayer(prayerId) {
  const prayer = PRAYERS.find(p => p.id === prayerId);
  const setId = mainSet(prayer).id;
  const today = todayString();
  return qlCommit(events => {
    const has = events.some(e => e.date === today && e.prayer === prayerId && e.set === setId);
    if (!has) return [...events, { id: qlId(), date: today, prayer: prayerId, set: setId }];
    const rest = events.filter(e => !(e.date === today && e.prayer === prayerId));
    const prayed = PRAYERS.filter(p => mainSet(p).type === "fard")
      .filter(p => rest.some(e => e.date === today && e.prayer === p.id && e.set === mainSet(p).id)).length;
    return rest
      .map(e => (e.date === today && e.activity === "dua-after-prayers" && e.amount > prayed ? { ...e, amount: prayed } : e))
      .filter(e => !(e.activity === "dua-after-prayers" && e.amount === 0));
  });
}

// Deen: Quran revision for today, like saveTodayAmount("quran", n) in deen.js. A tick means the daily target.
function qlToggleQuran() {
  const today = todayString();
  return qlCommit(events => {
    const others = events.filter(e => !(e.date === today && e.activity === "quran"));
    return others.length < events.length ? others : [...others, { id: qlId(), date: today, activity: "quran", amount: QURAN.dailyTarget }];
  });
}

// Deen: morning / evening adhkar, like toggleToday in dua-view.js.
function qlToggleAdhkar(time) {
  const today = todayString();
  const mine = e => e.date === today && e.activity === "adhkar" && e.time === time;
  return qlCommit(events => events.some(mine)
    ? events.filter(e => !mine(e))
    : [...events, { id: qlId(), date: today, activity: "adhkar", time }]);
}

// Chores: one event per time done, like addChore / removeChore in chores-page.js.
const qlAddChore = choreId => qlCommit(events =>
  [...events, { id: qlId(), date: todayString(), activity: "chore", chore: choreId }]);

function qlRemoveChore(choreId) {
  return qlCommit(events => {
    const last = qlLastThisWeek(events, e => isChore(e, choreId));
    return last ? qlWithout(events, last) : events;
  });
}

// Academics: one event per 30-minute block, like addBlock / removeBlock in academics-page.js.
const qlAddStudy = courseId => qlCommit(events =>
  [...events, { id: qlId(), date: todayString(), activity: "study", course: courseId }]);

function qlRemoveStudy() {
  return qlCommit(events => {
    const last = events.findLast(e => isStudy(e) && e.date === todayString());
    return last ? qlWithout(events, last) : events;
  });
}

// Academics: tick or untick a deadline, like toggleDeadline in deadline-list.js.
function qlToggleDeadline(id) {
  return qlCommit(events => events.some(e => isDeadlineTick(e) && e.deadline === id)
    ? events.filter(e => !(isDeadlineTick(e) && e.deadline === id))
    : [...events, { id: qlId(), date: todayString(), activity: "deadline", deadline: id }]);
}

// Health: today's single diet event with its water changed by delta glasses, like saveDiet({ water }) in health-page.js.
function qlAddWater(delta) {
  const today = todayString();
  return qlCommit(events => {
    const day = events.find(e => isDiet(e) && e.date === today) ?? { id: qlId(), date: today, activity: "diet" };
    const next = { ...day, water: Math.max((day.water ?? 0) + delta, 0) };
    return [...events.filter(e => e !== day), next];
  });
}

// Health: one gym / climbing session, like addSession / removeSession in health-page.js.
const qlAddSession = () => qlCommit(events => [...events, { id: qlId(), date: todayString(), activity: "exercise" }]);

function qlRemoveSession() {
  return qlCommit(events => {
    const last = qlLastThisWeek(events, isExercise);
    return last ? qlWithout(events, last) : events;
  });
}

// Personal: journalled today, like toggleJournal in personal-page.js.
function qlSetJournal(on) {
  const today = todayString();
  return qlCommit(events => {
    const rest = events.filter(e => !(e.activity === "journal" && e.date === today));
    return on ? [...rest, { id: qlId(), date: today, activity: "journal" }] : rest;
  });
}

// Money: "8.50" or "$8.50" → 850. null if it isn't a positive amount (same rule as parseCents in money-page.js).
function qlParseCents(text) {
  const value = Number(text.trim().replace(/^\$/, ""));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_SPEND_DOLLARS) return null;
  return Math.round(value * 100);
}

// Money: a spend today; it also ends that day's no-spend, like addSpend in money-page.js.
function qlAddSpend(cents, category) {
  const today = todayString();
  return qlCommit(events => [
    ...events.filter(e => !(e.activity === "no-spend" && e.date === today)),
    { id: qlId(), date: today, activity: "spend", cents, category },
  ]);
}

// Money: "No spend today", like toggleNoSpend in money-page.js.
function qlToggleNoSpend() {
  const today = todayString();
  const mine = e => e.activity === "no-spend" && e.date === today;
  return qlCommit(events => events.some(mine)
    ? events.filter(e => !mine(e))
    : [...events, { id: qlId(), date: today, activity: "no-spend" }]);
}
