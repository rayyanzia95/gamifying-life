// Quran screens on the Deen page: the tile, the detail card and the top bar.
// Uses makeStepper and streakBadge from ui.js, and makeTile, streakLabel and render from deen.js.
// That works because these functions only run after every script has loaded.

function quranTile(events) {
  const stepper = makeStepper("juz", todayRevision(events), QURAN.total,
    delta => stepRevision(delta), { step: QURAN.step, target: QURAN.dailyTarget, unit: "juz" });
  const next = "Next: " + juzLabel(nextJuz(events));
  const streak = revisionStreak(events);
  const summary = streak.days > 0 || streak.rest ? [next + " · ", streakBadge(streak)] : [next];
  return makeTile("quran", "Quran", summary, [stepper]);
}

function stepRevision(delta) {
  const next = todayRevision(loadEvents()) + delta;
  if (next < 0 || next > QURAN.total) return;
  saveTodayAmount("quran", next);
}

// Quran detail: Ramadan countdown, streak, and the pace needed to finish.
function drawRevision(events) {
  const { done, completed } = revisionProgress(events);
  const daysLeft = daysBetween(todayString(), RAMADAN_START);
  const countdown = daysLeft > 0 ? `${daysLeft} days to Ramadan` : "Ramadan Mubarak";
  const finished = completed > 0
    ? ` · ${completed} full revision${completed > 1 ? "s" : ""} done`
    : "";

  document.getElementById("revision").innerHTML = `
    <div class="card-row">
      <span class="card-title">Quran revision</span>
      <span class="muted">${countdown}</span>
    </div>
    <p>${streakLabel(revisionStreak(events), "Revise")}</p>
    <p>Next: ${juzLabel(nextJuz(events))}${finished}</p>
    <p>${paceLabel(QURAN.total - done, daysLeft)}</p>`;
}

// Top card: a bar toward finishing this revision of all 30 juz.
function drawQuranProgress(events) {
  const { done } = revisionProgress(events);
  document.getElementById("quran-progress").innerHTML = `
    <div class="card-row">
      <span class="summary-label">Quran</span>
      <span class="muted">${done} / ${QURAN.total} juz</span>
    </div>
    <div class="bar"><div class="bar-fill" style="width: ${(done / QURAN.total) * 100}%"></div></div>`;
}
