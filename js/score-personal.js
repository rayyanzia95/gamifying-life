// Personal scoring: journal, reading, time alone, friends, quiet sessions.

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
