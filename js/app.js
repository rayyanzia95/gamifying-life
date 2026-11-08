const goal = totalMax({ extras: false });
document.getElementById("goal").textContent = "Daily goal: " + goal + " XP";

function isDone(events, prayerId, setId) {
  return events.some(e =>
    e.date === todayString() && e.prayer === prayerId && e.set === setId
  );
}

function toggle(prayerId, setId) {
  let events = loadEvents();
  if (isDone(events, prayerId, setId)) {
    events = events.filter(e =>
      !(e.date === todayString() && e.prayer === prayerId && e.set === setId)
    );
  } else {
    events.push({ date: todayString(), prayer: prayerId, set: setId });
  }
  saveEvents(events);
  render();
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
      const label = document.createElement("label");
      label.style.display = "block";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = isDone(events, prayer.id, set.id);
      box.addEventListener("change", () => toggle(prayer.id, set.id));

      if (box.checked) earned += setBaseXp(set);

      const text = set.rakah ? set.type + " " + set.rakah : set.type;
      label.append(box, " ", text);
      item.append(label);
    }
    list.append(item);
  }

  document.getElementById("earned").textContent = "Earned today: " + earned + " XP";
}

render();