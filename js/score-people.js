// People scoring: contacts, wishes, home calls, upcoming dates.

// ---- People ----
// Names and dates are typed in on the People page, so they live only in events.
// A person: { date, activity: "person", name, group }, removed by deleting that event.
// A call/text/visit: { date, activity: "contact", name, group, kind: "call" | "text" | "visit" };
// the group is copied in, so a call home still counts after the person is removed.
// A date: { date, activity: "people-date", label, kind, day: "12-04" }, repeats every year.
// Wished / gift done: { date, activity: "wished", label, on: "2026-12-04" } (that year's date).

function isContact(event) {
  return event.activity === "contact";
}

function isWished(event) {
  return event.activity === "wished";
}

function isHomeCall(event) {
  return isContact(event) && event.kind === "call" && event.group === PEOPLE.homeGroup;
}

function peopleList(events) {
  return events.filter(e => e.activity === "person");
}

// The latest call/text/visit with someone, or null.
function lastContact(events, name) {
  return events.reduce((latest, e) =>
    isContact(e) && e.name === name && (!latest || e.date >= latest.date) ? e : latest, null);
}

// Texts after the day's first contact earn a little bonus, up to textXpPerDay a day.
function textBonus(event, events, isFirst) {
  if (isFirst || event.kind !== "text") return 0;
  const first = events.find(e => isContact(e) && e.date === event.date);
  const earlierTexts = earlierMatches(events, event, event.date, e => isContact(e) && e.kind === "text");
  const earlierBonus = earlierTexts - (first.kind === "text" ? 1 : 0);
  return earlierBonus * PEOPLE.textXp < PEOPLE.textXpPerDay ? PEOPLE.textXp : 0;
}

// The day's first contact checks the day in (core). The first calls home of a week
// are core too; other calls, visits and extra texts are bonus.
function scoreContact(event, events) {
  const isFirst = earlierMatches(events, event, event.date, isContact) === 0;
  let core = isFirst ? PEOPLE.checkInXp : 0;
  let extra = textBonus(event, events, isFirst);
  if (isHomeCall(event)) {
    const before = earlierMatches(events, event, weekStart(event.date), isHomeCall);
    if (before < PEOPLE.callsHomePerWeek) core += PEOPLE.homeCallXp;
    else extra += PEOPLE.callXp;
  } else if (event.kind === "call") {
    extra += PEOPLE.callXp;
  } else if (event.kind === "visit") {
    extra += PEOPLE.visitXp;
  }
  return { branch: PEOPLE.branch, core, extra };
}

// Wished on or before the day: bonus. (The page only offers the tick up to the day.)
function scoreWished(event) {
  return { branch: PEOPLE.branch, core: 0, extra: event.date <= event.on ? PEOPLE.wishedXp : 0 };
}

// Every saved date with its next time from today on: { ...date, on, days }, soonest first.
function upcomingDates(events, today) {
  const year = Number(today.slice(0, 4));
  return events
    .filter(e => e.activity === "people-date")
    .map(d => {
      const thisYear = `${year}-${d.day}`;
      const on = thisYear >= today ? thisYear : `${year + 1}-${d.day}`;
      return { ...d, on, days: daysBetween(today, on) };
    })
    .sort((a, b) => a.days - b.days);
}

// The two parts of People's goal: checked in today, and calls home this week.
// Today's bonus (extra calls, texts, visits, wishes) shows as the daily part's extra.
function peopleParts(events, today) {
  const todays = events.filter(e => e.date === today && (isContact(e) || isWished(e)));
  const extra = todays.reduce((total, e) => total + scoreEvent(e, events).extra, 0);
  const checkedIn = todays.some(isContact);
  const week = weekStart(today);
  const count = events.filter(e => isHomeCall(e) && e.date >= week && e.date <= today).length;
  const counted = Math.min(count, PEOPLE.callsHomePerWeek);
  return {
    today: { checkedIn, core: checkedIn ? PEOPLE.checkInXp : 0, extra, goal: PEOPLE.checkInXp },
    week: { count, core: counted * PEOPLE.homeCallXp, extra: 0, goal: PEOPLE.callsHomePerWeek * PEOPLE.homeCallXp },
  };
}
