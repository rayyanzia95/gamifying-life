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
const BRANCHES = [
  { id: "deen", name: "Deen", page: "deen.html" },
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