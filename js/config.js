const SCORING = {
  fard:  { base: 10, onTime: 5, masjid: 10 },
  wajib: { base: 10, onTime: 5, masjid: 0 },
  sunnahPerTwoRakah: 3,
  tahajjud: { base: 25, shortDua: 5, longDua: 10 },
};

const LEVELS = { first: 600, step: 100, overallMultiplier: 3 };

// Level-up rewards. Each overall level reached gives one rest day, held up to restMax
// (one earned while holding restMax is not kept). A rest day is spent on one streak's
// missed yesterday. restCoversWeeklyPause: true = it also covers a weekly pause limit
// (Dua's second miss in a week); false = it only stops two misses in a row.
const REWARDS = { restMax: 3, restCoversWeeklyPause: true };

// Quran revision, logged in juz (30 in the Quran), in order from Juz 1.
// Up to dailyTarget counts toward the daily goal; anything beyond is bonus XP.
const QURAN = {
  branch: "deen",
  total: 30,
  dailyTarget: 1,
  step: 0.5,             // the juz counter moves in half juz
  xpPerJuz: 30,          // so half a juz is 15
  cycleStart: "2026-11-10", // revision starts at Juz 1 on this day
};

// Dua. Adhkar count toward the daily goal; the rest is bonus XP.
const DUA = {
  branch: "deen",
  adhkar: [
    { id: "morning", name: "Morning" },
    { id: "evening", name: "Evening" },
  ],
  adhkarXp: 15,          // each
  afterFardXp: 2,        // per dua after a fard, logged with a 0–5 counter
  personal: { base: 10, long: 5 }, // long = 10+ min
  pausesPerWeek: 1,      // streak: one missed day a week (Sun–Sat) is forgiven
};

// Expected 1 Ramadan 1448. Update once the masjid announces the moon sighting.
const RAMADAN_START = "2027-02-08";

// Edmonton. Alberta stays on UTC-6 all year.
const LOCATION = { lat: 53.5461, lng: -113.4938, utcOffset: -6 };

// How to calculate prayer times on days the masjid timetable doesn't cover.
// Worked out from Markaz Ul Islam's own 2026 times (Muslim World League angles);
// matches them within about 2 minutes from October to December.
const PRAYER_METHOD = {
  fajrAngle: 18,        // sun 18° below the horizon
  ishaAngle: 17,
  asrShadow: 1,         // standard Asr: shadow = object length (Hanafi would be 2)
  dhuhrDelay: 5,        // minutes after solar noon
  // High-latitude rules, so summer nights that never get properly dark still work:
  ishaNightPortion: 1 / 7,  // Isha no later than sunset + 1/7 of the night (the masjid's rule)
  fajrNightPortion: 18 / 60, // Fajr no earlier than sunrise − 18/60 of the night ("angle-based"),
                             // which keeps Fajr from jumping in May and August
};
// Cleaning & Chores: weekly quests. The week runs Sunday to Saturday.
// times = how many per week (default 1). everyWeeks: 2 means once every two weeks:
// doing it this week or last week covers it. hint is a usual day, shown only as a hint.
// Doing a chore more than its target still earns XP, as bonus.
// short is the label on the quest wheel, when the name is too long to fit.
const CHORES = {
  branch: "chores",
  weekBonus: 50,         // when every quest is covered for the week
  list: [
    { id: "laundry",  name: "Laundry",         xp: 20, hint: "Fri" },
    { id: "folding",  name: "Folding clothes", short: "Folding",  xp: 10, hint: "Sat" },
    { id: "room",     name: "Clean room",      short: "Room",     xp: 20 },
    { id: "desk",     name: "Clean desk",      short: "Desk",     xp: 10 },
    { id: "washroom", name: "Clean washroom",  short: "Washroom", xp: 20, hint: "Sat" },
    { id: "dishes",   name: "Dishes",          xp: 10, times: 3 },
    { id: "ironing",  name: "Ironing",         xp: 20, everyWeeks: 2 },
    { id: "dusting",  name: "Dusting",         xp: 15, everyWeeks: 2 },
  ],
};

// Health: Sleep. A night belongs to the morning you wake, logged as bed and wake
// times plus minutes awake for Fajr (subtracted from the total).
// Each goal met earns its XP; all of it counts toward the daily goal.
const SLEEP = {
  branch: "health",
  bedBy: "22:30",        // in bed by this time
  hours: 7.5,            // enough sleep
  usual: { nights: 7, minNights: 3, withinMinutes: 30 }, // consistent = within 30 min of
                                                          // the average of the last 7 bedtimes
  fajrStep: 10,          // the "awake for Fajr" counter moves in 10 min
  xp: { bedtime: 15, hours: 15, consistent: 10 },
};

// Health: Exercise. One counter for gym and climbing together, counted over the
// week (Sun–Sat). Sessions up to the weekly target are core XP; more are bonus.
const EXERCISE = {
  branch: "health",
  perWeek: 3,
  xp: 25,
};

// Health: Diet. One event per day: each meal rated, glasses of water, a creatine tick.
// Junk is still logged, it just earns nothing. All core; the daily goal is 40.
// A day counts toward the streak once it has streakXp.
const DIET = {
  branch: "health",
  meals: [
    { id: "breakfast", name: "Breakfast" },
    { id: "lunch", name: "Lunch" },
    { id: "dinner", name: "Dinner" },
  ],
  ratings: [
    { id: "healthy", name: "Healthy", xp: 10 },
    { id: "okay", name: "Okay", xp: 5 },
    { id: "junk", name: "Junk", xp: 0 },
  ],
  water: { glasses: 8, xp: 5, bonusXp: 2, bonusUpTo: 12 }, // each glass past 8 is +2 bonus, up to 12
  creatineXp: 5,
  streakXp: 30,
};

// Academics: uni courses only. Study is logged in 30-minute blocks, each tagged
// with a course. The first blocksPerDay blocks of a day are core XP; more are bonus.
// Ticking a deadline earns XP by its kind, and a late tick still counts in full.
const ACADEMICS = {
  branch: "academics",
  courses: [
    { id: "phys",  name: "PHYS 124",     short: "PHYS" },
    { id: "cmput", name: "CMPUT 175",    short: "CMPUT" },
    { id: "econ",  name: "ECON 101",     short: "ECON" },
    { id: "astro", name: "ASTRO 101",    short: "ASTRO" },
    { id: "study", name: "Study Skills", short: "Study Skills" },
  ],
  blockMinutes: 30,
  blockXp: 10,
  blocksPerDay: 4,       // daily goal: 4 blocks = 2 hours = 40 XP
  deadlineXp: { quiz: 10, lab: 15, assignment: 25, task: 5, exam: 40 },
  // Exams are bosses. Each study block for the exam's course, from windowDays before
  // up to the exam day, takes 1 HP off (an exam's hp is set on its row in DEADLINES).
  // Tick the exam with the boss at 0 HP for bonusXp on top of the exam's own XP.
  boss: { windowDays: 14, bonusXp: 30 },
};

// Money: XP for logging, never for spending less. The week runs Sunday to Saturday.
// No amounts live here: the weekly budget and savings goal are typed in on the
// Money page and saved with your events on the device only, because this repo is public.
const MONEY = {
  branch: "money",
  dayXp: 15,             // core: today is logged (a spend, or "No spend today")
  noSpendXp: 10,         // bonus for a no-spend day
  payoutXp: 50,          // bonus when a week ends: share of the budget left × 50
  payoutMinDays: 5,      // ...banked only if at least 5 of the 7 days were logged
  depositXp: 25,         // bonus for the first savings deposit of a week
  goalXp: 100,           // bonus, once, when a savings goal is reached
  categories: [
    { id: "food",      name: "Food out" },
    { id: "groceries", name: "Groceries" },
    { id: "transport", name: "Transport" },
    { id: "fun",       name: "Fun" },
    { id: "other",     name: "Other" },
  ],
};

// Personal: journal and reading count each day; time alone (no screens) and time
// with friends count over the week (Sun–Sat). Books are typed in on the page, so
// the reading list stays on the device. Sessions are quiet: bonus XP, nothing else.
const PERSONAL = {
  branch: "personal",
  journalXp: 10,         // core: journalled today
  reading: {
    dayPages: 20,        // core: 1 XP per 2 pages, up to 10 XP at 20 pages a day
    dayXp: 10,
    extraPages: 20,      // bonus: +5 for every further 20 pages that day
    extraXp: 5,
    finishXp: 50,        // bonus, once, when a book's last page is reached
  },
  alone: { perWeek: 3, xp: 10, extraXp: 5 },     // time alone with no screens
  friends: { perWeek: 2, xp: 20, extraXp: 10 },  // good time with friends
  sessionXp: 20,         // bonus, first session of a week
};

// People / Family: a check-in each day plus calls home over the week (Sun–Sat).
// Names and dates are typed in on the page, so they stay on the device.
const PEOPLE = {
  branch: "people",
  checkInXp: 15,         // core: talked to anyone today (call, text or visit)
  homeGroup: "lahore",   // calls to this group are "calls home"
  callsHomePerWeek: 2,
  homeCallXp: 20,        // core: each of the first 2 calls home of a week
  callXp: 10,            // bonus: further calls home, and calls to anyone else
  textXp: 2,             // bonus: each text after the day's first contact...
  textXpPerDay: 10,      // ...up to this much a day
  visitXp: 30,           // bonus: visiting relatives
  wishedXp: 25,          // bonus: birthday / anniversary wished or gift done, on time
  wishWindowDays: 14,    // the "Wished" tick shows from 14 days before
  homeNoteDays: 7,       // Home mentions a date from 7 days before
  home: { name: "Lahore", utcOffset: 5, awakeFrom: "10:00", awakeTo: "22:00" }, // UTC+5, no DST
  groups: [
    { id: "lahore", name: "Lahore" },
    { id: "family", name: "Family here", visits: true },
    { id: "friends", name: "Friends" },
  ],
  kinds: [
    { id: "call", name: "Call" },
    { id: "text", name: "Text" },
    { id: "visit", name: "Visit" },
  ],
  dateKinds: [
    { id: "birthday", name: "Birthday" },
    { id: "anniversary", name: "Anniversary" },
    { id: "other", name: "Other" },
  ],
};

// period "week": the Home ring fills over the week instead of each day.
// period "mixed": the ring is split into a daily part and a weekly part (healthParts).
const BRANCHES = [
  { id: "deen", name: "Deen", page: "deen.html" },
  { id: "chores", name: "Chores", page: "chores.html", period: "week" },
  { id: "health", name: "Health", page: "health.html", period: "mixed" },
  { id: "academics", name: "Academics", page: "academics.html", period: "mixed" },
  { id: "money", name: "Money", page: "money.html", period: "mixed" },
  { id: "personal", name: "Personal", page: "personal.html", period: "mixed" },
  { id: "people", name: "People", page: "people.html", period: "mixed" },
];

const PRAYERS = [
  { id: "tahajjud", branch: "deen", name: "Tahajjud", bonus: true, sets: [
    { id: "tahajjud", type: "tahajjud" },
  ]},
  { id: "fajr", branch: "deen", name: "Fajr", sets: [
    { id: "sunnah-before", type: "sunnah", rakah: 2 },
    { id: "fard", type: "fard", rakah: 2 },
  ]},
  { id: "dhuhr", branch: "deen", name: "Dhuhr", sets: [
    { id: "fard", type: "fard", rakah: 4 },
    { id: "sunnah", type: "sunnah", rakah: 6, stepper: true },
  ]},
  { id: "asr", branch: "deen", name: "Asr", sets: [
    { id: "sunnah-before", type: "sunnah", rakah: 4, optional: true },
    { id: "fard", type: "fard", rakah: 4 },
  ]},
  { id: "maghrib", branch: "deen", name: "Maghrib", sets: [
    { id: "fard", type: "fard", rakah: 3 },
    { id: "sunnah-after", type: "sunnah", rakah: 2 },
  ]},
  { id: "isha", branch: "deen", name: "Isha", sets: [
    { id: "fard", type: "fard", rakah: 4 },
    { id: "sunnah-after", type: "sunnah", rakah: 2 },
    { id: "witr", type: "wajib", rakah: 3 },
  ]},
];
