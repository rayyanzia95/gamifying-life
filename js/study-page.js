// Renders study.html: the next exams, the guides for the one picked, then every guide
// with course and type filters. Guides are links to his Claude artifacts (STUDY_GUIDES),
// so nothing here is stored: the page only reads config and the deadline ticks.

const STUDY_EXAM_COUNT = 3;

// What the page shows. Replaced (never changed in place) when a chip is tapped.
// exam: a deadlineId, or null for the soonest; course / kind: an id, or null for all.
let shown = { exam: null, course: null, kind: null };

function kindName(kindId) {
  return STUDY_GUIDE_KINDS.find(k => k.id === kindId)?.name ?? kindId;
}

// Newest first; ties keep their order in config.
function newestFirst(guides) {
  return [...guides].sort((a, b) => b.updated.localeCompare(a.updated));
}

// Guides written for this exam. If there are none, the newest one for its course
// (skipping labs, which are never exam prep), marked as a fallback.
function guidesForExam(exam) {
  const matched = STUDY_GUIDES.filter(g => g.exam === deadlineId(exam));
  if (matched.length > 0) return { guides: newestFirst(matched), fallback: false };
  const closest = newestFirst(STUDY_GUIDES.filter(g => g.course === exam.course && g.kind !== "lab"));
  return { guides: closest.slice(0, 1), fallback: true };
}

function filteredGuides({ course, kind }) {
  return newestFirst(STUDY_GUIDES.filter(g =>
    (course === null || g.course === course) && (kind === null || g.kind === kind)));
}

// ---- HTML pieces ----

function guideTileHtml(guide, { hot = false } = {}) {
  return `
    <a class="guide-tile course-${guide.course}${hot ? " hot" : ""}" href="${guide.url}"
       target="_blank" rel="noopener">
      <span class="guide-title">${guide.title}</span>
      <span class="guide-foot">
        <span class="guide-course">${courseShort(guide.course)}</span>
        <span class="kind-pill kind-${guide.kind}">${kindName(guide.kind)}</span>
        <span class="guide-date">${dayLabel(guide.updated, { month: "short", day: "numeric" })}</span>
      </span>
    </a>`;
}

function examChipHtml(exam, today, picked) {
  const when = [dayLabel(exam.date), exam.time].filter(Boolean).join(" · ");
  return `
    <button type="button" class="exam-chip course-${exam.course}" data-exam="${deadlineId(exam)}"
            aria-pressed="${picked}">
      <b>${countdownLabel(today, exam.date)}</b> ${courseShort(exam.course)} ${exam.title}
      <small>${when}</small>
    </button>`;
}

function forExamHtml(exam, today) {
  if (!exam) {
    return `<h2>For your next exam</h2><p class="muted">No exams left this term.</p>`;
  }
  const { guides, fallback } = guidesForExam(exam);
  const name = `${courseShort(exam.course)} ${exam.title}`;
  const note = fallback
    ? `<p class="guide-note">Nothing written for ${name} yet.${guides.length
        ? ` The newest ${courseShort(exam.course)} guide is the closest match.` : ""}</p>`
    : "";
  return `
    <div class="card-head"><h2>For ${name}</h2><span class="muted">${countdownLabel(today, exam.date)}</span></div>
    <div class="guide-grid">${guides.map(g => guideTileHtml(g, { hot: true })).join("")}</div>
    ${note}`;
}

// One row of single-choice chips. options: [{ value, label, chip }], value null = "all".
function chipRowHtml(name, options, current) {
  const chips = options.map(({ value, label, chip }) => `
    <button type="button" class="${chip}" data-${name}="${value ?? ""}"
            aria-pressed="${value === current}">${label}</button>`);
  return `<div class="filters" role="group" aria-label="${name === "course" ? "Course" : "Type"}">${chips.join("")}</div>`;
}

function filtersHtml({ course, kind }) {
  const courses = [
    { value: null, label: `All ${STUDY_GUIDES.length}`, chip: "filter-button" },
    ...ACADEMICS.courses
      .filter(c => STUDY_GUIDES.some(g => g.course === c.id))
      .map(c => ({ value: c.id, label: c.short, chip: `filter-chip course-${c.id}` })),
  ];
  const kinds = [
    { value: null, label: "Any type", chip: "filter-button" },
    ...STUDY_GUIDE_KINDS.map(k => ({ value: k.id, label: k.name, chip: "filter-button" })),
  ];
  return chipRowHtml("course", courses, course) + chipRowHtml("kind", kinds, kind);
}

function allGuidesHtml(filter) {
  const guides = filteredGuides(filter);
  const what = [filter.course && courseShort(filter.course), filter.kind && kindName(filter.kind).toLowerCase()]
    .filter(Boolean).join(" ");
  const grid = guides.length
    ? `<div class="guide-grid">${guides.map(g => guideTileHtml(g)).join("")}</div>`
    : `<p class="guide-note">No ${what || "guides"} yet.</p>`;
  return `
    <div class="card-head"><h2>All guides</h2><span class="muted">${guides.length}</span></div>
    ${filtersHtml(filter)}
    ${grid}`;
}

// ---- Drawing and taps ----

function render() {
  const today = todayString();
  const exams = nextExams(loadEvents(), today, STUDY_EXAM_COUNT);
  const exam = exams.find(e => deadlineId(e) === shown.exam) ?? exams[0];
  document.getElementById("exam-strip").innerHTML =
    exams.map(e => examChipHtml(e, today, e === exam)).join("");
  document.getElementById("for-exam").innerHTML = forExamHtml(exam, today);
  document.getElementById("all-guides").innerHTML = allGuidesHtml(shown);
}

// One listener for every chip (event delegation): data-exam, data-course or data-kind
// says which choice it sets; an empty value means "all".
function onChipClick(event) {
  const chip = event.target.closest("button[data-exam], button[data-course], button[data-kind]");
  if (!chip) return;
  const [key, value] = Object.entries(chip.dataset)[0];
  shown = { ...shown, [key]: value || null };
  render();
}

document.getElementById("exam-strip").addEventListener("click", onChipClick);
document.getElementById("all-guides").addEventListener("click", onChipClick);
render();
