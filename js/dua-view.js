// Dua screens on the Deen page: the tile and the detail card.
// Uses makeTile, makeCheckbox, streakBadge, streakLabel, findEvent, toggleFlag
// and render from deen.js. Fine, because they only run after every script loads.

// Dua tile: both adhkar ticks right on the tile.
function duaTile(events) {
  const done = `${adhkarDoneToday(events)} / ${DUA.adhkar.length} adhkar`;
  const streak = duaStreak(events);
  const summary = streak.days > 0 ? [done + " · ", streakBadge(streak)] : [done];
  return makeTile("dua", "Dua", summary, adhkarTicks(events));
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

// Dua detail: adhkar, dua after each prayer (same tick as the prayer list), personal dua.
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

  const afterPrayers = PRAYERS.filter(p => !p.bonus).map(prayer => {
    const event = findEvent(events, prayer.id, mainSet(prayer).id);
    const tick = makeCheckbox(prayer.name, Boolean(event && event.dua),
      () => toggleFlag(prayer.id, mainSet(prayer).id, "dua"));
    tick.querySelector("input").disabled = !event; // pray it first
    return tick;
  });

  const personal = todayEvent(events, isPersonalDua);
  const personalTicks = [makeCheckbox("Made my own dua", Boolean(personal),
    () => toggleToday(isPersonalDua, { activity: "dua" }))];
  if (personal) {
    personalTicks.push(makeCheckbox("10+ min", Boolean(personal.long), togglePersonalLong));
  }

  card.replaceChildren(
    header,
    duaGroup(`Adhkar · ${DUA.adhkarXp} XP each`, adhkarTicks(events)),
    duaGroup(`After prayers · ${DUA.afterFardXp} XP each`, afterPrayers),
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
