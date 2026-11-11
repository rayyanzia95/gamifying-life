// Dua screens on the Deen page: the tile and the detail card.
// Uses makeCheckbox and makeStepper from ui.js, and makeTile, saveTodayAmount, streakBadge, streakLabel
// and render from deen.js. Fine, because they only run after every script loads.

// Dua tile (full row): adhkar and personal dua ticks, plus the after-prayers counter.
function duaTile(events) {
  const done = `${adhkarDoneToday(events)} / ${DUA.adhkar.length} adhkar`;
  const streak = duaStreak(events);
  const summary = streak.days > 0 ? [done + " · ", streakBadge(streak)] : [done];
  const controls = [...adhkarTicks(events), personalTick(events), afterPrayerStepper(events)];
  return makeTile("dua", "Dua", summary, controls);
}

function personalTick(events) {
  return makeCheckbox("Made my own dua", Boolean(todayEvent(events, isPersonalDua)),
    () => toggleToday(isPersonalDua, { activity: "dua" }));
}

// − 2 / 5 +: + stops at the number of fards ticked today.
function afterPrayerStepper(events) {
  return makeStepper("after prayers", afterPrayerDuaToday(events), fardsPrayedToday(events),
    delta => saveTodayAmount("dua-after-prayers", afterPrayerDuaToday(loadEvents()) + delta),
    { step: 1, target: DAILY_FARDS, unit: "dua after prayers" });
}

function adhkarTicks(events) {
  return DUA.adhkar.map(a => makeCheckbox(a.name, Boolean(todayEvent(events, e => isAdhkar(e, a.id))),
    () => toggleToday(e => isAdhkar(e, a.id), { activity: "adhkar", time: a.id })));
}

// Tick or untick a once-a-day activity for today, without changing the old list.
function toggleToday(matches, newEvent) {
  const events = loadEvents();
  const today = todayString();
  const isToday = e => e.date === today && matches(e);
  const updated = events.some(isToday)
    ? events.filter(e => !isToday(e))
    : [...events, { date: today, ...newEvent }];
  saveEvents(updated);
  render();
}

function togglePersonalLong() {
  const today = todayString();
  const updated = loadEvents().map(e =>
    e.date === today && isPersonalDua(e) ? { ...e, long: !e.long } : e
  );
  saveEvents(updated);
  render();
}

// Dua detail: adhkar, the dua-after-prayers counter, personal dua (+ 10+ min).
function drawDua(events) {
  const card = document.getElementById("dua");
  const streak = duaStreak(events);

  const header = document.createElement("div");
  header.className = "card-row";
  header.innerHTML = `<span class="card-title">Dua</span>`;
  const streakText = document.createElement("span");
  streakText.className = "muted";
  streakText.textContent = streakLabel(streak, "Make dua");
  header.append(streakText);

  const personal = todayEvent(events, isPersonalDua);
  const personalTicks = [personalTick(events)];
  if (personal) {
    personalTicks.push(makeCheckbox("10+ min", Boolean(personal.long), togglePersonalLong));
  }

  card.replaceChildren(
    header,
    duaGroup(`Adhkar · ${DUA.adhkarXp} XP each`, adhkarTicks(events)),
    duaGroup(`After prayers · ${DUA.afterFardXp} XP each`, [afterPrayerStepper(events)]),
    duaGroup(`Personal dua · ${DUA.personal.base} XP, +${DUA.personal.long} for 10+ min`, personalTicks)
  );
}

function duaGroup(title, ticks) {
  const group = document.createElement("div");
  group.className = "dua-group";
  const heading = document.createElement("p");
  heading.textContent = title;
  const row = document.createElement("div");
  row.className = "tick-row";
  row.append(...ticks);
  group.append(heading, row);
  return group;
}
