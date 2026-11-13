// Academics scoring: study blocks, deadlines and exam bosses.

// ---- Academics: study blocks and deadlines ----
// A study block: { date, activity: "study", course: "phys" }, one event per 30 minutes.
// A ticked deadline: { date, activity: "deadline", deadline: "phys-midterm-2" },
// dated the day you ticked it.

function isStudy(event) {
  return event.activity === "study";
}

function isDeadlineTick(event) {
  return event.activity === "deadline";
}

// { course: "phys", title: "Lab 7 report" } → "phys-lab-7-report".
function deadlineId(deadline) {
  const slug = deadline.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${deadline.course}-${slug}`;
}

// "phys" → "PHYS"
function courseShort(courseId) {
  return ACADEMICS.courses.find(c => c.id === courseId)?.short ?? courseId;
}

function deadlineXp(deadline) {
  return ACADEMICS.deadlineXp[deadline.kind] ?? 0;
}

// The first blocksPerDay blocks of a day are core, any after that are bonus.
function scoreStudy(event, events) {
  const before = earlierMatches(events, event, event.date, isStudy);
  const isCore = before < ACADEMICS.blocksPerDay;
  const xp = ACADEMICS.blockXp;
  return { branch: ACADEMICS.branch, core: isCore ? xp : 0, extra: isCore ? 0 : xp };
}

// A tick for a deadline that's no longer in DEADLINES scores nothing.
function scoreDeadline(event) {
  const deadline = DEADLINES.find(d => deadlineId(d) === event.deadline);
  if (!deadline) return null;
  return { branch: ACADEMICS.branch, core: deadlineXp(deadline), extra: 0 };
}

// Ids of every deadline you've ticked, as a Set for quick has() checks.
function tickedDeadlines(events) {
  return new Set(events.filter(isDeadlineTick).map(e => e.deadline));
}

// Deadlines due from `from` up to (not including) `to`, in date order.
function deadlinesBetween(from, to) {
  return DEADLINES
    .filter(d => d.date >= from && d.date < to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// The next `count` exams from today that aren't ticked yet, soonest first
// (the Planner's exam strip and the Study page both show these).
function nextExams(events, today, count) {
  const ticked = tickedDeadlines(events);
  return deadlinesBetween(today, "9999")
    .filter(d => d.kind === "exam" && !ticked.has(deadlineId(d)))
    .slice(0, count);
}

// The two parts of Academics' goal: study blocks today, and the XP of every
// deadline due this week (Sun–Sat), so a busy week has a bigger goal.
function academicsParts(events, today) {
  const blocks = events.filter(e => isStudy(e) && e.date === today);
  const scores = blocks.map(e => scoreStudy(e, events));
  const sum = (items, value) => items.reduce((total, item) => total + value(item), 0);

  const week = weekStart(today);
  const due = deadlinesBetween(week, shiftDate(week, 7));
  const ticked = tickedDeadlines(events);
  const done = due.filter(d => ticked.has(deadlineId(d)));
  return {
    study: {
      count: blocks.length,
      core: sum(scores, s => s.core),
      extra: sum(scores, s => s.extra),
      goal: ACADEMICS.blocksPerDay * ACADEMICS.blockXp,
    },
    deadlines: {
      count: done.length,
      total: due.length,
      core: sum(done, deadlineXp),
      extra: bossBonusXp(events, due),
      goal: sum(due, deadlineXp),
    },
  };
}

// ---- Academics: exams as bosses ----
// A boss's HP is its exam's hp. Every study block for that course from windowDays
// before the exam up to the exam day knocks off 1 HP. Nothing is stored: HP is
// worked out from the study events each time.

function isBoss(deadline) {
  return deadline.kind === "exam" && deadline.hp > 0;
}

// { hp, left, opens, beaten, ticked }. opens = the first day blocks count.
// beaten = ticked with no HP left, which earns the bonus.
function bossState(events, exam, ticked) {
  const opens = shiftDate(exam.date, -ACADEMICS.boss.windowDays);
  const hits = events.filter(e =>
    isStudy(e) && e.course === exam.course && e.date >= opens && e.date <= exam.date
  ).length;
  const left = Math.max(exam.hp - hits, 0);
  const isTicked = ticked.has(deadlineId(exam));
  return { hp: exam.hp, left, opens, ticked: isTicked, beaten: isTicked && left === 0 };
}

// Bonus XP for every beaten boss among these deadlines.
function bossBonusXp(events, deadlines) {
  const ticked = tickedDeadlines(events);
  const beaten = deadlines.filter(d => isBoss(d) && bossState(events, d, ticked).beaten);
  return beaten.length * ACADEMICS.boss.bonusXp;
}
