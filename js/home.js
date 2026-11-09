const events = loadEvents();

const totals = xpByBranch(events);
const overallXp = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
document.getElementById("overall").innerHTML =
  badgeHtml("Overall", levelInfo(overallXp, LEVELS.overallMultiplier));

const rows = BRANCHES.map(branch => {
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