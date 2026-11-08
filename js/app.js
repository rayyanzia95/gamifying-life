const goal = totalMax({ extras: false });

function findEvent(events, prayerId, setId) {
  return events.find(e =>
    e.date === todayString() && e.prayer === prayerId && e.set === setId
  );
}

function toggleDone(prayerId, setId) {
  let events = loadEvents();
  if (findEvent(events, prayerId, setId)) {
    events = events.filter(e =>
      !(e.date === todayString() && e.prayer === prayerId && e.set === setId)
    );
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
  let events = loadEvents();
  const event = findEvent(events, prayerId, setId);

  if (event && event.onTime && event.masjid) {
    events = events.filter(e => e !== event);
  } else if (event) {
    event.onTime = true;
    event.masjid = true;
  } else {
    events.push({
      date: todayString(), prayer: prayerId, set: setId,
      onTime: true, masjid: true
    });
  }
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

function mainSet(prayer) {
  return prayer.sets.find(set => set.type === "fard") || prayer.sets[0];
}

function setLabel(set) {
  let text = set.id.replace("-", " ");
  if (set.rakah) text += " (" + set.rakah + ")";
  if (set.optional) text += " · extra";
  return text;
}

function render() {
  const events = loadEvents();
  const list = document.getElementById("prayers");
  list.innerHTML = "";
  let core = 0;
  let extra = 0;

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

    if (main.type === "fard") {
      const inJamaah = Boolean(mainEvent && mainEvent.onTime && mainEvent.masjid);
      addons.append(makeCheckbox("jama'ah", inJamaah, () => toggleJamaah(prayer.id, main.id)));
    }
    if (mainEvent && main.type === "fard") {
      addons.append(makeCheckbox("on time", Boolean(mainEvent.onTime), () => toggleFlag(prayer.id, main.id, "onTime")));
      addons.append(makeCheckbox("masjid", Boolean(mainEvent.masjid), () => toggleFlag(prayer.id, main.id, "masjid")));
    }

    for (const set of prayer.sets) {
      const event = findEvent(events, prayer.id, set.id);

      if (set !== main) {
        const row = document.createElement("div");
        row.append(makeCheckbox(setLabel(set), Boolean(event), () => toggleDone(prayer.id, set.id)));
        if (event && set.type === "wajib") {
          row.append(" ", makeCheckbox("on time", Boolean(event.onTime), () => toggleFlag(prayer.id, set.id, "onTime")));
        }
        addons.append(row);
      }

      if (event) {
        const xp = setEarnedXp(set, event);
        if (prayer.bonus || set.optional) {
          extra += xp;
        } else {
          core += xp;
        }
      }
    }

    item.append(addons);
    list.append(item);
  }

  const percent = Math.min((core / goal) * 100, 100);
  document.getElementById("bar-fill").style.width = percent + "%";
  document.getElementById("progress-label").textContent = core + " / " + goal + " XP today";
  document.getElementById("bonus").textContent = extra > 0 ? "+ " + extra + " bonus XP" : "";
}

render();