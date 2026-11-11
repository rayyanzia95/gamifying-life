// Dua: adhkar, personal dua, and dua after prayers, worked out from events.
//   { date, activity: "adhkar", time: "morning" }          one per time per day
//   { date, activity: "dua", long: true }                  personal dua; long = 10+ min
//   { date, activity: "dua-after-prayers", amount: 3 }     how many fards you made dua after
//   A fard event with dua: true                            older days' dua after that prayer

function isAdhkar(event, time) {
  return event.activity === "adhkar" && event.time === time;
}

function isPersonalDua(event) {
  return event.activity === "dua";
}

function isAfterPrayerDua(event) {
  return event.activity === "dua-after-prayers";
}

// Today's event that matches, or undefined.
function todayEvent(events, matches) {
  const today = todayString();
  return events.find(e => e.date === today && matches(e));
}

function adhkarDoneToday(events) {
  return DUA.adhkar.filter(a => todayEvent(events, e => isAdhkar(e, a.id))).length;
}

function afterPrayerDuaToday(events) {
  return todayEvent(events, isAfterPrayerDua)?.amount ?? 0;
}

// How many fard prayers there are in a day (5): the counter's target.
const DAILY_FARDS = PRAYERS.filter(p => mainSet(p).type === "fard").length;

// Unticking a prayer lowers today's dua-after-prayers count if it's now too high.
function clampAfterPrayerDua(events) {
  const max = fardsPrayedToday(events);
  const today = todayString();
  return events
    .map(e => e.date === today && isAfterPrayerDua(e) && e.amount > max ? { ...e, amount: max } : e)
    .filter(e => !(isAfterPrayerDua(e) && e.amount === 0));
}

// The counter can't go past the fard prayers ticked today.
function fardsPrayedToday(events) {
  const today = todayString();
  return PRAYERS
    .filter(p => mainSet(p).type === "fard")
    .filter(p => events.some(e => e.date === today && e.prayer === p.id && e.set === mainSet(p).id))
    .length;
}

// Today's dua at a glance, for the prayer dial. count / max fills its gold halo.
function duaToday(events) {
  const morning = Boolean(todayEvent(events, e => isAdhkar(e, "morning")));
  const evening = Boolean(todayEvent(events, e => isAdhkar(e, "evening")));
  const personal = Boolean(todayEvent(events, isPersonalDua));
  const afterPrayers = afterPrayerDuaToday(events);
  // Number(true) is 1 and Number(false) is 0, so ticks can be added up.
  const count = afterPrayers + Number(morning) + Number(evening) + Number(personal);
  return { morning, evening, afterPrayers, count, max: DUA.adhkar.length + DAILY_FARDS + 1 };
}

// Any dua at all (adhkar, personal, or after a prayer) counts the day for the streak.
function duaStreak(events) {
  const duaDays = new Set(
    events
      .filter(e => e.activity === "adhkar" || isPersonalDua(e) || isAfterPrayerDua(e) || e.dua === true)
      .map(e => e.date)
  );
  return dayStreak(duaDays, DUA.pausesPerWeek);
}
