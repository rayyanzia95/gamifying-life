// Money scoring: logs, deposits, weekly budget, savings goals.

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
