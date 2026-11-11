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
  saveEvents(clampAfterPrayerDua(events));
  render();
}

// Save today's count for an activity as one event (none when it's 0),
// replacing any earlier one for today. Used by the juz and dua counters.
function saveTodayAmount(activity, amount) {
  const today = todayString();
  const others = loadEvents().filter(e => !(e.date === today && e.activity === activity));
  const updated = amount > 0 ? [...others, { date: today, activity, amount }] : others;
  saveEvents(updated);
  render();
}

// Replace today's event for this prayer set with change(event), leaving the rest alone.
function updateEvent(prayerId, setId, change) {
  const events = loadEvents();
  const target = findEvent(events, prayerId, setId);
  if (!target) return;
  saveEvents(events.map(e => (e === target ? change(e) : e)));
  render();
}

// [flag] uses the variable's value as the key, e.g. { ...e, masjid: !e.masjid }.
function toggleFlag(prayerId, setId, flag) {
  updateEvent(prayerId, setId, e => ({ ...e, [flag]: !e[flag] }));
}

// Jama'ah means you prayed on time, so ticking it ticks on time too.
// Unticking it leaves on time alone; masjid is separate either way.
function toggleJamaah(prayerId, setId) {
  updateEvent(prayerId, setId, e => ({ ...e, jamaah: !e.jamaah, onTime: e.jamaah ? e.onTime : true }));
}

// The other direction: not on time means it can't have been jama'ah.
function toggleOnTime(prayerId, setId) {
  updateEvent(prayerId, setId, e => ({ ...e, onTime: !e.onTime, jamaah: e.onTime ? false : e.jamaah }));
}

function toggleDua(prayerId, setId) {
  updateEvent(prayerId, setId, e => ({ ...e, dua: !e.dua, long: e.dua ? false : e.long }));
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
      addons.append(makeCheckbox("jama'ah", Boolean(mainEvent.jamaah), () => toggleJamaah(prayer.id, main.id)));
      addons.append(makeCheckbox("on time", Boolean(mainEvent.onTime), () => toggleOnTime(prayer.id, main.id)));
      addons.append(makeCheckbox("masjid", Boolean(mainEvent.masjid), () => toggleFlag(prayer.id, main.id, "masjid")));
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

// Which detail shows under the tiles: "prayers", "quran" or "dua".
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

  const current = currentWindow(prayerWindows(todayString()), nowMinutes());
  if (!current) return makeTile("prayers", "Prayers", summary, []);

  const prayer = PRAYERS.find(p => p.id === current.id);
  const main = mainSet(prayer);
  const tick = makeCheckbox(prayer.name + " · now", Boolean(findEvent(events, prayer.id, main.id)),
    () => toggleDone(prayer.id, main.id));
  return makeTile("prayers", "Prayers", summary, [tick]);
}

// quranTile lives in quran-view.js, duaTile in dua-view.js.
function drawTiles(events) {
  document.getElementById("tiles").replaceChildren(
    prayerTile(events), quranTile(events), duaTile(events)
  );
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

// The dial's dua state from the last draw, so only new ticks animate.
// null until the first draw, which shows everything without animating.
let lastDialDua = null;

function drawDial(events) {
  const box = document.getElementById("dial");
  const windows = prayerWindows(todayString());
  const prayedIds = PRAYERS
    .filter(prayer => findEvent(events, prayer.id, mainSet(prayer).id))
    .map(prayer => prayer.id);
  const dua = duaToday(events);
  box.innerHTML = dialHtml(windows, prayedIds, nowMinutes(), dua, lastDialDua ?? dua);
  lastDialDua = dua;
}

render();

// Every minute: move the dial's hand and update which prayer the tile offers.
setInterval(() => {
  const events = loadEvents();
  drawTiles(events);
  drawDial(events);
}, 60 * 1000);