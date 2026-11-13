// Grimoire ledger layout (Appearance → Layout), Home and the branch pages. The frame is a book (two pages, a
// gutter, a ruled border, running heads, folios, a drop cap); what is printed on it is the ledger: a masthead, the
// overall level as one big roman numeral, each branch a numbered chapter with a week of small bars, and a facing
// page with today's prayers and what is due. Styles in css/layout-codex.css. Loads after command-wheel.js on every
// page; home.js calls codexHomeHtml (HOME_LAYOUTS) and on a branch page setupCodexPage adds a chapter header.
// Needs hud-home.js (hudPrayers) and the scoring files; the Home part only runs when home.js calls it.

const CX_WEEK = 7; // days of small bars per chapter, today last
const CX_DUE = 3; // exams listed under "Due"
const CX_MIN_BAR = 8; // percent: the shortest bar, so an empty day still shows

const ROMAN_PARTS = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"],
  [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

function cxRoman(n) {
  let rest = n;
  return ROMAN_PARTS.reduce((text, [value, symbol]) => {
    const times = Math.floor(rest / value);
    rest -= times * value;
    return text + symbol.repeat(times);
  }, "");
}

const cxPercent = share => Math.round(Math.min(share, 1) * 100);

// XP per day for every branch over the last CX_WEEK days, oldest first: { deen: [0, 40, ...], ... }.
function cxWeekXp(events, today) {
  const days = Array.from({ length: CX_WEEK }, (_, i) => shiftDate(today, i + 1 - CX_WEEK));
  const week = Object.fromEntries(BRANCHES.map(b => [b.id, days.map(() => 0)]));
  for (const event of events) {
    const at = days.indexOf(event.date);
    if (at < 0) continue;
    const score = scoreEvent(event, events);
    if (score && week[score.branch]) week[score.branch][at] += score.core + score.extra;
  }
  return week;
}

// A week of small bars, each relative to that branch's best day in the week. The last bar (today) is full strength.
function cxBarsHtml(xpPerDay) {
  const best = Math.max(...xpPerDay, 1);
  const bars = xpPerDay.map(xp => `<i style="--h: ${Math.max(CX_MIN_BAR, Math.round((xp / best) * 100))}%"></i>`);
  return `<span class="cx-bars" aria-hidden="true">${bars.join("")}</span>`;
}

// One chapter column: number, name, big level, a rule for progress to the next level, a line, optionally bars.
function cxChapterHtml({ href, id, chapter, name, level, share, line, bars = "" }) {
  return `<a class="cx-bc" href="${href}" style="--c: var(--${id})"><span class="cx-chn">Chapter ${cxRoman(chapter)}</span>
    <span class="cx-nm">${name}</span><span class="cx-lv num">${level}</span>
    <span class="cx-rule"><i style="width: ${cxPercent(share)}%"></i></span><span class="cx-ln num">${line}</span>${bars}</a>`;
}

function cxDekHtml(overall, branches) {
  const next = Math.round((overall.into / overall.cost) * 100);
  const sorted = [...branches].sort((a, b) => b.share - a.share);
  const lead = sorted[0];
  const quiet = sorted[sorted.length - 1];
  const today = lead.share > 0
    ? `${lead.name} led today${quiet.share < lead.share ? `; ${quiet.name} is the quiet chapter` : ""}.`
    : "Today's page is still blank.";
  return `Level ${overall.level} is written, <em>${next}% of the way</em> to ${overall.level + 1}. ${today}`;
}

function cxDayOfYear(today) {
  return daysBetween(`${today.slice(0, 4)}-01-01`, today) + 1;
}

function cxPrayersHtml(events, today) {
  const rows = hudPrayers(events, today).map(p => {
    const name = p.name[0] + p.name.slice(1).toLowerCase();
    return `<li class="${p.done ? "done" : ""}"><span>${p.done ? "✓" : "·"}</span><span>${name}</span>
      <span class="num">${clock12(Math.round(p.hour * 60))}</span></li>`;
  }).join("");
  return `<ul class="cx-list">${rows}</ul>`;
}

function cxDueHtml(events, today) {
  const exams = nextExams(events, today, CX_DUE);
  if (!exams.length) return `<p class="cx-note">Nothing due. A quiet page.</p>`;
  const rows = exams.map(e => `<li><a href="academics.html"><span>${courseShort(e.course)} · ${e.title}</span>
    <span class="num">${countdownLabel(today, e.date)}</span></a></li>`).join("");
  return `<ul class="cx-list cx-due">${rows}</ul>`;
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function codexHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const week = cxWeekXp(events, today);
  let xpToday = 0;
  const chapters = branches.map((b, i) => {
    const { core, extra } = todayXp(events, b.id);
    xpToday += core + extra;
    return cxChapterHtml({
      href: b.page, id: b.id, chapter: i + 1, name: b.name, level: b.level, share: b.into / b.cost,
      line: `+${core + extra} XP · ${cxPercent(b.share)}% of today`, bars: cxBarsHtml(week[b.id]),
    });
  }).join("");
  const folio = cxRoman(overall.level).toLowerCase();
  const date = dayLabel(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `<div class="cx">
    <section class="cx-pg">
      <header class="cx-mast"><div class="cx-run">Book of days · folio ${folio}</div><h2 class="cx-title">The Ledger</h2>
        <div class="cx-dl"><span>${date}</span><span>Day ${cxDayOfYear(today)}</span></div></header>
      <div class="cx-lead"><span class="cx-huge" role="img" aria-label="Overall level ${overall.level}">${cxRoman(overall.level)}</span>
        <p class="cx-dek">${cxDekHtml(overall, branches)}</p></div>
      <div class="cx-cols">${chapters}<div class="cx-bc" style="--c: var(--accent)"><span class="cx-chn">Today</span>
        <span class="cx-nm">All chapters</span><span class="cx-lv num">+${xpToday}</span>
        <span class="cx-ln">XP written today. Nothing is ever struck out.</span></div></div>
      <div class="cx-fol">· ${folio} ·</div>
    </section>
    <aside class="cx-pg">
      <div class="cx-run">Rites for today</div>${cxPrayersHtml(events, today)}
      <h3>Due</h3>${cxDueHtml(events, today)}
      <p class="cx-note">${overallXp} XP written in all.</p>
      <div class="cx-fol">· ${cxRoman(overall.level + 1).toLowerCase()} ·</div>
    </aside>
  </div>`;
}

// Branch page: a chapter header under the title, with this branch's week of bars.
function cxPageHeaderHtml(branch) {
  const events = loadEvents();
  const { level, into, cost } = levelOf(xpByBranch(events), branch.id);
  const { core, extra } = todayXp(events, branch.id);
  const chapter = BRANCHES.findIndex(b => b.id === branch.id) + 1;
  const week = cxWeekXp(events, todayString())[branch.id];
  return `<header class="cx-header" style="--c: var(--${branch.id})">
    <div class="cx-run">Chapter ${cxRoman(chapter).toLowerCase()} · ${branch.name}</div>
    <div class="cx-header-row"><span class="cx-lv num" aria-label="Level ${level}">${level}</span>
      <div class="cx-header-text"><span class="cx-rule"><i style="width: ${cxPercent(into / cost)}%"></i></span>
        <span class="num">${into} / ${cost} XP to level ${level + 1}</span><span class="num">Today +${core + extra} XP</span></div>
      ${cxBarsHtml(week)}</div>
  </header>`;
}

function setupCodexPage() {
  if (document.documentElement.dataset.layout !== "codex") return;
  const branch = BRANCHES.find(b => b.page === currentFile()); // nav.js
  if (!branch) return;
  document.body.classList.add("cx-branch");
  document.querySelector("h1")?.insertAdjacentHTML("afterend", cxPageHeaderHtml(branch));
}

setupCodexPage();
