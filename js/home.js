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

// Which function draws each mixed branch's split ring.
const MIXED_ROWS = { health: healthRow, academics: academicsRow };

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

document.getElementById("branches").innerHTML = BRANCHES.map(branch =>
  `<a class="branch-link" href="${branch.page}">${branch.name}</a>`
).join("");