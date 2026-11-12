// Renders rewards.html: the overall level, your perks (real-life rewards you type in, each
// tied to an overall or a branch level) and your rest days. Perks are events:
//   { date, activity: "perk", id, text, branch: "overall" | "<branch id>", level }
//   { date, activity: "perk-claimed", perk: <perk id> }   (ticked once you've had it)
// Rest-day logic is in streak.js (restDaysHeld); levels in scoring.js (branchLevel).

const MAX_PERK_LENGTH = 60;
const MAX_PERK_LEVEL = 99;

const isPerk = e => e.activity === "perk";
const isClaim = e => e.activity === "perk-claimed";

function perkBranchName(branch) {
  return branch === "overall" ? "Overall" : BRANCHES.find(b => b.id === branch)?.name ?? branch;
}

// Each perk with where it stands: unlocked, claimed, and levels still to go.
function perkStates(events) {
  const claimed = new Set(events.filter(isClaim).map(e => e.perk));
  return events.filter(isPerk).map(perk => {
    const now = branchLevel(events, perk.branch === "overall" ? null : perk.branch).level;
    return { perk, claimed: claimed.has(perk.id), togo: Math.max(perk.level - now, 0) };
  });
}

// Unlocked ones first, then the closest, and the ones you've already had last.
function perkOrder(a, b) {
  const rank = s => (s.claimed ? 2 : s.togo === 0 ? 0 : 1);
  return rank(a) - rank(b) || a.togo - b.togo || a.perk.date.localeCompare(b.perk.date);
}

function saveAdded(event) {
  saveEvents([...loadEvents(), { date: todayString(), ...event }]);
  render();
}

function toggleClaim(perk, claimed) {
  const events = loadEvents();
  saveEvents(claimed
    ? events.filter(e => !(isClaim(e) && e.perk === perk.id))
    : [...events, { date: todayString(), activity: "perk-claimed", perk: perk.id }]);
  render();
}

function removePerk(perk) {
  saveEvents(loadEvents().filter(e => e.id !== perk.id && !(isClaim(e) && e.perk === perk.id)));
  render();
}

function perkRow({ perk, claimed, togo }) {
  const row = document.createElement("div");
  row.className = "perk-row" + (claimed ? " claimed" : "");

  const text = Object.assign(document.createElement("span"), { className: "perk-text", textContent: perk.text });
  const where = `${perkBranchName(perk.branch)} ${perk.level}`;
  const status = claimed ? "had it" : togo === 0 ? "unlocked" : `${togo} to go`;
  const level = Object.assign(document.createElement("span"),
    { className: "perk-level" + (!claimed && togo === 0 ? " open" : ""), textContent: `${where} · ${status}` });

  // Only an unlocked perk can be ticked (or a ticked one unticked); a locked one can be removed.
  if (togo === 0) {
    row.append(makeCheckbox(text, claimed, () => toggleClaim(perk, claimed)), level);
  } else {
    const remove = Object.assign(document.createElement("button"),
      { type: "button", className: "money-remove", textContent: "×" });
    remove.setAttribute("aria-label", "Remove " + perk.text);
    remove.addEventListener("click", () => removePerk(perk));
    row.append(text, level, remove);
  }
  return row;
}

function perkForm() {
  const form = document.createElement("form");
  form.className = "money-form";

  const text = Object.assign(document.createElement("input"),
    { className: "money-input perk-text-input", maxLength: MAX_PERK_LENGTH, placeholder: "A reward you'd like" });
  text.setAttribute("aria-label", "Reward");

  const branch = document.createElement("select");
  branch.className = "money-input perk-select";
  branch.setAttribute("aria-label", "Branch");
  for (const id of ["overall", ...BRANCHES.map(b => b.id)]) {
    branch.append(new Option(perkBranchName(id), id));
  }

  const level = Object.assign(document.createElement("input"),
    { className: "money-input perk-level-input", type: "number", min: 2, max: MAX_PERK_LEVEL, value: 2 });
  level.setAttribute("aria-label", "Level");

  const add = Object.assign(document.createElement("button"),
    { type: "submit", className: "filter-button", textContent: "Add" });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const goal = Math.round(Number(level.value));
    if (!text.value.trim() || !(goal >= 2 && goal <= MAX_PERK_LEVEL)) return;
    saveAdded({ activity: "perk", id: crypto.randomUUID(), text: text.value.trim(), branch: branch.value, level: goal });
  });
  form.append(text, branch, level, add);
  return form;
}

function drawOverall(events) {
  const info = branchLevel(events, null);
  document.getElementById("overall").innerHTML = `
    <div class="card-title">Overall level ${info.level}</div>
    <div class="bar"><div class="bar-fill" style="width: ${(info.into / info.cost) * 100}%"></div></div>
    <p>${info.into} / ${info.cost} XP to level ${info.level + 1}</p>`;
}

function drawPerks(events) {
  const section = document.getElementById("perks");
  const title = Object.assign(document.createElement("div"), { className: "card-title", textContent: "Perks" });
  const states = perkStates(events).sort(perkOrder);
  const empty = Object.assign(document.createElement("p"), { className: "muted",
    textContent: "Nothing yet. Add something you'd like, and the level that earns it." });
  section.replaceChildren(title, ...(states.length ? states.map(perkRow) : [empty]), perkForm());
}

function drawRest(events) {
  const held = restDaysHeld(events);
  const next = branchLevel(events, null).level + 1;
  const tokens = Array.from({ length: REWARDS.restMax }, (_, i) =>
    `<span class="token${i < held ? " full" : ""}"></span>`).join("");
  const left = held >= REWARDS.restMax
    ? "Full: a level-up now won't add another."
    : `Next at level ${next}.`;
  document.getElementById("rest").innerHTML = `
    <div class="card-title">Rest days <span class="tokens" aria-label="${held} of ${REWARDS.restMax}">${tokens}</span></div>
    <p>${held} saved · 1 for each overall level (up to ${REWARDS.restMax}). ${left}</p>
    <p class="muted">When a streak is paused, a "Use a rest day" button appears on it.</p>`;
}

function render() {
  const events = loadEvents();
  drawOverall(events);
  drawPerks(events);
  drawRest(events);
}

render();
