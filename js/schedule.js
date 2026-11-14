// The Fall 2026 Planner's day schedule: classes, labs, exams, study blocks, plus the
// prayer/lunch breaks, chores, MSA rows and flex time that sit between them.
// A block is { from: "11:00", to: "11:50", kind, course?, title, note? }, times in 24 h.
// kind: "study"  tickable, ticking logs study blocks (XP, boss damage);
//       "chore" / "msa"  tickable, but only remembered (a "planned" event), never XP:
//                        chores keep their own branch, MSA isn't scored;
//       "class", "exam", "break", "flex"  shown only.
// scheduleFor(date) builds a day: a hand-written day from PLANNED_DAYS (Oct 15 – Nov 6),
// else the weekly template (Nov 2 – Dec 6), else just classes (until Dec 7).

const SCHEDULE = {
  templateStart: "2026-11-02",
  templateEnd: "2026-12-06",
  extrasFrom: "2026-10-15", // nightly dishes and Sunday washroom cleaning, through templateEnd
  classesEnd: "2026-12-07",
  readingWeek: { from: "2026-11-09", to: "2026-11-13" },
  physMidterm: { from: "2026-11-07", to: "2026-11-18" },  // template swaps in PHYS Midterm 2 prep
  cmputMidterm: { from: "2026-11-28", to: "2026-12-06" }, // and CMPUT Midterm 3 prep
};

// ---- Building blocks ----

// Slots are written [course, title, note?]; the course decides the kind, so "chore",
// "msa" and "flex" slots drop in anywhere a study slot would.
const KIND_BY_COURSE = { chore: "chore", msa: "msa", flex: "flex" };
const study = (from, to, course, title, note) =>
  ({ from, to, kind: KIND_BY_COURSE[course] ?? "study", course, title, note });
const rest = (from, to, title) => ({ from, to, kind: "break", title });
const lecture = (from, to, title, course) => ({ from, to, kind: "class", course, title });
const exam = (from, to, course, title, note) => ({ from, to, kind: "exam", course, title, note });

const CMPUT_LECTURE = lecture("09:00", "09:50", "CMPUT 175 lecture (NRE 1-001)", "cmput");
const PHYS_LECTURE = lecture("10:00", "10:50", "PHYS 124 lecture (CCIS 1-440)", "phys");
const ECON_CHAPTER = n => ["econ", `ECON Chapter ${n}`, "Slides + textbook, end-of-chapter problems, one-page summary"];
const LAUNDRY = ["chore", "Laundry, plus flex", "Put a load on, then MSA or catch-up while it runs"];
const PHYS_PREP = ["phys", "PHYS Midterm 2 prep", "Midterm Thu Nov 19, 6 p.m."];

// The 4 p.m. ASTRO slot: a quiz on quiz days (from DEADLINES), else the lecture.
function astroSlot(date) {
  const quiz = DEADLINES.find(d => d.date === date && d.course === "astro" && d.kind === "exam");
  return quiz
    ? exam("16:00", "16:50", "astro", `ASTRO 101 quiz: ${quiz.title.replace("Quiz: ", "")} (CCIS L2-200)`)
    : lecture("16:00", "16:50", "ASTRO 101 lecture (CCIS L2-200)", "astro");
}

// Mon/Wed: lectures, three study slots, ASTRO at 4. Each slot is [course, title, note?].
function monWed(date, noon, afternoon, eleven = ["econ", "ECON: this week's lecture slides"]) {
  return [CMPUT_LECTURE, PHYS_LECTURE, study("11:00", "11:50", ...eleven),
    study("12:00", "13:15", ...noon), rest("13:15", "14:00", "Dhuhr + lunch"),
    study("14:00", "15:30", ...afternoon), rest("15:30", "15:55", "Asr, walk to CCIS"), astroSlot(date)];
}

const LABS = [lecture("11:00", "13:50", "PHYS 124 lab (L2-150), Dhuhr in the gap", "phys"),
  lecture("14:00", "16:50", "CMPUT 175 lab D01 (UCOMM 3-130), Asr at the break", "cmput")];

const tuesday = morning => [study("09:30", "10:45", ...morning), ...LABS];

const freeDay = (a, b, c, d) => [study("09:30", "11:00", ...a), study("11:15", "12:45", ...b),
  rest("12:45", "14:00", "Dhuhr + lunch"), study("14:00", "15:30", ...c), rest("15:30", "15:45", "Asr"),
  study("15:45", "17:00", ...d)];

const friday = (a, b, c = LAUNDRY) => [CMPUT_LECTURE, PHYS_LECTURE, study("11:00", "13:00", ...a),
  rest("13:00", "14:15", "Jumu'ah + lunch"), study("14:15", "15:30", ...b), rest("15:30", "15:45", "Asr"),
  study("15:45", "17:00", ...c)];

const saturday = (a, iron = "Fold laundry + ironing") => [study("10:00", "11:30", ...a),
  study("11:45", "12:45", "chore", iron), rest("12:45", "14:15", "Dhuhr + lunch"),
  study("14:15", "15:15", "chore", "Cleaning"), study("15:15", "17:00", "flex", "Free, or MSA if there's a meeting")];

// ---- Oct 15 – Nov 6: the detailed plan ----

const PLANNED_DAYS = {
  "2026-10-15": () => [rest("13:00", "14:15", "Dhuhr + food"),
    study("14:15", "15:45", "cmput", "CMPUT Assignment 2", "Get it working end to end"), rest("15:45", "16:00", "Asr"),
    study("16:00", "17:00", "astro", "ASTRO Module 3 (catch-up)", "Lectures + readings, note the key ideas for Monday's quiz")],
  "2026-10-16": () => [CMPUT_LECTURE, PHYS_LECTURE, study("11:00", "11:50", ...ECON_CHAPTER(1)),
    study("12:00", "13:00", "cmput", "CMPUT Assignment 2", "Fix what broke yesterday, list what's left"),
    rest("13:00", "19:00", "Jumu'ah, then climbing. Laundry tonight or first thing Saturday")],
  "2026-10-17": () => [study("10:00", "11:30", "cmput", "CMPUT Assignment 2: finish, test, submit", "Due 11:55 p.m."),
    study("11:45", "12:45", "chore", "Fold + iron Friday's laundry"), rest("12:45", "14:15", "Dhuhr + lunch"),
    study("14:15", "15:30", "msa", "MSA video: rough cut", "Put the clips in order, trim, rough timing"), rest("15:30", "15:45", "Asr"),
    study("15:45", "17:00", "msa", "MSA video: polish, export, send", "Music or titles if needed, one full watch-through, export"),
    lecture("19:00", "20:00", "MSA marketing meeting (online, link sent just before)", "msa")],
  "2026-10-18": () => [
    study("10:00", "11:30", "astro", "ASTRO Module 4 (catch-up)", "Lectures + readings, then a quick pass over Module 3"),
    study("11:45", "12:20", "astro", "ASTRO Knowledge Check 5", "Due Mon 11:55 a.m."),
    study("12:20", "13:00", "study", "Study Skills Note-taking Quiz", "Due tonight"),
    study("14:00", "15:00", "chore", "Cleaning", "Moved from Saturday this week")],
  "2026-10-19": () => [CMPUT_LECTURE, PHYS_LECTURE, study("11:00", "11:50", ...ECON_CHAPTER(2)),
    study("12:00", "13:15", "astro", "ASTRO Modules 3–4 review", "Re-do practice questions, list anything you can't explain"),
    study("14:00", "14:45", "econ", "ECON Chapter 2: finish + summary"),
    study("14:45", "15:30", "econ", "ECON Chapter 3: start", "Slides first; you finish it Wednesday"),
    rest("13:15", "14:00", "Dhuhr + lunch"), rest("15:30", "15:55", "Asr, walk to CCIS"),
    exam("16:00", "16:50", "astro", "ASTRO 101 quiz: Modules 3–4 (CCIS L2-200)")],
  "2026-10-20": () => tuesday(["phys", "PHYS Lab 4 (Human Arm) prelab + check CMPUT Lab 3 is demo-ready"]),
  "2026-10-21": date => monWed(date, ECON_CHAPTER(4), ["phys", "PHYS Content Quiz 5", "Due Thu night"],
    ["econ", "ECON Chapter 3: finish + summary"]),
  "2026-10-22": () => freeDay(["econ", "ECON Chapter 4: finish + summary"], ECON_CHAPTER(5),
    ["cmput", "CMPUT Lab 4: finish + submit", "Due Fri (time TBC), so submit today"], ["astro", "ASTRO Module 5"]),
  "2026-10-23": () => friday(
    ["econ", "Book the ECON midterm, then ECON Chapters 1–2", "Book first: ECON Canvas → Book your exam (aim Fri Oct 30, 2:30 p.m.). Then the Ch 1–2 lecture notes + videos parts 1–2"],
    ["econ", "ECON Chapters 1–2: videos parts 3–4 + practice questions", "Finish with a one-page summary"],
    ["cmput", "CMPUT Lab 4 (check if it's due today), laundry running", "Due date is tentative; skip if it's done"]),
  "2026-10-24": () => [
    study("10:00", "11:30", "econ", "ECON Chapter 3: lecture notes + both videos"),
    study("11:45", "12:45", "chore", "Fold + iron Friday's laundry"), rest("12:45", "14:15", "Dhuhr + lunch"),
    study("14:15", "15:15", "chore", "Cleaning"),
    study("15:15", "17:00", "phys", "PHYS Lab 4 report: The Human Arm", "Due Tue 11 a.m. If your 2 kg mass was flagged, use 2.2 kg")],
  "2026-10-25": () => [
    study("10:00", "11:30", "econ", "ECON Chapter 3 practice + Chapter 4 notes and videos", "Use the Ch 3 answer key after you try the questions"),
    study("11:45", "13:00", "econ", "ECON Chapter 4: practice questions + summary"),
    study("14:00", "15:15", "astro", "ASTRO Modules 5–6 review + Knowledge Check 6", "KC6 due Mon 11:55 a.m. Try Practice Knowledge Check 5 first"),
    study("15:30", "16:30", "phys", "PHYS Reading Quiz 6 + Study Skills Motivation Quiz", "RQ6 due Mon 9:30 a.m.; Motivation Quiz due tonight")],
  "2026-10-26": () => [
    study("08:45", "09:25", "phys", "PHYS Reading Quiz 6", "Due 9:30 a.m. Do it before anything else, even if you're late to CMPUT"),
    lecture("09:00", "09:50", "CMPUT 175 lecture (NRE 1-001), join after the quiz", "cmput"), PHYS_LECTURE,
    study("11:00", "11:50", "astro", "ASTRO Knowledge Check 6", "Due 11:55 a.m. Use your Module 5–6 notes"),
    study("12:00", "13:15", "astro", "ASTRO quiz review: Modules 5–6", "Representative Midterm Questions + Practice Knowledge Checks 5–6"),
    study("14:00", "15:30", "astro", "ASTRO quiz prep: weak spots", "Redo what you got wrong on Practice Knowledge Checks 5–6, then skim the Module 6 slides"),
    rest("13:15", "14:00", "Dhuhr + lunch"), rest("15:30", "15:55", "Asr, walk to CCIS"),
    exam("16:00", "16:50", "astro", "ASTRO 101 quiz: Modules 5–6 (CCIS L2-200)"),
    study("19:45", "21:00", "econ", "ECON Chapters 1–2 (tonight)", "Lecture notes + videos at 1.5× speed, then the Ch 1–2 practice questions. If tonight falls through, use Wednesday 8 p.m.")],
  "2026-10-27": () => [
    study("09:00", "10:50", "phys", "PHYS Human Arm report: finish + submit by 11 a.m.", "Use 2.2 kg if your mass was flagged. Glance over your A2 code before the CMPUT lab"),
    lecture("11:00", "13:50", "PHYS 124 lab: Lab 5 Spring I (L2-150)", "phys"),
    lecture("14:00", "16:50", "CMPUT 175 lab D01: Assignment 2 demo, then work on Lab 5", "cmput"),
    study("19:45", "21:00", "econ", "ECON Chapter 3: notes + videos (tonight)", "Two videos; use 1.5× speed")],
  "2026-10-28": date => [...monWed(date, ["econ", "ECON Chapter 4: notes, videos, practice questions"],
    ["econ", "ECON Chapter 5: notes, videos, practice questions", "Four short videos; use 1.5× speed"],
    ["econ", "ECON Chapter 3: practice questions", "Check them with the Ch 3 answer key. If Chapter 3 didn't happen last night, do the notes + videos now"]),
    study("20:00", "20:55", "econ", "Optional: ECON catch-up", "Finish whichever chapter ran over")],
  "2026-10-29": () => [
    study("09:30", "11:00", "econ", "ECON Chapter 6", "Notes + videos, then the Fall 2016–2018 Chapter 6 questions"),
    study("11:15", "12:45", "econ", "ECON Winter 2020 midterm (timed), then its detailed explanation", "Then the 'very important video on previous midterm exam'"),
    rest("12:45", "14:00", "Dhuhr + lunch"),
    study("14:00", "15:15", "econ", "ECON Fall 2017 midterm (timed), then mark it", "Redo every wrong answer"), rest("15:15", "15:30", "Asr"),
    study("15:30", "16:15", "econ", "ECON one-page summary sheet", "They give you the formula sheet, so focus on concepts and graphs"),
    study("16:15", "17:00", "phys", "PHYS Content Quiz 6", "Due tonight 11:59 p.m."),
    study("20:00", "20:55", "econ", "Optional: ECON weak spots", "One more past midterm (Fall 2018) or redo your wrong answers. Sleep early")],
  "2026-10-30": () => [
    study("08:15", "09:15", "econ", "ECON: summary sheet + formula sheet, once over", "Light review only. Skip the 9 a.m. CMPUT lecture and be at Ed North by 9:40"),
    exam("10:00", "12:00", "econ", "ECON midterm at the LAC (3-106 Ed North)", "Booked for 10 a.m. Chapters 1–6, 36%"),
    rest("12:00", "14:15", "Lunch + Jumu'ah"), rest("15:00", "15:15", "Asr"),
    study("14:15", "15:00", "cmput", "CMPUT Post-test 5: Call Stack + Exceptions", "Watch the Week 6 vignettes first; due Sat 9 a.m."),
    study("15:15", "17:00", "cmput", "CMPUT Midterm 2 review: topics since Midterm 1", "Algorithm analysis, stacks, call stack + exceptions, queues, linked lists")],
  "2026-10-31": () => [
    study("10:00", "11:30", "cmput", "CMPUT Midterm 2: finish the topic review", "Whatever you didn't get to on Friday"),
    study("11:45", "12:45", "chore", "Laundry + fold (moved from Friday)"), rest("12:45", "14:15", "Dhuhr + lunch"),
    study("14:15", "15:15", "chore", "Cleaning"),
    study("15:15", "17:00", "cmput", "CMPUT practice: midterm samples + in-class quizzes 1–3", "Finish Lab 5 first if it isn't done")],
  "2026-11-01": () => [
    study("10:00", "11:30", "cmput", "CMPUT Midterm 2: timed practice", "Midterm 1 2013 or 2016 sample, on paper"),
    study("11:45", "13:00", "astro", "ASTRO Knowledge Check 7 + PHYS Reading Quiz 7 + Stay on Track Quiz", "Skim Module 7 first. KC7 due Mon 12:55 p.m., RQ7 Mon 9:30 a.m., Stay on Track tonight"),
    study("14:00", "15:15", "cmput", "CMPUT final review: your Midterm 1 mistakes", "Check the W= questions in your Midterm 1 feedback")],
  "2026-11-05": () => [
    study("09:30", "11:00", "cmput", "CMPUT Post-test 6 vignettes + Assignment 3", "Post-test 6 due Fri night; A3 due Mon Nov 16"),
    study("11:15", "12:45", "econ", "ECON: this week's chapter"), rest("12:45", "13:30", "Dhuhr + lunch"),
    study("13:30", "14:30", "study", "Fresh Start study session", "Counts as one advisor session (10%)"),
    study("14:45", "15:45", "phys", "PHYS lab report draft"),
    study("15:45", "17:00", "astro", "ASTRO: module + Knowledge Check")],
  "2026-11-06": () => friday(["econ", "ECON problems"],
    ["cmput", "CMPUT Post-test 6: Queues and Linked Lists", "Due tonight (Canvas: 12:30 a.m.)"]),
};

// ---- Nov 2 – Dec 6: the weekly template ----

const isBetween = (date, range) => date >= range.from && date <= range.to;

function readingWeekDay(weekday) {
  const a3 = ["cmput", "CMPUT Assignment 3", "Due Mon Nov 16 (tentative)"];
  if (weekday === 5) {
    return [study("09:30", "11:00", ...PHYS_PREP), study("11:15", "12:45", ...a3),
      rest("12:45", "14:15", "Jumu'ah + lunch"), study("14:15", "15:30", "econ", "ECON problems"),
      rest("15:30", "15:45", "Asr"), study("15:45", "17:00", ...LAUNDRY)];
  }
  return freeDay(PHYS_PREP, ["econ", "ECON: this week's chapter"], a3, ["astro", "ASTRO: next module"]);
}

function templateDay(date) {
  const weekday = dayOfWeek(date);
  if (isBetween(date, SCHEDULE.readingWeek)) return readingWeekDay(weekday);
  const phys = slot => (isBetween(date, SCHEDULE.physMidterm) ? PHYS_PREP : slot);
  const cmputMid = isBetween(date, SCHEDULE.cmputMidterm);
  switch (weekday) {
    case 1: return monWed(date, phys(["phys", "PHYS review: this week's lectures"]), ["econ", "ECON: this week's chapter"]);
    case 2: return tuesday(["phys", "PHYS prelab + submit last week's lab report", "Report due 11 a.m."]);
    case 3: return monWed(date, ["astro", "ASTRO: this week's module"], phys(["phys", "PHYS Content Quiz", "Due Thu night"]));
    case 4: return freeDay(
      cmputMid ? ["cmput", "CMPUT Midterm 3 prep", "Midterm Mon Dec 7, 25%"] : ["cmput", "CMPUT lab or assignment due Fri"],
      ["econ", "ECON: this week's chapter"], ["phys", "PHYS lab report draft"], ["astro", "ASTRO: module + Knowledge Check"]);
    case 5: return friday(["econ", "ECON problems"], cmputMid ? ["cmput", "CMPUT Midterm 3 practice"] : ["cmput", "CMPUT assignment"]);
    case 6: return saturday(phys(["phys", "PHYS problem set"]));
    default: return [study("10:00", "11:30", "phys", "PHYS Reading Quiz + ASTRO Knowledge Check", "Both due Monday morning"),
      study("11:45", "13:00", "study", "Study Skills quiz + plan the week")];
  }
}

// Outside the plan: only that day's classes.
function classesOnly(date) {
  const weekday = dayOfWeek(date);
  if (weekday === 1 || weekday === 3) return [CMPUT_LECTURE, PHYS_LECTURE, astroSlot(date)];
  if (weekday === 5) return [CMPUT_LECTURE, PHYS_LECTURE];
  if (weekday === 2 && date <= "2026-12-01") return LABS;
  return [];
}

// 0 = Sunday … 6 = Saturday.
function dayOfWeek(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

// The Planner's own id for a block, so old ticks can be matched:
// "b." + date + "." + the title as lower-case words joined by "-".
function blockId(date, block) {
  const slug = block.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
  return `b.${date}.${slug}`;
}

// Chores that happen every day of the plan: dishes nightly, washroom on Sundays.
function homeChores(date) {
  const washroom = dayOfWeek(date) === 0 ? [study("13:00", "13:45", "chore", "Washroom cleaning")] : [];
  return [...washroom, study("21:00", "21:20", "chore", "Dishes", "Once you're home")];
}

// The day's blocks in time order, each with its id.
function scheduleFor(date) {
  let blocks = [];
  if (PLANNED_DAYS[date]) blocks = PLANNED_DAYS[date](date);
  else if (date >= SCHEDULE.templateStart && date <= SCHEDULE.templateEnd) blocks = templateDay(date);
  else if (date <= SCHEDULE.classesEnd) blocks = classesOnly(date);
  if (date >= SCHEDULE.extrasFrom && date <= SCHEDULE.templateEnd) blocks = [...blocks, ...homeChores(date)];
  return blocks
    .map(block => ({ ...block, id: blockId(date, block) }))
    .sort((a, b) => a.from.localeCompare(b.from));
}

// A study block's length in 30-min study blocks, at least 1: 1:30 → 3, 0:45 → 2.
function blockCount(block) {
  const minutes = toMinutes(block.to) - toMinutes(block.from);
  return Math.max(1, Math.round(minutes / ACADEMICS.blockMinutes));
}
