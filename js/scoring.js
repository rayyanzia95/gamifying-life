function setMaxXp(set) {
  if (set.type === "sunnah") {
    return (set.rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  if (set.type === "fard" || set.type === "wajib") {
    const rule = SCORING[set.type];
    return rule.base + rule.onTime + rule.masjid;
  }
  if (set.type === "tahajjud") {
    return SCORING.tahajjud.base + SCORING.tahajjud.longDua;
  }
  return 0;
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

function setEarnedXp(set, event) {
  if (set.type === "sunnah") {
    const rakah = event.rakah ?? set.rakah;
    return (rakah / 2) * SCORING.sunnahPerTwoRakah;
  }
  let xp = setBaseXp(set);
  if (set.type === "fard" || set.type === "wajib") {
    const rule = SCORING[set.type];
    if (event.onTime) xp += rule.onTime;
    if (event.masjid) xp += rule.masjid;
  }
  if (set.type === "tahajjud" && event.dua) {
    xp += event.long ? SCORING.tahajjud.longDua : SCORING.tahajjud.shortDua;
  }
  return xp;
}
function mainSet(prayer) {
  return prayer.sets.find(set => set.type === "fard") || prayer.sets[0];
}

function isCounted(event, events) {
  const prayer = PRAYERS.find(p => p.id === event.prayer);
  if (!prayer) return false;
  if (!prayer.sets.some(s => s.id === event.set)) return false;
  const main = mainSet(prayer);
  if (event.set === main.id) return true;
  return events.some(e =>
    e.date === event.date && e.prayer === event.prayer && e.set === main.id
  );
}

// What one event is worth: { branch, core, extra }, or null if it doesn't count.
// Core XP fills the daily goal; extra XP pushes the bar past it.
function scoreEvent(event, events) {
  if (event.activity === "quran") return scoreRevision(event);
  if (event.activity === "adhkar") return { branch: DUA.branch, core: DUA.adhkarXp, extra: 0 };
  if (event.activity === "dua") return scorePersonalDua(event);
  if (event.activity === "dua-after-prayers") {
    return { branch: DUA.branch, core: 0, extra: event.amount * DUA.afterFardXp };
  }
  if (event.activity === "chore") return scoreChore(event, events);
  if (event.activity === "sleep") return scoreSleep(event, events);
  if (isExercise(event)) return scoreExercise(event, events);
  if (isDiet(event)) return scoreDiet(event);
  if (isStudy(event)) return scoreStudy(event, events);
  if (isDeadlineTick(event)) return scoreDeadline(event);
  if (isMoneyLog(event)) return scoreMoneyLog(event, events);
  if (isDeposit(event)) return scoreDeposit(event, events);
  if (isPersonal(event)) return scorePersonal(event, events);
  if (!isCounted(event, events)) return null;
  const prayer = PRAYERS.find(p => p.id === event.prayer);
  const set = prayer.sets.find(s => s.id === event.set);
  const xp = setEarnedXp(set, event);
  const isExtra = Boolean(prayer.bonus || set.optional);
  // Older days logged dua after a prayer as a flag on the fard; keep their XP.
  const afterDua = set.type === "fard" && event.dua ? DUA.afterFardXp : 0;
  return {
    branch: prayer.branch,
    core: isExtra ? 0 : xp,
    extra: (isExtra ? xp : 0) + afterDua,
  };
}

function scorePersonalDua(event) {
  const xp = DUA.personal.base + (event.long ? DUA.personal.long : 0);
  return { branch: DUA.branch, core: 0, extra: xp };
}

function scoreRevision(event) {
  const toGoal = Math.min(event.amount, QURAN.dailyTarget);
  const beyond = event.amount - toGoal;
  return {
    branch: QURAN.branch,
    core: toGoal * QURAN.xpPerJuz,
    extra: beyond * QURAN.xpPerJuz,
  };
}

function xpByBranch(events) {
  const totals = {};
  for (const event of events) {
    const score = scoreEvent(event, events);
    if (!score) continue;
    totals[score.branch] = (totals[score.branch] || 0) + score.core + score.extra;
  }
  const bonus = choreBonusXp(events);
  if (bonus > 0) totals[CHORES.branch] = (totals[CHORES.branch] || 0) + bonus;
  const bossBonus = bossBonusXp(events, DEADLINES);
  if (bossBonus > 0) totals[ACADEMICS.branch] = (totals[ACADEMICS.branch] || 0) + bossBonus;
  const moneyBonus = moneyBonusXp(events, todayString());
  if (moneyBonus > 0) totals[MONEY.branch] = (totals[MONEY.branch] || 0) + moneyBonus;
  return totals;
}

// ---- Chores: weekly quests ----
// A quest's window is the weeks that cover it: this week, plus last week for
// everyWeeks: 2. Ticks count as core XP until the target is met in the window.

function isChore(event, choreId) {
  return event.activity === "chore" && event.chore === choreId;
}

function choreTarget(chore) {
  return chore.times ?? 1;
}

// The Sunday a chore's window starts, for the week starting on `week`.
function choreWindowStart(chore, week) {
  return shiftDate(week, -7 * ((chore.everyWeeks ?? 1) - 1));
}

// How many times a chore was done from `from` up to (not including) `to`.
function choreCount(events, choreId, from, to) {
  return events.filter(e => isChore(e, choreId) && e.date >= from && e.date < to).length;
}

// How many matching events since `from` came before this one: earlier days,
// or earlier in the list on the same day. Shared by chores and exercise.
function earlierMatches(events, event, from, matches) {
  const index = events.indexOf(event);
  return events.filter((e, i) =>
    matches(e) && e.date >= from &&
    (e.date < event.date || (e.date === event.date && i < index))
  ).length;
}

function scoreChore(event, events) {
  const chore = CHORES.list.find(c => c.id === event.chore);
  if (!chore) return null;
  const from = choreWindowStart(chore, weekStart(event.date));
  const before = earlierMatches(events, event, from, e => isChore(e, chore.id));
  const isCore = before < choreTarget(chore);
  return { branch: CHORES.branch, core: isCore ? chore.xp : 0, extra: isCore ? 0 : chore.xp };
}

// How many times a chore is due this week, before any of this week's ticks.
// Ironing done last week → 0, because last week's tick still covers it.
function choreDueThisWeek(events, chore, week) {
  const earlier = choreCount(events, chore.id, choreWindowStart(chore, week), week);
  return Math.max(choreTarget(chore) - earlier, 0);
}

// How many more times a chore needs doing this week.
function choreLeftThisWeek(events, chore, week) {
  const thisWeek = choreCount(events, chore.id, week, shiftDate(week, 7));
  return Math.max(choreDueThisWeek(events, chore, week) - thisWeek, 0);
}

function choreWeekDone(events, week) {
  return CHORES.list.every(chore => choreLeftThisWeek(events, chore, week) === 0);
}

// Full-week bonuses for every week that has chore ticks and every quest covered.
function choreBonusXp(events) {
  const weeks = new Set(events.filter(e => e.activity === "chore").map(e => weekStart(e.date)));
  const doneWeeks = [...weeks].filter(week => choreWeekDone(events, week));
  return doneWeeks.length * CHORES.weekBonus;
}

// The week's chore XP for the bar and the Home ring: { core, extra, goal, done }.
// goal only counts quests due this week, so ironing done last week drops out of it.
function choreWeek(events, week) {
  const end = shiftDate(week, 7);
  let core = 0;
  let extra = 0;
  for (const event of events) {
    if (event.activity !== "chore" || event.date < week || event.date >= end) continue;
    const score = scoreChore(event, events);
    if (!score) continue;
    core += score.core;
    extra += score.extra;
  }
  const goal = CHORES.list.reduce(
    (sum, chore) => sum + choreDueThisWeek(events, chore, week) * chore.xp, 0
  );
  const done = choreWeekDone(events, week);
  return { core, extra: extra + (done ? CHORES.weekBonus : 0), goal, done };
}

// ---- Sleep ----
// A night belongs to the morning you wake. Bedtimes are measured from that
// morning's midnight, so 22:40 is -80 and 00:15 is 15. Anything from noon on
// counts as the evening before.

function isSleep(event) {
  return event.activity === "sleep";
}

function bedMinutes(hhmm) {
  const minutes = toMinutes(hhmm);
  return minutes >= MINUTES_PER_DAY / 2 ? minutes - MINUTES_PER_DAY : minutes;
}

// Minutes in bed, from bedtime to the final wake. null until both times are in.
function minutesInBed(event) {
  if (!event.bed || !event.wake) return null;
  const minutes = toMinutes(event.wake) - bedMinutes(event.bed);
  return minutes > 0 ? minutes : null;
}

// Minutes asleep: time in bed minus the time awake for Fajr.
function minutesAsleep(event) {
  const inBed = minutesInBed(event);
  return inBed === null ? null : Math.max(inBed - (event.fajrGap ?? 0), 0);
}

// Average bedtime of the last few logged nights before `date`, or null with too few.
// toSorted returns a sorted copy, so the events array isn't changed.
function usualBedtime(events, date) {
  const nights = events
    .filter(e => isSleep(e) && e.bed && e.date < date)
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .slice(-SLEEP.usual.nights);
  if (nights.length < SLEEP.usual.minNights) return null;
  return nights.reduce((sum, e) => sum + bedMinutes(e.bed), 0) / nights.length;
}

// Which of the night's goals it met, keyed like SLEEP.xp, plus the usual bedtime.
function sleepChecks(event, events) {
  const bed = event.bed ? bedMinutes(event.bed) : null;
  const asleep = minutesAsleep(event);
  const usual = usualBedtime(events, event.date);
  return {
    bedtime: bed !== null && bed <= bedMinutes(SLEEP.bedBy),
    hours: asleep !== null && asleep >= SLEEP.hours * 60,
    consistent: bed !== null && usual !== null && Math.abs(bed - usual) <= SLEEP.usual.withinMinutes,
    usual,
  };
}

function scoreSleep(event, events) {
  const checks = sleepChecks(event, events);
  const core = Object.entries(SLEEP.xp).reduce((sum, [goal, xp]) => sum + (checks[goal] ? xp : 0), 0);
  return { branch: SLEEP.branch, core, extra: 0 };
}

function sleepGoal() {
  return Object.values(SLEEP.xp).reduce((sum, xp) => sum + xp, 0);
}

// ---- Exercise: weekly sessions ----
// One event per session: { date, activity: "exercise" }. The first EXERCISE.perWeek
// sessions of a week (Sun–Sat) are core XP; any more are bonus.

function isExercise(event) {
  return event.activity === "exercise";
}

function scoreExercise(event, events) {
  const before = earlierMatches(events, event, weekStart(event.date), isExercise);
  const isCore = before < EXERCISE.perWeek;
  return { branch: EXERCISE.branch, core: isCore ? EXERCISE.xp : 0, extra: isCore ? 0 : EXERCISE.xp };
}

// The dates of this week's sessions, oldest first (a date repeats for two sessions in a day).
function sessionDates(events, week) {
  const end = shiftDate(week, 7);
  return events.filter(e => isExercise(e) && e.date >= week && e.date < end).map(e => e.date);
}

// The week's sessions for the bar and the Home ring: { count, core, extra, goal }.
function exerciseWeek(events, week) {
  const count = sessionDates(events, week).length;
  const coreCount = Math.min(count, EXERCISE.perWeek);
  return {
    count,
    core: coreCount * EXERCISE.xp,
    extra: (count - coreCount) * EXERCISE.xp,
    goal: EXERCISE.perWeek * EXERCISE.xp,
  };
}

// ---- Diet: one event per day ----
// { date, activity: "diet", breakfast: "healthy", lunch: "okay", water: 6, creatine: true }

function isDiet(event) {
  return event.activity === "diet";
}

function mealXp(ratingId) {
  return DIET.ratings.find(r => r.id === ratingId)?.xp ?? 0;
}

function scoreDiet(event) {
  const meals = DIET.meals.reduce((sum, meal) => sum + mealXp(event[meal.id]), 0);
  const water = (event.water ?? 0) >= DIET.water.glasses ? DIET.water.xp : 0;
  const creatine = event.creatine ? DIET.creatineXp : 0;
  return { branch: DIET.branch, core: meals + water + creatine, extra: 0 };
}

// Best rating for every meal, plus water and creatine: 40.
function dietGoal() {
  const best = Math.max(...DIET.ratings.map(r => r.xp));
  return DIET.meals.length * best + DIET.water.xp + DIET.creatineXp;
}

// Health mixes daily parts with a weekly one: sleep and diet count today,
// sessions count over the week. Used by the Health bar and the Home ring.
function healthParts(events, today) {
  const night = events.find(e => isSleep(e) && e.date === today);
  const sleep = night ? scoreSleep(night, events) : { core: 0, extra: 0 };
  const day = events.find(e => isDiet(e) && e.date === today);
  const diet = day ? scoreDiet(day) : { core: 0, extra: 0 };
  return {
    sleep: { core: sleep.core, extra: sleep.extra, goal: sleepGoal() },
    diet: { core: diet.core, extra: diet.extra, goal: dietGoal() },
    exercise: exerciseWeek(events, weekStart(today)),
  };
}

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

// ---- Money ----
// A spend: { date, activity: "spend", cents: 850, category: "food" }, one per purchase.
// No spend today: { date, activity: "no-spend" }. A savings deposit: { date, activity: "deposit", cents }.
// The budget and savings goal are events too, so changing them later doesn't rescore
// past weeks: { date, activity: "budget", cents } and { date, activity: "savings-goal", name, cents }.
// Amounts are whole cents, because 0.1 + 0.2 isn't exactly 0.3 in JavaScript.

function isSpend(event) {
  return event.activity === "spend";
}

function isMoneyLog(event) {
  return event.activity === "spend" || event.activity === "no-spend";
}

function isDeposit(event) {
  return event.activity === "deposit";
}

function sumCents(events) {
  return events.reduce((total, e) => total + e.cents, 0);
}

// The first log of a day closes the day (core); a no-spend day adds a bonus.
function scoreMoneyLog(event, events) {
  const isFirst = earlierMatches(events, event, event.date, isMoneyLog) === 0;
  const bonus = event.activity === "no-spend" ? MONEY.noSpendXp : 0;
  return { branch: MONEY.branch, core: isFirst ? MONEY.dayXp : 0, extra: bonus };
}

// Only the first deposit of a week (Sun–Sat) earns XP; the rest still fill the goal.
function scoreDeposit(event, events) {
  const isFirst = earlierMatches(events, event, weekStart(event.date), isDeposit) === 0;
  return { branch: MONEY.branch, core: 0, extra: isFirst ? MONEY.depositXp : 0 };
}

// The latest event of a kind dated before `before`, or null.
function latestSetting(events, activity, before) {
  const matches = events.filter(e => e.activity === activity && e.date < before);
  return matches.reduce((latest, e) => (!latest || e.date >= latest.date ? e : latest), null);
}

// One week's money, all in cents except the XP. onTrack = the payout if the week
// ended now; banked = what it actually pays, 0 unless payoutMinDays were logged.
function moneyWeek(events, week) {
  const end = shiftDate(week, 7);
  const inWeek = events.filter(e => e.date >= week && e.date < end);
  const spent = sumCents(inWeek.filter(isSpend));
  const loggedDays = new Set(inWeek.filter(isMoneyLog).map(e => e.date)).size;
  const budget = latestSetting(events, "budget", end)?.cents ?? null;
  const left = budget ? Math.max(budget - spent, 0) : 0;
  const onTrack = budget ? Math.round((left / budget) * MONEY.payoutXp) : 0;
  const banked = loggedDays >= MONEY.payoutMinDays ? onTrack : 0;
  return { budget, spent, left, loggedDays, onTrack, banked };
}

// Savings goals in the order they were set. Each goal counts deposits from the day
// it was set until the next goal was set.
function savingsGoals(events) {
  const goals = events
    .filter(e => e.activity === "savings-goal")
    .sort((a, b) => a.date.localeCompare(b.date));
  return goals.map((goal, i) => {
    const until = goals[i + 1]?.date;
    const deposits = events.filter(e =>
      isDeposit(e) && e.date >= goal.date && (!until || e.date < until));
    const saved = sumCents(deposits);
    return { ...goal, saved, reached: saved >= goal.cents };
  });
}

// Bonus XP that isn't tied to one event: payouts for every finished week,
// plus every savings goal reached.
function moneyBonusXp(events, today) {
  const thisWeek = weekStart(today);
  const weeks = new Set(events.filter(isMoneyLog).map(e => weekStart(e.date)));
  const payouts = [...weeks]
    .filter(week => week < thisWeek)
    .reduce((total, week) => total + moneyWeek(events, week).banked, 0);
  const reached = savingsGoals(events).filter(goal => goal.reached).length;
  return payouts + reached * MONEY.goalXp;
}

// The two parts of Money's goal: today logged, and the payout this week is on
// track for. Deposit XP this week shows as the weekly part's extra.
function moneyParts(events, today) {
  const logs = events.filter(e => isMoneyLog(e) && e.date === today);
  const scores = logs.map(e => scoreMoneyLog(e, events));
  const week = weekStart(today);
  const deposits = events.filter(e => isDeposit(e) && e.date >= week && e.date <= today);
  const depositXp = deposits.reduce((total, e) => total + scoreDeposit(e, events).extra, 0);
  const thisWeek = moneyWeek(events, week);
  return {
    today: {
      logged: logs.length > 0,
      core: scores.reduce((total, s) => total + s.core, 0),
      extra: scores.reduce((total, s) => total + s.extra, 0),
      goal: MONEY.dayXp,
    },
    week: { ...thisWeek, core: thisWeek.onTrack, extra: depositXp, goal: MONEY.payoutXp },
  };
}

// ---- Personal ----
// Journal: { date, activity: "journal" }, one per day.
// A book: { date, activity: "book", id, title, pages }, added on the page (scores nothing).
// Reading: { date, activity: "read", book: id, page: 142 }, the page reached that day,
// one per book per day. Pages read = this page minus the book's page on an earlier day.
// Time alone: { date, activity: "alone" } and friends: { date, activity: "friends" },
// one per time. A quiet session: { date, activity: "session" }.

const PERSONAL_ACTIVITIES = ["journal", "read", "alone", "friends", "session"];

function isPersonal(event) {
  return PERSONAL_ACTIVITIES.includes(event.activity);
}

function isRead(event) {
  return event.activity === "read";
}

function books(events) {
  return events.filter(e => e.activity === "book");
}

// The page a book was on before `date` (0 if not started).
function pageBefore(events, bookId, date) {
  const earlier = latestSetting(events.filter(e => isRead(e) && e.book === bookId), "read", date);
  return earlier?.page ?? 0;
}

function pagesRead(event, events) {
  return Math.max(event.page - pageBefore(events, event.book, event.date), 0);
}

// XP for a day's total pages: 1 per 2 pages up to dayPages, then extraXp per extraPages.
function readingDayXp(pages) {
  const { dayPages, dayXp, extraPages, extraXp } = PERSONAL.reading;
  const core = Math.floor((Math.min(pages, dayPages) / dayPages) * dayXp);
  const extra = Math.floor(Math.max(pages - dayPages, 0) / extraPages) * extraXp;
  return { core, extra };
}

// A read event earns what it adds to the day's total, plus the finish bonus when it
// reaches the book's last page for the first time.
function scoreRead(event, events) {
  const index = events.indexOf(event);
  const before = events
    .filter((e, i) => isRead(e) && e.date === event.date && i < index)
    .reduce((total, e) => total + pagesRead(e, events), 0);
  const after = before + pagesRead(event, events);
  const was = readingDayXp(before);
  const now = readingDayXp(after);
  const book = books(events).find(b => b.id === event.book);
  const finished = book && event.page >= book.pages && pageBefore(events, book.id, event.date) < book.pages;
  return {
    branch: PERSONAL.branch,
    core: now.core - was.core,
    extra: now.extra - was.extra + (finished ? PERSONAL.reading.finishXp : 0),
  };
}

// Time alone and friends: the first perWeek of a week are core, the rest bonus.
function scoreWeekly(event, events, rule) {
  const before = earlierMatches(events, event, weekStart(event.date), e => e.activity === event.activity);
  const isCore = before < rule.perWeek;
  return { branch: PERSONAL.branch, core: isCore ? rule.xp : 0, extra: isCore ? 0 : rule.extraXp };
}

function scorePersonal(event, events) {
  if (event.activity === "journal") return { branch: PERSONAL.branch, core: PERSONAL.journalXp, extra: 0 };
  if (isRead(event)) return scoreRead(event, events);
  if (event.activity === "alone") return scoreWeekly(event, events, PERSONAL.alone);
  if (event.activity === "friends") return scoreWeekly(event, events, PERSONAL.friends);
  const isFirst = earlierMatches(events, event, weekStart(event.date), e => e.activity === "session") === 0;
  return { branch: PERSONAL.branch, core: 0, extra: isFirst ? PERSONAL.sessionXp : 0 };
}

// Personal's two parts: today (journal + reading) and this week (alone + friends).
// A session is left out on purpose: its XP only shows in the level, never on a ring or bar.
function personalParts(events, today) {
  const week = weekStart(today);
  const sum = list => list.reduce((total, e) => {
    const score = scorePersonal(e, events);
    return { core: total.core + score.core, extra: total.extra + score.extra };
  }, { core: 0, extra: 0 });
  const isDaily = e => e.activity === "journal" || isRead(e);
  const todays = events.filter(e => isPersonal(e) && isDaily(e) && e.date === today);
  const isWeekly = e => e.activity === "alone" || e.activity === "friends";
  const weeks = events.filter(e => isWeekly(e) && e.date >= week && e.date <= today);
  const count = activity => weeks.filter(e => e.activity === activity).length;
  const { alone, friends, journalXp, reading } = PERSONAL;
  return {
    today: { ...sum(todays), goal: journalXp + reading.dayXp },
    week: {
      ...sum(weeks),
      goal: alone.perWeek * alone.xp + friends.perWeek * friends.xp,
      alone: count("alone"),
      friends: count("friends"),
    },
  };
}

function levelInfo(xp, multiplier) {
  let level = 1;
  let into = xp;
  let cost = LEVELS.first * multiplier;
  while (into >= cost) {
    into -= cost;
    level += 1;
    cost = (LEVELS.first + LEVELS.step * (level - 1)) * multiplier;
  }
  return { level, into, cost };
}

function branchGoal(branchId) {
  let total = 0;
  for (const prayer of PRAYERS) {
    if (prayer.branch !== branchId) continue;
    for (const set of prayer.sets) {
      if (!(prayer.bonus || set.optional)) total += setMaxXp(set);
    }
  }
  if (QURAN.branch === branchId) total += QURAN.dailyTarget * QURAN.xpPerJuz;
  if (DUA.branch === branchId) total += DUA.adhkar.length * DUA.adhkarXp;
  if (SLEEP.branch === branchId) total += sleepGoal();
  if (DIET.branch === branchId) total += dietGoal();
  return total;
}

function todayXp(events, branchId) {
  const today = todayString();
  let core = 0;
  let extra = 0;
  for (const event of events) {
    if (event.date !== today) continue;
    const score = scoreEvent(event, events);
    if (!score || score.branch !== branchId) continue;
    core += score.core;
    extra += score.extra;
  }
  return { core, extra };
}