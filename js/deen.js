const goal = branchGoal("deen");

function findEvent(events, prayerId, setId) {
  return events.find(e =>
    e.date === todayString() && e.prayer === prayerId && e.set === setId
  );
}

function toggleDone(prayerId, setId) {
  let events = loadEvents();
  const prayer = PRAYERS.find(p => p.id === prayerId);
  const isMain = setId === mainSet(prayer).id;

  if (findEvent(events, prayerId, setId)) {
    events = events.filter(e => {
      const sameDay = e.date === todayString() && e.prayer === prayerId;
      if (!sameDay) return true;
      return !(isMain || e.set === setId);
    });
  } else {
    events.push({ date: todayString(), prayer: prayerId, set: setId });
  }
  saveEvents(events);
  render();
}

function toggleFlag(prayerId, setId, flag) {
  const events = loadEvents();
  const event = findEvent(events, prayerId, setId);
  if (!event) return;
  event[flag] = !event[flag];
  saveEvents(events);
  render();
}

function toggleJamaah(prayerId, setId) {
  const events = loadEvents();
  const event = findEvent(events, prayerId, setId);
  if (!event) return;

  const inJamaah = event.onTime && event.masjid;
  event.onTime = !inJamaah;
  event.masjid = !inJamaah;

  saveEvents(events);
  render();
}

function toggleDua(prayerId, setId) {
  const events = loadEvents();
  const event = findEvent(events, prayerId, setId);
  if (!event) return;
  event.dua = !event.dua;
  if (!event.dua) event.long = false;
  saveEvents(events);
  render();
}

function makeCheckbox(text, checked, onChange) {
  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = checked;
  box.addEventListener("change", onChange);
  label.append(box, " ", text);
  return label;
}

function stepRakah(prayerId, set, delta) {
  let events = loadEvents();
  const event = findEvent(events, prayerId, set.id);
  const next = (event ? (event.rakah ?? set.rakah) : 0) + delta;
  if (next < 0 || next > set.rakah) return;

  if (!event) {
    events.push({ date: todayString(), prayer: prayerId, set: set.id, rakah: next });
  } else if (next === 0) {
    events = events.filter(e => e !== event);
  } else {
    event.rakah = next;
  }
  saveEvents(events);
  render();
}

// The options object has defaults, so the rakah stepper can keep calling it
// with just four arguments.
function makeStepper(text, current, max, onStep, { step = 2, target = max, unit = "rakah" } = {}) {
  const row = document.createElement("div");
  row.className = "stepper";

  const minus = document.createElement("button");
  minus.textContent = "−";
  minus.setAttribute("aria-label", "Less " + unit);
  minus.disabled = current <= 0;
  minus.addEventListener("click", () => onStep(-step));

  const value = document.createElement("span");
  value.className = "stepper-value";
  value.textContent = current + " / " + target;

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.setAttribute("aria-label", "More " + unit);
  plus.disabled = current >= max;
  plus.addEventListener("click", () => onStep(step));

  row.append(minus, value, plus, " ", text);
  return row;
}

function setLabel(set, prayer) {
  let text = set.id.replace("-", " ");
  if (set.type === "sunnah") {
    const count = prayer.sets.filter(s => s.type === "sunnah").length;
    if (count === 1) text = "sunnah";
  } else if (set.rakah) {
    text += " (" + set.rakah + ")";
  }
  if (set.optional) text += " · extra";
  return text;
}

function render() {
  const events = loadEvents();
  const list = document.getElementById("prayers");
  list.innerHTML = "";

  for (const prayer of PRAYERS) {
    const main = mainSet(prayer);
    const mainEvent = findEvent(events, prayer.id, main.id);

    const item = document.createElement("li");
    const heading = document.createElement("div");
    const name = prayer.name + (prayer.bonus ? " (bonus)" : "");
    heading.append(makeCheckbox(name, Boolean(mainEvent), () => toggleDone(prayer.id, main.id)));
    item.append(heading);

    const addons = document.createElement("div");
    addons.className = "addons";

    if (mainEvent && main.type === "fard") {
      const inJamaah = Boolean(mainEvent.onTime && mainEvent.masjid);
      addons.append(makeCheckbox("jama'ah", inJamaah, () => toggleJamaah(prayer.id, main.id)));
      addons.append(makeCheckbox("on time", Boolean(mainEvent.onTime), () => toggleFlag(prayer.id, main.id, "onTime")));
      addons.append(makeCheckbox("masjid", Boolean(mainEvent.masjid), () => toggleFlag(prayer.id, main.id, "masjid")));
      addons.append(makeCheckbox("dua", Boolean(mainEvent.dua), () => toggleFlag(prayer.id, main.id, "dua")));
    }

    if (mainEvent && main.type === "tahajjud") {
      addons.append(makeCheckbox("dua", Boolean(mainEvent.dua), () => toggleDua(prayer.id, main.id)));
      if (mainEvent.dua) {
        addons.append(makeCheckbox("10+ min", Boolean(mainEvent.long), () => toggleFlag(prayer.id, main.id, "long")));
      }
    }

    for (const set of prayer.sets) {
      if (set !== main && !mainEvent) continue;
      const event = findEvent(events, prayer.id, set.id);

      if (set !== main) {
        const row = document.createElement("div");
        if (set.stepper) {
          const done = event ? (event.rakah ?? set.rakah) : 0;
          row.append(makeStepper(setLabel(set, prayer), done, set.rakah, delta => stepRakah(prayer.id, set, delta)));
        } else {
          row.append(makeCheckbox(setLabel(set, prayer), Boolean(event), () => toggleDone(prayer.id, set.id)));
        }
        if (event && set.type === "wajib") {
          row.append(" ", makeCheckbox("on time", Boolean(event.onTime), () => toggleFlag(prayer.id, set.id, "onTime")));
        }
        addons.append(row);
      }
    }

    item.append(addons);
    list.append(item);
  }

  const { core, extra } = todayXp(events, "deen");
  const total = core + extra;
  const corePercent = Math.min((core / goal) * 100, 100);
  const bonusPercent = Math.min((extra / goal) * 100, 100 - corePercent);
  document.getElementById("bar-fill").style.width = corePercent + "%";
  document.getElementById("bonus-fill").style.width = bonusPercent + "%";
  document.getElementById("progress-label").textContent = total + " / " + goal + " XP today";
  document.getElementById("bonus").textContent = extra > 0 ? "includes " + extra + " bonus XP" : "";

  const deen = levelInfo(xpByBranch(events).deen || 0, 1);
  document.getElementById("levels").innerHTML = badgeHtml("Deen", deen);
  drawTiles(events);
  drawRevision(events);
  drawQuranProgress(events);
  drawDua(events);
  drawDial(events);
  document.getElementById("view-prayers").hidden = selectedView !== "prayers";
  document.getElementById("view-quran").hidden = selectedView !== "quran";
  document.getElementById("view-dua").hidden = selectedView !== "dua";
}

// Which detail shows under the tiles: "prayers" or "quran".
// Starts on the one you picked in Settings.
let selectedView = loadSettings().deenView;

function selectView(view) {
  selectedView = view;
  render();
}

// A tile: tapping it (anywhere but its own controls) picks the view below.
// summary is a list of text and elements, e.g. ["Next: Juz 3 · ", streakBadge].
function makeTile(view, title, summary, controls) {
  const isSelected = selectedView === view;
  const tile = document.createElement("section");
  tile.className = isSelected ? "tile selected" : "tile";
  tile.addEventListener("click", e => {
    if (!e.target.closest("button, input, label")) selectView(view);
  });

  const open = document.createElement("button");
  open.type = "button";
  open.className = "tile-title";
  open.textContent = title;
  open.setAttribute("aria-pressed", String(isSelected));
  open.addEventListener("click", () => selectView(view));

  const text = document.createElement("p");
  text.append(...summary);

  tile.append(open, text, ...controls);
  return tile;
}

// Prayers tile: today's count, plus a quick tick for the prayer whose time it is.
function prayerTile(events) {
  const daily = PRAYERS.filter(p => !p.bonus);
  const prayed = daily.filter(p => findEvent(events, p.id, mainSet(p).id)).length;
  const summary = [`${prayed} / ${daily.length} today`];

  const windows = prayerWindows(todayString());
  const current = windows && currentWindow(windows, nowMinutes());
  if (!current) return makeTile("prayers", "Prayers", summary, []);

  const prayer = PRAYERS.find(p => p.id === current.id);
  const main = mainSet(prayer);
  const tick = makeCheckbox(prayer.name + " · now", Boolean(findEvent(events, prayer.id, main.id)),
    () => toggleDone(prayer.id, main.id));
  return makeTile("prayers", "Prayers", summary, [tick]);
}

function quranTile(events) {
  const stepper = makeStepper("juz", todayRevision(events), QURAN.total,
    delta => stepRevision(delta), { step: 1, target: QURAN.dailyTarget, unit: "juz" });
  const next = "Next: " + juzLabel(nextJuz(events));
  const streak = revisionStreak(events);
  const summary = streak.days > 0 ? [next + " · ", streakBadge(streak)] : [next];
  return makeTile("quran", "Quran", summary, [stepper]);
}

// "🔥 5", dimmed while the streak is paused.
function streakBadge({ days, paused }) {
  const badge = document.createElement("span");
  badge.className = paused ? "streak paused" : "streak";
  badge.textContent = `🔥 ${days}`;
  badge.setAttribute("aria-label", `${days}-day streak${paused ? ", paused" : ""}`);
  return badge;
}

// action is what keeps the streak going, e.g. "Revise" or "Make dua".
function streakLabel({ days, paused }, action) {
  if (days === 0) return `${action} today to start a streak`;
  const text = `🔥 ${days}-day streak`;
  return paused ? `${text} · paused, ${action.toLowerCase()} today to keep it` : text;
}

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

function drawTiles(events) {
  document.getElementById("tiles").replaceChildren(
    prayerTile(events), quranTile(events), duaTile(events)
  );
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

// Save today's juz count as one event, replacing any earlier one for today.
function stepRevision(delta) {
  const events = loadEvents();
  const next = todayRevision(events) + delta;
  if (next < 0 || next > QURAN.total) return;
  const today = todayString();
  const others = events.filter(e => !(isRevision(e) && e.date === today));
  const updated = next > 0
    ? [...others, { date: today, activity: "quran", amount: next }]
    : others;
  saveEvents(updated);
  render();
}

// Quran detail: Ramadan countdown, streak, and the pace needed to finish.
function drawRevision(events) {
  const { done, completed } = revisionProgress(events);
  const daysLeft = daysBetween(todayString(), RAMADAN_START);
  const countdown = daysLeft > 0 ? `${daysLeft} days to Ramadan` : "Ramadan Mubarak";
  const finished = completed > 0
    ? ` · ${completed} full revision${completed > 1 ? "s" : ""} done`
    : "";

  document.getElementById("revision").innerHTML = `
    <div class="card-row">
      <span class="card-title">Quran revision</span>
      <span class="muted">${countdown}</span>
    </div>
    <p>${streakLabel(revisionStreak(events), "Revise")}</p>
    <p>Next: ${juzLabel(nextJuz(events))}${finished}</p>
    <p>${paceLabel(QURAN.total - done, daysLeft)}</p>`;
}

// Top card: a bar toward finishing this revision of all 30 juz.
function drawQuranProgress(events) {
  const { done } = revisionProgress(events);
  document.getElementById("quran-progress").innerHTML = `
    <div class="card-row">
      <span class="summary-label">Quran</span>
      <span class="muted">${done} / ${QURAN.total} juz</span>
    </div>
    <div class="bar"><div class="bar-fill" style="width: ${(done / QURAN.total) * 100}%"></div></div>`;
}

function drawDial(events) {
  const box = document.getElementById("dial");
  const windows = prayerWindows(todayString());
  if (!windows) {
    box.innerHTML = "<p>No prayer times for today yet. Add the next timetable to js/prayer-times.js.</p>";
    return;
  }
  const prayedIds = PRAYERS
    .filter(prayer => findEvent(events, prayer.id, mainSet(prayer).id))
    .map(prayer => prayer.id);
  box.innerHTML = dialHtml(windows, prayedIds, nowMinutes());
}

render();

// Every minute: move the dial's hand and update which prayer the tile offers.
setInterval(() => {
  const events = loadEvents();
  drawTiles(events);
  drawDial(events);
}, 60 * 1000);