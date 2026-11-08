const goal = totalMax({ extras: false });
document.getElementById("goal").textContent = "Daily goal: " + goal + " XP";

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

function makeCheckbox(text, checked, onChange) {
  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = checked;
  box.addEventListener("change", onChange);
  label.append(box, " ", text);
  return label;
}

function render() {
  const events = loadEvents();
  const list = document.getElementById("prayers");
  list.innerHTML = "";
  let earned = 0;

  for (const prayer of PRAYERS) {
    const item = document.createElement("li");
    item.append(prayer.name + (prayer.bonus ? " (bonus)" : ""));

    for (const set of prayer.sets) {
      const event = findEvent(events, prayer.id, set.id);
      const row = document.createElement("div");
      const text = set.rakah ? set.type + " " + set.rakah : set.type;

      row.append(makeCheckbox(text, Boolean(event), () => toggleDone(prayer.id, set.id)));

      if (event) {
        earned += setEarnedXp(set, event);

        if (set.type === "fard" || set.type === "wajib") {
          row.append(" ", makeCheckbox("on time", Boolean(event.onTime), () => toggleFlag(prayer.id, set.id, "onTime")));
        }
        if (set.type === "fard") {
          row.append(" ", makeCheckbox("masjid", Boolean(event.masjid), () => toggleFlag(prayer.id, set.id, "masjid")));
        }
      }
      item.append(row);
    }
    list.append(item);
  }

  document.getElementById("earned").textContent = "Earned today: " + earned + " XP";
}

render();