const SCORING = {
  fard:  { base: 10, onTime: 5, masjid: 10 },
  wajib: { base: 10, onTime: 5, masjid: 0 },
  sunnahPerTwoRakah: 3,
  tahajjud: { base: 25, shortDua: 5, longDua: 10 },
};

const LEVELS = { first: 600, step: 100, overallMultiplier: 3 };

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
  water: { glasses: 8, xp: 5 },
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

// Fall 2026 deadlines, copied from the Fall 2026 Planner (Canvas, Oct 1).
// Edit a row here when a date moves; its tick is kept, because a deadline is
// known by its course + title, not its date. kind is one of ACADEMICS.deadlineXp.
// Exams carry hp: midterms 10, in-person quizzes 4.
const DEADLINES = [
  { date: "2026-11-10", time: "11:00 a.m.", course: "phys",  kind: "lab",        title: "Lab 6 report" },
  { date: "2026-11-13", time: "This week",  course: "study", kind: "task",       title: "Book your last Fresh Start session" },
  { date: "2026-11-15", time: "Sun night",  course: "study", kind: "assignment", title: "November Assignment #3" },
  { date: "2026-11-16", time: "12:55 p.m.", course: "astro", kind: "quiz",       title: "Knowledge Check 8" },
  { date: "2026-11-16", time: "5:00 p.m.",  course: "astro", kind: "exam",       title: "Quiz: Modules 7–8", hp: 4, note: "In person, CCIS L2-200" },
  { date: "2026-11-16", time: "Mon night",  course: "cmput", kind: "assignment", title: "Assignment 3" },
  { date: "2026-11-17", time: "2:00 p.m.",  course: "cmput", kind: "lab",        title: "Lab 6 demo" },
  { date: "2026-11-19", time: "6:00 p.m.",  course: "phys",  kind: "exam",       title: "Midterm 2", hp: 10, note: "6:00–7:30 p.m., room TBA" },
  { date: "2026-11-20", time: "Time TBC",   course: "cmput", kind: "lab",        title: "Lab 7 due" },
  { date: "2026-11-22", time: "Sun night",  course: "study", kind: "quiz",       title: "Learn Strategically Quiz" },
  { date: "2026-11-23", time: "9:30 a.m.",  course: "phys",  kind: "quiz",       title: "Reading Quiz 8" },
  { date: "2026-11-23", time: "12:55 p.m.", course: "astro", kind: "quiz",       title: "Knowledge Check 9" },
  { date: "2026-11-24", time: "11:00 a.m.", course: "phys",  kind: "lab",        title: "Lab 7 report" },
  { date: "2026-11-24", time: "2:00 p.m.",  course: "cmput", kind: "lab",        title: "Assignment 3 demo" },
  { date: "2026-11-26", time: "Thu night",  course: "phys",  kind: "quiz",       title: "Content Quiz 8" },
  { date: "2026-11-27", time: "Time TBC",   course: "cmput", kind: "lab",        title: "Lab 8 due" },
  { date: "2026-11-29", time: "Sun night",  course: "study", kind: "assignment", title: "Reflection Letter" },
  { date: "2026-11-30", time: "9:30 a.m.",  course: "phys",  kind: "quiz",       title: "Reading Quiz 9" },
  { date: "2026-11-30", time: "12:55 p.m.", course: "astro", kind: "quiz",       title: "Knowledge Check 10" },
  { date: "2026-11-30", time: "Time TBC",   course: "astro", kind: "exam",       title: "Quiz: Modules 9–10", hp: 4 },
  { date: "2026-12-01", time: "11:00 a.m.", course: "phys",  kind: "lab",        title: "Lab 8 report" },
  { date: "2026-12-01", time: "2:00 p.m.",  course: "cmput", kind: "lab",        title: "Labs 7 + 8 demo" },
  { date: "2026-12-03", time: "Thu night",  course: "phys",  kind: "quiz",       title: "Content Quiz 9" },
  { date: "2026-12-07", time: "In class",   course: "cmput", kind: "exam",       title: "Midterm 3", hp: 10 },
  { date: "2026-12-07", time: "Mon night",  course: "phys",  kind: "quiz",       title: "Content Quiz 10" },
  { date: "2026-12-08", time: "12:00 p.m.", course: "phys",  kind: "task",       title: "Redo lab selection" },
  { date: "2026-12-13", time: "Sun night",  course: "study", kind: "task",       title: "Student Evaluation Form" },
  // Finals, from the Bear Tracks exam schedule (.ics). CMPUT 175 and ASTRO 101
  // (rescheduled through accommodations, away from Jumu'ah) still to come.
  { date: "2026-12-14", time: "9:00 a.m.",  course: "econ",  kind: "exam",       title: "Final exam", hp: 10, note: "ED 3-106 · 2.5 h (room booked 9–12)" },
];

// Study guides, crash courses, cheat sheets and lab reports: links to his own
// Claude artifacts, which only open for him. Newest first within each course.
const STUDY_GUIDES = [
  { course: "phys",  title: "Lab Report 13: Springs II",                        url: "https://claude.ai/artifact/EAWsLeXs3mpMEk1VeYcU6R" },
  { course: "phys",  title: "Lab Report 12: Hooke's Law and SHM",               url: "https://claude.ai/artifact/AK8QuNDZz73DKghQg57YoN" },
  { course: "phys",  title: "Human Arm Statics Lab: Worksheet Solutions",       url: "https://claude.ai/artifact/LCpbpx31EH9ChHwy1ohuqv" },
  { course: "phys",  title: "Physics Exam Notes: Walker Ch. 1–6",               url: "https://claude.ai/artifact/BWezzUvVVH4nitiobjV2c9" },
  { course: "phys",  title: "Midterm 1 Revision Notes",                         url: "https://claude.ai/artifact/My9GL4CTjuyTv7d3MxJAJ6" },
  { course: "phys",  title: "Midterm Sprint",                                   url: "https://claude.ai/artifact/6XnAQjXB2AsZCWFjqcB5Ne" },
  { course: "phys",  title: "Midterm 1 Study Guide",                            url: "https://claude.ai/artifact/SgcJ73wVs21PvQ7yFo9M7K" },
  { course: "cmput", title: "Midterm Prep",                                     url: "https://claude.ai/artifact/PsYfeWvD9QfLQ3GsW3Bf1N" },
  { course: "cmput", title: "Midterm 2 & 3 Game Plan",                          url: "https://claude.ai/artifact/667nxsHxxKVhKrZ3sZNXwH" },
  { course: "cmput", title: "Exam Study Guide & Cheat Sheet",                   url: "https://claude.ai/artifact/8FVeWPCvVZH6sD5tXXXyJi" },
  { course: "cmput", title: "Midterm 2 Study Guide",                            url: "https://claude.ai/artifact/3ivRtJS7tzP1jCVTzZAjBu" },
  { course: "cmput", title: "Midterm 1 Cheat Sheet",                            url: "https://claude.ai/artifact/9zVfP48hV3qaDoFe5s3gfD" },
  { course: "cmput", title: "Midterm 1 Study Guide",                            url: "https://claude.ai/artifact/TGDWxdydwNmAjnEfN7orWa" },
  { course: "cmput", title: "Midterm 1 Study Guide (first version)",            url: "https://claude.ai/artifact/NpChdvWyknAt4PRpCPxdS1" },
  { course: "econ",  title: "Midterm Study Guide & Plan",                       url: "https://claude.ai/artifact/8w2LbFT3BmtzTRZKa7prya" },
  { course: "econ",  title: "Midterm Study Guide",                              url: "https://claude.ai/artifact/YHRsiDXBheJHkVGCDSfCg3" },
  { course: "astro", title: "Quiz Crash Course: Modules 5–6",                   url: "https://claude.ai/artifact/KtN4sRkC8ovxL3g9rTifcm" },
  { course: "astro", title: "Quiz 2 Study Guide (Modules 3–4)",                 url: "https://claude.ai/artifact/Up8z5RThHc9aVovBF9Qgr6" },
  { course: "astro", title: "Modules 3–4 Study Guide",                          url: "https://claude.ai/artifact/XYk9J63wKsKjcmd4jiwC5t" },
  { course: "study", title: "October Assignment: Plan, Practice, Adapt",        url: "https://claude.ai/artifact/Cwbo8zY7kMLn6kNB7qWGYp" },
];

// period "week": the Home ring fills over the week instead of each day.
// period "mixed": the ring is split into a daily part and a weekly part (healthParts).
const BRANCHES = [
  { id: "deen", name: "Deen", page: "deen.html" },
  { id: "chores", name: "Chores", page: "chores.html", period: "week" },
  { id: "health", name: "Health", page: "health.html", period: "mixed" },
  { id: "academics", name: "Academics", page: "academics.html", period: "mixed" },
  { id: "money", name: "Money", page: "money.html", period: "mixed" },
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