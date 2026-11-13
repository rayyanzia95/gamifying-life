// Set by render() below, which runs again when sync pulls new events (sync.js redrawPage).
let events, totals, overallXp, branches, overall;
// A branch's share of today (0..1) is what its ring shows. A branch with parts adds each part's
// (core + extra), capped at that part's goal, over the sum of the goals.
function partsShare(parts) {
  const list = Object.values(parts).filter(part => part.goal > 0);
  const goal = list.reduce((sum, part) => sum + part.goal, 0);
  const done = list.reduce((sum, part) => sum + Math.min(part.core + part.extra, part.goal), 0);
  return goal > 0 ? done / goal : 0;
}

// One quiet line on the day a level is reached: "Health reached level 3 · reward: new shoes".
// The reward is the perk set for that branch and level (the first one, if there are several).
function levelUpLine(up) {
  const name = up.branch ? BRANCHES.find(b => b.id === up.branch).name : "Overall";
  const perk = events.find(e => e.activity === "perk" && e.branch === (up.branch ?? "overall") && e.level === up.level);
  return `${name} reached level ${up.level}` + (perk ? ` · reward: ${perk.text}` : "");
}

function drawLevelNote() {
  const note = document.getElementById("level-note");
  const lines = levelUpsToday(events).map(levelUpLine);
  note.hidden = lines.length === 0;
  note.textContent = lines.join(" · ");
}

// Which function gives each mixed branch's parts (today and this week side by side).
const MIXED_PARTS = {
  health: healthParts, academics: academicsParts, money: moneyParts, personal: personalParts, people: peopleParts,
};

// One quiet line when a birthday or the anniversary is close and not wished yet:
// "Birthday in 3 days". No name on Home, only the kind of date.
function drawPeopleNote() {
  const today = todayString();
  const wished = d => events.some(e => isWished(e) && e.label === d.label && e.on === d.on);
  const next = upcomingDates(events, today).find(d => d.days <= PEOPLE.homeNoteDays && !wished(d));
  const note = document.getElementById("people-note");
  note.hidden = !next;
  if (!next) return;
  const kind = PEOPLE.dateKinds.find(k => k.id === next.kind)?.name ?? "A date";
  note.textContent = `${kind} ${countdownLabel(today, next.on)}`;
}

// A weekly branch (Chores) fills its ring over the week, a mixed one (Health, Academics...)
// adds its daily and weekly parts together, and the rest fill each day.
function branchShare(branch) {
  if (branch.period === "mixed") return partsShare(MIXED_PARTS[branch.id](events, todayString()));
  if (branch.period === "week") return partsShare({ week: choreWeek(events, weekStart(todayString())) });
  const today = todayXp(events, branch.id);
  return partsShare({ today: { ...today, goal: branchGoal(branch.id) } });
}

function render() {
  events = loadEvents();
  totals = xpByBranch(events);
  overallXp = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  branches = BRANCHES.map(b => ({ ...b, ...levelOf(totals, b.id), share: branchShare(b) }));
  overall = levelInfo(overallXp, LEVELS.overallMultiplier);
  // Appearance → Layout: the Cockpit HUD (hud-home.js), the Orrery (orrery-home.js), the Command wheel
  // (wheel-home.js) and the Grimoire ledger (codex.js) draw their own Home; every other layout keeps the card.
  const HOME_LAYOUTS = { hud: hudHomeHtml, orrery: orreryHomeHtml, wheel: wheelHomeHtml, codex: codexHomeHtml, city: cityHomeHtml };
  const layoutHome = HOME_LAYOUTS[document.documentElement.dataset.layout];
  document.getElementById("home-card").innerHTML =
    layoutHome ? layoutHome(events, overall, overallXp, branches) : homeCardHtml(overall, branches);
  if (document.documentElement.dataset.layout === "city") cityHomeMount();
  drawPeopleNote();
  drawLevelNote();
  drawQuickLog(events);
}

setupQuickLog();
render();
