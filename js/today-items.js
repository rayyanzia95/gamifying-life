// What is due today, as data (no DOM): Home's "Now" strip and Today checklist draw from this.
// Needs hud-home.js (hudPrayers), sun.js, prayer-calc.js and the scoring files.
// An item: { act, label, sub, done, count?, goal?, later?, branch }. act is what a tap does (quick-log-ui.js).

// Each prayer's open window today in minutes: Fajr to sunrise, then each runs to the next prayer; Isha to midnight.
function todayPrayerWindows(events, today) {
  const prayers = hudPrayers(events, today);
  const starts = prayers.map(p => Math.round(p.hour * 60));
  const closes = [sunriseMinutes(today), starts[2], starts[3], starts[4], MINUTES_PER_DAY];
  return prayers.map((p, i) => ({
    id: p.name.toLowerCase(), name: prayerLabel(p.name), start: starts[i], end: closes[i], done: p.done,
  }));
}

const prayerLabel = name => name[0] + name.slice(1).toLowerCase();

// Where the day's prayers stand at `now` (minutes): the open window (if any) and the next one still to open.
function prayerNow(events, today, now) {
  const windows = todayPrayerWindows(events, today);
  return {
    windows,
    current: windows.find(w => now >= w.start && now < w.end) ?? null,
    next: windows.find(w => w.start > now) ?? null,
  };
}

function lastStudyCourse(events) {
  return events.findLast(isStudy)?.course ?? ACADEMICS.courses[0].id;
}

function deenItems(events, today, now) {
  const items = prayerNow(events, today, now).windows.map(w => ({
    act: `pray:${w.id}`, label: w.name, done: w.done, later: now < w.start,
    sub: now < w.start ? `opens ${clock12(w.start)}` : w.done ? "" : now < w.end ? `open until ${clock12(w.end)}` : "window closed",
  }));
  const juz = todayRevision(events);
  items.push({ act: "quran", label: "Quran revision", done: juz >= QURAN.dailyTarget, sub: juz > 0 && juz < QURAN.dailyTarget ? `${juz} juz so far` : "" });
  for (const a of DUA.adhkar) {
    items.push({ act: `adhkar:${a.id}`, label: `${a.name} adhkar`, done: events.some(e => e.date === today && isAdhkar(e, a.id)), sub: "" });
  }
  return items;
}

// Quests worth showing today: a counted one (dishes 3x), one whose usual day is today, or any ticked today.
function choreItems(events, today) {
  const week = weekStart(today);
  const day = new Date().toLocaleDateString("en-US", { weekday: "short" });
  return CHORES.list.flatMap(chore => {
    const left = choreLeftThisWeek(events, chore, week);
    const tickedToday = events.some(e => isChore(e, chore.id) && e.date === today);
    const counted = choreTarget(chore) > 1;
    if (!(tickedToday || (left > 0 && (counted || chore.hint === day)))) return [];
    const count = Math.min(choreCount(events, chore.id, week, shiftDate(week, 7)), choreTarget(chore));
    return [{ act: `chore:${chore.id}`, label: chore.name, done: left === 0, count: counted ? count : undefined,
      goal: counted ? choreTarget(chore) : undefined, sub: counted ? "tap to add one time" : "" }];
  });
}

function healthItems(events, today) {
  const week = weekStart(today);
  const sessions = events.filter(e => isExercise(e) && e.date >= week && e.date < shiftDate(week, 7));
  const water = events.find(e => isDiet(e) && e.date === today)?.water ?? 0;
  return [
    { act: "workout", label: "Workout", done: sessions.some(e => e.date === today), sub: `${sessions.length} of ${EXERCISE.perWeek} this week` },
    { act: "water", label: "Water", done: water >= DIET.water.glasses, count: Math.min(water, DIET.water.glasses),
      goal: DIET.water.glasses, sub: "tap to add a glass" },
  ];
}

function academicsItems(events, today) {
  const blocks = events.filter(e => isStudy(e) && e.date === today).length;
  const ticked = tickedDeadlines(events);
  const due = deadlinesBetween(today, shiftDate(today, 1)).map(d => ({
    act: `deadline:${deadlineId(d)}`, label: `${courseShort(d.course)} ${d.title}`, done: ticked.has(deadlineId(d)), sub: `due today · ${d.time}`,
  }));
  return [{ act: "study", label: "Study blocks", done: blocks >= ACADEMICS.blocksPerDay,
    count: Math.min(blocks, ACADEMICS.blocksPerDay), goal: ACADEMICS.blocksPerDay, sub: `${ACADEMICS.blockMinutes} min each` }, ...due];
}

function moneyLoggedToday(events, today) {
  return events.some(e => e.date === today && (e.activity === "spend" || e.activity === "no-spend"));
}

// Groups in branch order; each { id, name, items, done, total }. A counted item is one item (done when full).
function todayItems(events, today, now) {
  const byBranch = {
    deen: deenItems(events, today, now),
    chores: choreItems(events, today),
    health: healthItems(events, today),
    academics: academicsItems(events, today),
    personal: [{ act: "journal", label: "Journalled today", done: events.some(e => e.activity === "journal" && e.date === today), sub: "" }],
    money: [{ act: "spend", label: "Money logged today", done: moneyLoggedToday(events, today),
      sub: events.some(e => e.date === today && e.activity === "no-spend") ? "no spend today" : "a spend, or no spend" }],
  };
  return BRANCHES.filter(b => byBranch[b.id]?.length).map(b => {
    const items = byBranch[b.id].map(item => ({ ...item, branch: b.id }));
    return { id: b.id, name: b.name, items, done: items.filter(i => i.done).length, total: items.length };
  });
}
