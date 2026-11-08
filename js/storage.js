const STORAGE_KEY = "gamifying-life-events";

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function setBaseXp(set) {
  if (set.type === "sunnah") {
    return (set.rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  if (set.type === "fard" || set.type === "wajib") {
    return SCORING[set.type].base;
  }
  if (set.type === "tahajjud") {
    return SCORING.tahajjud.base;
  }
  return 0;
}