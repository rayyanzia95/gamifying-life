const goal = totalMax({ extras: false });
document.getElementById("goal").textContent = "Daily goal: " + goal + " XP";

const list = document.getElementById("prayers");

for (const prayer of PRAYERS) {
  const coreSets = prayer.sets.filter(set => !set.optional);
  const max = coreSets.reduce((sum, set) => sum + setMaxXp(set), 0);

  const item = document.createElement("li");
  item.textContent = prayer.name + ": up to " + max + (prayer.bonus ? " XP (bonus)" : " XP");
  list.appendChild(item);
}