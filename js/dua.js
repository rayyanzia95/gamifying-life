// Dua: adhkar, personal dua, and dua after prayers, worked out from events.
//   { date, activity: "adhkar", time: "morning" }   one per time per day
//   { date, activity: "dua", long: true }           personal dua; long = 10+ min
//   A prayer event with dua: true                   dua after that prayer

function isAdhkar(event, time) {
  return event.activity === "adhkar" && event.time === time;
}

function isPersonalDua(event) {
  return event.activity === "dua";
}

// Today's event that matches, or undefined.
function todayEvent(events, matches) {
  const today = todayString();
  return events.find(e => e.date === today && matches(e));
}

function adhkarDoneToday(events) {
  return DUA.adhkar.filter(a => todayEvent(events, e => isAdhkar(e, a.id))).length;
}

// Any dua at all (adhkar, personal, or after a prayer) counts the day for the streak.
function duaStreak(events) {
  const duaDays = new Set(
    events
      .filter(e => e.activity === "adhkar" || isPersonalDua(e) || e.dua === true)
      .map(e => e.date)
  );
  return dayStreak(duaDays, DUA.pausesPerWeek);
}
