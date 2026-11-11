const events = loadEvents();

const totals = xpByBranch(events);
const overallXp = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
document.getElementById("overall").innerHTML =
  badgeHtml("Overall", levelInfo(overallXp, LEVELS.overallMultiplier));

// Health's ring in two colours: sleep today, then this week's sessions.
function healthRow(name) {
  const { sleep, diet, exercise } = healthParts(events, todayString());
  return {
    name,
    parts: [
      { ...sleep, colour: "sleep", text: `${sleep.core + sleep.extra} / ${sleep.goal} sleep` },
      { ...diet, colour: "diet", text: `${diet.core + diet.extra} / ${diet.goal} diet` },
      { ...exercise, colour: "exercise", text: `${exercise.count} / ${EXERCISE.perWeek} sessions` },
    ],
  };
}

// Academics' ring: study blocks today, then this week's deadlines. A week with
// nothing due has no deadline part (a part needs a goal to size it).
function academicsRow(name) {
  const { study, deadlines } = academicsParts(events, todayString());
  const studyPart = { ...study, colour: "study", text: `${study.count} / ${ACADEMICS.blocksPerDay} blocks` };
  const duePart = { ...deadlines, colour: "due", text: `${deadlines.count} / ${deadlines.total} due` };
  return { name, parts: deadlines.goal > 0 ? [studyPart, duePart] : [studyPart] };
}

// Money's ring: today logged (green), then the payout this week is on track for (gold).
// No dollars on Home: only XP and whether today is logged.
function moneyRow(name) {
  const { today, week } = moneyParts(events, todayString());
  return {
    name,
    parts: [
      { ...today, colour: "exercise", text: today.logged ? "logged today" : "not logged" },
      { ...week, colour: "due", text: `${week.core} / ${week.goal} payout` },
    ],
  };
}

// Personal's ring: journal + reading today (plum), then time alone + friends this week (teal).
function personalRow(name) {
  const { today, week } = personalParts(events, todayString());
  return {
    name,
    parts: [
      { ...today, colour: "plum", text: `${today.core + today.extra} / ${today.goal} today` },
      { ...week, colour: "teal", text: `${week.core} / ${week.goal} week` },
    ],
  };
}

// People's ring: checked in today (green), then calls home this week (gold).
function peopleRow(name) {
  const { today, week } = peopleParts(events, todayString());
  return {
    name,
    parts: [
      { ...today, colour: "exercise", text: today.checkedIn ? "checked in" : "not yet" },
      { ...week, colour: "due", text: `${week.count} / ${PEOPLE.callsHomePerWeek} calls home` },
    ],
  };
}

// Which function draws each mixed branch's split ring.
const MIXED_ROWS = {
  health: healthRow, academics: academicsRow, money: moneyRow, personal: personalRow, people: peopleRow,
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

// A weekly branch (Chores) fills its ring over the week, a mixed one (Health,
// Academics) is split into daily and weekly parts, and the rest fill each day.
const rows = BRANCHES.map(branch => {
  if (branch.period === "mixed") return MIXED_ROWS[branch.id](branch.name);
  if (branch.period === "week") {
    const week = choreWeek(events, weekStart(todayString()));
    return { name: branch.name, core: week.core, extra: week.extra, goal: week.goal, weekly: true };
  }
  const today = todayXp(events, branch.id);
  return {
    name: branch.name,
    core: today.core,
    extra: today.extra,
    goal: branchGoal(branch.id),
  };
});
document.getElementById("rings").innerHTML = ringsHtml(rows);
drawPeopleNote();

document.getElementById("branches").innerHTML = BRANCHES.map(branch =>
  `<a class="branch-link" href="${branch.page}">${branch.name}</a>`
).join("");