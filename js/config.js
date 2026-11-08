const SCORING = {
  fard:  { base: 10, onTime: 5, masjid: 10 },
  wajib: { base: 10, onTime: 5, masjid: 0 },
  sunnahPerTwoRakah: 3,
  tahajjud: { base: 25, shortDua: 5, longDua: 10 },
};

const PRAYERS = [
  { id: "fajr", name: "Fajr", sets: [
    { id: "sunnah-before", type: "sunnah", rakah: 2 },
    { id: "fard", type: "fard", rakah: 2 },
  ]},
  { id: "dhuhr", name: "Dhuhr", sets: [
    { id: "sunnah-before", type: "sunnah", rakah: 4 },
    { id: "fard", type: "fard", rakah: 4 },
    { id: "sunnah-after", type: "sunnah", rakah: 2 },
  ]},
  { id: "asr", name: "Asr", sets: [
    { id: "sunnah-before", type: "sunnah", rakah: 4, optional: true },
    { id: "fard", type: "fard", rakah: 4 },
  ]},
  { id: "maghrib", name: "Maghrib", sets: [
    { id: "fard", type: "fard", rakah: 3 },
    { id: "sunnah-after", type: "sunnah", rakah: 2 },
  ]},
  { id: "isha", name: "Isha", sets: [
    { id: "fard", type: "fard", rakah: 4 },
    { id: "sunnah-after", type: "sunnah", rakah: 2 },
    { id: "witr", type: "wajib", rakah: 3 },
  ]},
  { id: "tahajjud", name: "Tahajjud", bonus: true, sets: [
    { id: "tahajjud", type: "tahajjud" },
  ]},
];