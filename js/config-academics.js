// Academics data: DEADLINES, STUDY_GUIDE_KINDS, GUIDES_ARTIFACT, STUDY_GUIDES.

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
  // CMPUT 175's "final": a final midterm in the last class (its usual lecture slot).
  { date: "2026-12-07", time: "9:00 a.m.",  course: "cmput", kind: "exam",       title: "Midterm 3", hp: 10, note: "Final midterm, in the last class · NRE 1-001 · 50 min" },
  { date: "2026-12-07", time: "Mon night",  course: "phys",  kind: "quiz",       title: "Content Quiz 10" },
  { date: "2026-12-08", time: "12:00 p.m.", course: "phys",  kind: "task",       title: "Redo lab selection" },
  { date: "2026-12-13", time: "Sun night",  course: "study", kind: "task",       title: "Student Evaluation Form" },
  // Finals, from the Bear Tracks exam schedule (.ics). CMPUT 175's is Midterm 3
  // above. ASTRO 101 is at its original time until the accommodation (away from
  // Jumu'ah) is confirmed; then change date/time/note here (the id stays the same).
  { date: "2026-12-14", time: "9:00 a.m.",  course: "econ",  kind: "exam",       title: "Final exam", hp: 10, note: "ED 3-106 · 2.5 h (room booked 9–12)" },
  { date: "2026-12-18", time: "1:00 p.m.",  course: "astro", kind: "exam",       title: "Final exam", hp: 10, note: "Pending accommodation (Jumu'ah) · ED Gym, odd rows 01–13 · 3 h" },
  { date: "2026-12-22", time: "5:30 p.m.",  course: "phys",  kind: "exam",       title: "Final exam", hp: 10, note: "Van Vliet Pavilion, odd rows 01–21 · 3 h" },
];

// Study guides, crash courses, cheat sheets and lab reports: links to his own
// Claude artifacts, which only open for him. kind is one of STUDY_GUIDE_KINDS;
// updated ("YYYY-MM-DD") sorts the Study page newest first; exam (optional) is the
// deadlineId of the exam a guide is for, when the title says so. Without one, the
// Study page falls back to the newest guide for that exam's course.
const STUDY_GUIDE_KINDS = [
  { id: "crash", name: "Crash course" },
  { id: "cheat", name: "Cheat sheet" },
  { id: "guide", name: "Study guide" },
  { id: "notes", name: "Notes" },
  { id: "lab",   name: "Lab" },
  { id: "plan",  name: "Plan" },
  { id: "practice", name: "Practice bank" },
  { id: "mock",  name: "Mock exam" },
  { id: "visual", name: "Visual guide" },
];

// One artifact holds every course's crash course, practice bank, mock exams and visual
// guide (a copy of his Fall 2026 Planner); "#phys.course" opens that one tab.
const GUIDES_ARTIFACT = "https://claude.ai/artifact/1mtx4FJACcCm4MjCPiLEQD";

const STUDY_GUIDES = [
  { course: "phys",  kind: "crash",    updated: "2026-11-10", title: "Midterm 2 Crash Course",            url: `${GUIDES_ARTIFACT}#phys.course`,    exam: "phys-midterm-2" },
  { course: "phys",  kind: "practice", updated: "2026-11-10", title: "Midterm 2 Practice Bank",           url: `${GUIDES_ARTIFACT}#phys.practice`,  exam: "phys-midterm-2" },
  { course: "phys",  kind: "mock",     updated: "2026-11-10", title: "Midterm 2 Mock Exams",              url: `${GUIDES_ARTIFACT}#phys.exam`,      exam: "phys-midterm-2" },
  { course: "phys",  kind: "visual",   updated: "2026-11-10", title: "Midterm 2 Visual Guide",            url: `${GUIDES_ARTIFACT}#phys.visual`,    exam: "phys-midterm-2" },
  { course: "cmput", kind: "crash",    updated: "2026-11-10", title: "Midterm 3 Crash Course",            url: `${GUIDES_ARTIFACT}#cmput.course`,   exam: "cmput-midterm-3" },
  { course: "cmput", kind: "practice", updated: "2026-11-10", title: "Midterm 3 Practice Bank",           url: `${GUIDES_ARTIFACT}#cmput.practice`, exam: "cmput-midterm-3" },
  { course: "cmput", kind: "mock",     updated: "2026-11-10", title: "Midterm 2 & 3 Mock Exams",          url: `${GUIDES_ARTIFACT}#cmput.exam`,     exam: "cmput-midterm-3" },
  { course: "cmput", kind: "visual",   updated: "2026-11-10", title: "Midterm 3 Visual Guide",            url: `${GUIDES_ARTIFACT}#cmput.visual`,   exam: "cmput-midterm-3" },
  { course: "econ",  kind: "crash",    updated: "2026-11-10", title: "Final Exam Crash Course",           url: `${GUIDES_ARTIFACT}#econ.course`,    exam: "econ-final-exam" },
  { course: "econ",  kind: "practice", updated: "2026-11-10", title: "Final Exam Practice Bank",          url: `${GUIDES_ARTIFACT}#econ.practice`,  exam: "econ-final-exam" },
  { course: "econ",  kind: "mock",     updated: "2026-11-10", title: "Final Mock Exams",                  url: `${GUIDES_ARTIFACT}#econ.exam`,      exam: "econ-final-exam" },
  { course: "econ",  kind: "visual",   updated: "2026-11-10", title: "Final Exam Visual Guide",           url: `${GUIDES_ARTIFACT}#econ.visual`,    exam: "econ-final-exam" },
  { course: "astro", kind: "crash",    updated: "2026-11-10", title: "Quiz Crash Course: Modules 7–8",    url: `${GUIDES_ARTIFACT}#astro.course`,   exam: "astro-quiz-modules-7-8" },
  { course: "astro", kind: "practice", updated: "2026-11-10", title: "Modules 7–8 Practice Bank",         url: `${GUIDES_ARTIFACT}#astro.practice`, exam: "astro-quiz-modules-7-8" },
  { course: "astro", kind: "mock",     updated: "2026-11-10", title: "Modules 7–8 Mock Quizzes",          url: `${GUIDES_ARTIFACT}#astro.exam`,     exam: "astro-quiz-modules-7-8" },
  { course: "astro", kind: "visual",   updated: "2026-11-10", title: "Modules 7–8 Visual Guide",          url: `${GUIDES_ARTIFACT}#astro.visual`,   exam: "astro-quiz-modules-7-8" },
  { course: "study", kind: "crash",    updated: "2026-11-10", title: "Study Skills Crash Course",         url: `${GUIDES_ARTIFACT}#study.course` },
  { course: "study", kind: "practice", updated: "2026-11-10", title: "Study Skills Practice",             url: `${GUIDES_ARTIFACT}#study.practice` },
  { course: "study", kind: "visual",   updated: "2026-11-10", title: "Study Skills Visual Guide",         url: `${GUIDES_ARTIFACT}#study.visual` },
  { course: "phys",  kind: "lab",   updated: "2026-11-10", title: "Lab Report 13: Springs II",                  url: "https://claude.ai/artifact/EAWsLeXs3mpMEk1VeYcU6R" },
  { course: "phys",  kind: "lab",   updated: "2026-11-03", title: "Lab Report 12: Hooke's Law and SHM",         url: "https://claude.ai/artifact/AK8QuNDZz73DKghQg57YoN" },
  { course: "phys",  kind: "lab",   updated: "2026-10-27", title: "Human Arm Statics Lab: Worksheet Solutions", url: "https://claude.ai/artifact/LCpbpx31EH9ChHwy1ohuqv" },
  { course: "phys",  kind: "notes", updated: "2026-10-06", title: "Physics Exam Notes: Walker Ch. 1–6",         url: "https://claude.ai/artifact/BWezzUvVVH4nitiobjV2c9" },
  { course: "phys",  kind: "notes", updated: "2026-10-06", title: "Midterm 1 Revision Notes",                   url: "https://claude.ai/artifact/My9GL4CTjuyTv7d3MxJAJ6" },
  { course: "phys",  kind: "crash", updated: "2026-10-05", title: "Midterm Sprint",                             url: "https://claude.ai/artifact/6XnAQjXB2AsZCWFjqcB5Ne" },
  { course: "phys",  kind: "guide", updated: "2026-10-02", title: "Midterm 1 Study Guide",                      url: "https://claude.ai/artifact/SgcJ73wVs21PvQ7yFo9M7K" },
  { course: "cmput", kind: "guide", updated: "2026-11-04", title: "Midterm Prep",                               url: "https://claude.ai/artifact/PsYfeWvD9QfLQ3GsW3Bf1N" },
  { course: "cmput", kind: "plan",  updated: "2026-11-03", title: "Midterm 2 & 3 Game Plan",                    url: "https://claude.ai/artifact/667nxsHxxKVhKrZ3sZNXwH", exam: "cmput-midterm-3" },
  { course: "cmput", kind: "cheat", updated: "2026-11-02", title: "Exam Study Guide & Cheat Sheet",             url: "https://claude.ai/artifact/8FVeWPCvVZH6sD5tXXXyJi" },
  { course: "cmput", kind: "guide", updated: "2026-11-01", title: "Midterm 2 Study Guide",                      url: "https://claude.ai/artifact/3ivRtJS7tzP1jCVTzZAjBu" },
  { course: "cmput", kind: "cheat", updated: "2026-10-14", title: "Midterm 1 Cheat Sheet",                      url: "https://claude.ai/artifact/9zVfP48hV3qaDoFe5s3gfD" },
  { course: "cmput", kind: "guide", updated: "2026-10-13", title: "Midterm 1 Study Guide",                      url: "https://claude.ai/artifact/TGDWxdydwNmAjnEfN7orWa" },
  { course: "cmput", kind: "guide", updated: "2026-10-02", title: "Midterm 1 Study Guide (first version)",      url: "https://claude.ai/artifact/NpChdvWyknAt4PRpCPxdS1" },
  { course: "econ",  kind: "plan",  updated: "2026-10-27", title: "Midterm Study Guide & Plan",                 url: "https://claude.ai/artifact/8w2LbFT3BmtzTRZKa7prya" },
  { course: "econ",  kind: "guide", updated: "2026-10-02", title: "Midterm Study Guide",                        url: "https://claude.ai/artifact/YHRsiDXBheJHkVGCDSfCg3" },
  { course: "astro", kind: "crash", updated: "2026-10-26", title: "Quiz Crash Course: Modules 5–6",             url: "https://claude.ai/artifact/KtN4sRkC8ovxL3g9rTifcm" },
  { course: "astro", kind: "guide", updated: "2026-10-19", title: "Quiz 2 Study Guide (Modules 3–4)",           url: "https://claude.ai/artifact/Up8z5RThHc9aVovBF9Qgr6" },
  { course: "astro", kind: "guide", updated: "2026-10-02", title: "Modules 3–4 Study Guide",                    url: "https://claude.ai/artifact/XYk9J63wKsKjcmd4jiwC5t" },
  { course: "study", kind: "notes", updated: "2026-10-04", title: "October Assignment: Plan, Practice, Adapt",  url: "https://claude.ai/artifact/Cwbo8zY7kMLn6kNB7qWGYp" },
  { course: "study", kind: "plan",  updated: "2026-10-14", title: "Fall 2026 Study Plan",                       url: "https://claude.ai/artifact/CnhcwmrNcXiijodBf5kkL9" },
  { course: "study", kind: "plan",  updated: "2026-10-14", title: "Fall 2026 Deadlines",                        url: "https://claude.ai/artifact/MCiKJ8UDLoL3GiHCHW6DAf" },
];
