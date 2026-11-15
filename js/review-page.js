// Renders review.html: one week looked back on. XP by branch against the week before, how many days each branch
// was touched (the balance web), the week in numbers, what is coming, and one line to yourself for next week.
// A week runs Sunday to Saturday (weekStart). On a Sunday the page opens on the week that just ended; any other
// day it opens on this week so far. ‹ › step a week at a time.
// The note is one event per week: { date: <that week's Sunday>, activity: "review", note }. It earns no XP
// (scoreEvent has no rule for it) and syncs like every other event.
// Needs history.js (xpByDay), quran.js and dua.js (streaks), ui.js (showUndo, streakBadge).

const REVIEW = { centre: 110, radius: 74, labelRadius: 96 };

let reviewWeek = defaultReviewWeek();

function defaultReviewWeek() {
  const today = todayString();
  const thisWeek = weekStart(today);
  return today === thisWeek ? shiftDate(thisWeek, -7) : thisWeek;
}

const isReviewNote = event => event.activity === "review";
const weekDays = week => Array.from({ length: 7 }, (_, d) => shiftDate(week, d));
const shortDate = date => new Date(`${date}T12:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const weekName = week => `${shortDate(week)} – ${shortDate(shiftDate(week, 6))}`;

// XP per branch for a week, from the days up to today: { deen: 640, ... } plus weekly bonuses where one was earned.
function reviewWeekXp(events, week) {
  const end = shiftDate(week, 6);
  const days = xpByDay(events, week, end);
  const totals = Object.fromEntries(BRANCHES.map(b => [b.id, 0]));
  Object.values(days).forEach(day => Object.entries(day).forEach(([branch, xp]) => { if (branch in totals) totals[branch] += xp; }));
  if (choreWeekFull(events, week)) totals[CHORES.branch] += CHORES.weekBonus;
  if (week < weekStart(todayString())) totals[MONEY.branch] += moneyWeek(events, week).banked; // paid when the week closes
  return totals;
}

// How many of the week's days (so far) each branch earned anything on.
function reviewActiveDays(events, week) {
  const days = xpByDay(events, week, shiftDate(week, 6));
  return Object.fromEntries(BRANCHES.map(b => [b.id, weekDays(week).filter(d => (days[d]?.[b.id] || 0) > 0).length]));
}

// ---- Cards ----

function drawReviewWeek(events) {
  const today = todayString();
  const current = weekStart(today);
  const first = events.map(e => e.date).sort()[0];
  const arrow = (text, label, to, disabled) => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: "arrow", textContent: text, disabled });
    b.setAttribute("aria-label", label);
    b.addEventListener("click", () => { reviewWeek = to; render(); });
    return b;
  };
  const totals = reviewWeekXp(events, reviewWeek);
  const before = reviewWeekXp(events, shiftDate(reviewWeek, -7));
  const sum = t => Object.values(t).reduce((a, b) => a + b, 0);
  const diff = sum(totals) - sum(before);
  const when = reviewWeek === current ? "this week so far" : reviewWeek === shiftDate(current, -7) ? "last week" : "";
  const heading = document.createElement("h2");
  heading.append(weekName(reviewWeek) + " ", Object.assign(document.createElement("span"), { className: "muted", textContent: when }));
  const nav = Object.assign(document.createElement("div"), { className: "day-nav" });
  nav.append(arrow("‹", "Previous week", shiftDate(reviewWeek, -7), !first || reviewWeek <= weekStart(first)), heading,
    arrow("›", "Next week", shiftDate(reviewWeek, 7), reviewWeek >= current));
  const total = Object.assign(document.createElement("p"), { className: "review-total" });
  total.innerHTML = `<strong>${sum(totals)}</strong> XP` +
    (sum(before) > 0 || sum(totals) > 0 ? ` <span class="muted">${diff === 0 ? "same as" : `${Math.abs(diff)} ${diff > 0 ? "more than" : "fewer than"}`} the week before</span>` : "");
  document.getElementById("review-week").replaceChildren(nav, total);
}

function drawReviewBranches(events) {
  const totals = reviewWeekXp(events, reviewWeek);
  const before = reviewWeekXp(events, shiftDate(reviewWeek, -7));
  const top = Math.max(...Object.values(totals), ...Object.values(before), 1);
  const rows = BRANCHES.map(b => {
    const now = totals[b.id], was = before[b.id];
    const change = now === was ? "" : `<span class="${now > was ? "up" : "down"}">${now > was ? "▲" : "▼"} ${Math.abs(now - was)}</span>`;
    return `<a class="review-row" href="${b.page}" style="--c: var(--${b.id})">
      <span class="review-name"><span class="row-icon" style="color: var(--${b.id})">${iconSvg(b.id)}</span>${b.name}</span>
      <span class="review-bar" role="img" aria-label="${now} XP, ${was} the week before">
        <i class="was" style="width: ${(was / top) * 100}%"></i><i style="width: ${(now / top) * 100}%"></i></span>
      <span class="review-xp">${now}${change}</span></a>`;
  }).join("");
  const stalled = BRANCHES.filter(b => totals[b.id] === 0).map(b => b.name);
  const note = stalled.length === 0 ? "Every branch moved this week."
    : stalled.length === BRANCHES.length ? "Nothing logged for this week."
    : `No XP in ${stalled.join(", ")}. Not a penalty, just where the week didn't go.`;
  document.getElementById("review-branches").innerHTML =
    `<div class="card-row"><span class="card-title">XP by branch</span><span class="muted">pale bar = the week before</span></div>
     <div class="review-rows">${rows}</div><p class="muted review-stalled">${note}</p>`;
}

// The balance web: each branch's spoke runs to how many days of the week it was active on (0 to 7).
function drawReviewBalance(events) {
  const active = reviewActiveDays(events, reviewWeek);
  const { centre, radius, labelRadius } = REVIEW;
  const n = BRANCHES.length;
  const point = (i, r) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [centre + Math.cos(angle) * r, centre + Math.sin(angle) * r];
  };
  const ring = f => `<polygon points="${BRANCHES.map((_, i) => point(i, radius * f).join(",")).join(" ")}" fill="none" stroke="var(--border)"/>`;
  const spokes = BRANCHES.map((_, i) => { const [x, y] = point(i, radius); return `<line x1="${centre}" y1="${centre}" x2="${x}" y2="${y}" stroke="var(--border)"/>`; }).join("");
  const shape = BRANCHES.map((b, i) => point(i, radius * Math.max(active[b.id] / 7, 0.04)).join(",")).join(" ");
  const dots = BRANCHES.map((b, i) => { const [x, y] = point(i, radius * Math.max(active[b.id] / 7, 0.04)); return `<circle cx="${x}" cy="${y}" r="3.5" style="fill: var(--${b.id})"/>`; }).join("");
  const labels = BRANCHES.map((b, i) => {
    const [x, y] = point(i, labelRadius);
    return `<text class="web-label" x="${x}" y="${y}" text-anchor="middle">${b.name}</text><text class="review-days" x="${x}" y="${y + 11}" text-anchor="middle">${active[b.id]}/7</text>`;
  }).join("");
  const said = BRANCHES.map(b => `${b.name} ${active[b.id]} of 7 days`).join(", ");
  const least = Math.min(...Object.values(active)), most = Math.max(...Object.values(active));
  const quiet = BRANCHES.filter(b => active[b.id] === least).map(b => b.name);
  const line = most === 0 ? "The web fills in as days are logged."
    : least === most ? "Even across every branch." : `Quietest: ${quiet.join(", ")} (${least} day${least === 1 ? "" : "s"}).`;
  document.getElementById("review-balance").innerHTML =
    `<div class="card-row"><span class="card-title">Balance</span><span class="muted">days active, out of 7</span></div>
     <svg class="review-web" viewBox="0 0 220 226" role="img" aria-label="Days active this week: ${said}">
       ${[1 / 3, 2 / 3, 1].map(ring).join("")}${spokes}<polygon class="web-shape" points="${shape}"/>${dots}${labels}</svg>
     <p class="muted">${line}</p>`;
}

function reviewFacts(events) {
  const week = reviewWeek, end = shiftDate(week, 7), days = weekDays(week);
  const inWeek = events.filter(e => e.date >= week && e.date < end);
  const fard = inWeek.filter(e => e.prayer && PRAYERS.some(p => p.id === e.prayer && !p.bonus && mainSet(p).id === e.set));
  const upTo = days.filter(d => d <= todayString()).length;
  const quests = choreList(events).filter(c => choreDueThisWeek(events, c, week) > 0);
  const questsDone = quests.filter(c => choreLeftThisWeek(events, c, week) === 0).length;
  const money = moneyWeek(events, week);
  const blocks = inWeek.filter(isStudy).length;
  const ticked = inWeek.filter(isDeadlineTick).length;
  return [
    { branch: "deen", label: "Prayers", value: `${fard.length} of ${upTo * 5}`, sub: `${fard.filter(e => e.onTime || e.jamaah).length} on time · ${fard.filter(e => e.masjid).length} in the masjid` },
    { branch: "deen", label: "Quran", value: `${inWeek.filter(e => e.activity === "quran").reduce((n, e) => n + (e.amount || 0), 0)} juz`, sub: `${new Set(inWeek.filter(e => e.activity === "quran" && e.amount > 0).map(e => e.date)).size} days revised` },
    { branch: "academics", label: "Study", value: `${blocks} block${blocks === 1 ? "" : "s"}`, sub: `${(blocks * ACADEMICS.blockMinutes / 60).toFixed(1)} h · ${ticked} deadline${ticked === 1 ? "" : "s"} ticked` },
    { branch: "health", label: "Workouts", value: `${inWeek.filter(isExercise).length} of ${EXERCISE.perWeek}`, sub: `${inWeek.filter(e => e.activity === "sleep").length} nights logged` },
    { branch: "chores", label: "Quests", value: `${questsDone} of ${quests.length}`, sub: choreWeekFull(events, week) ? `full week · +${CHORES.weekBonus} XP` : "every quest done earns the bonus" },
    { branch: "money", label: "Money", value: `${money.loggedDays} of ${upTo} days logged`, sub: money.budget ? `payout ${week < weekStart(todayString()) ? money.banked : money.onTrack} XP${week < weekStart(todayString()) ? "" : " on track"}` : "no budget set" },
    { branch: "personal", label: "Journal", value: `${new Set(inWeek.filter(e => e.activity === "journal").map(e => e.date)).size} of ${upTo} days`, sub: `${inWeek.filter(e => e.activity === "alone").length} alone · ${inWeek.filter(e => e.activity === "friends").length} with friends` },
    { branch: "people", label: "People", value: `${inWeek.filter(isContact).length} check-in${inWeek.filter(isContact).length === 1 ? "" : "s"}`, sub: `${inWeek.filter(isWished).length} wishes sent` },
  ];
}

function drawReviewFacts(events) {
  const tiles = reviewFacts(events).map(f => `<div class="review-fact" style="--c: var(--${f.branch})">
      <span class="review-fact-label">${f.label}</span><strong>${f.value}</strong><small class="muted">${f.sub}</small></div>`).join("");
  const box = document.getElementById("review-facts");
  box.innerHTML = `<div class="card-row"><span class="card-title">The week in numbers</span></div><div class="review-facts">${tiles}</div>
    <p class="review-streaks muted" id="review-streaks">Streaks now: </p>`;
  // Streaks are as of today, whichever week is showing (a streak is a running thing, not a weekly one).
  const streaks = box.querySelector("#review-streaks");
  const add = (name, streak) => {
    const { rest, ...plain } = streak; // no "Use a rest day" button here: that belongs on the branch's own page
    const item = Object.assign(document.createElement("span"), { className: "review-streak" });
    item.append(name + " ", streakBadge(plain));
    streaks.append(item);
  };
  add("Quran", revisionStreak(events));
  add("Dua", duaStreak(events));
  const chores = choreStreak(events, todayString());
  const weeks = Object.assign(document.createElement("span"), { className: "review-streak", textContent: `Chores ${chores.weeks} week${chores.weeks === 1 ? "" : "s"}${chores.paused ? " (paused)" : ""}` });
  streaks.append(weeks);
}

function drawReviewAhead(events) {
  const today = todayString();
  const ticked = tickedDeadlines(events);
  const due = deadlinesBetween(today, shiftDate(today, 14)).filter(d => !ticked.has(deadlineId(d)));
  const rows = due.map(d => `<li class="${d.kind === "exam" ? "exam" : ""}"><span>${courseShort(d.course)} ${d.title}</span><small>${dayLabel(d.date)} · ${countdownLabel(today, d.date)}</small></li>`).join("");
  document.getElementById("review-ahead").innerHTML =
    `<div class="card-row"><span class="card-title">Next two weeks</span><a class="muted" href="planner.html">Planner →</a></div>
     ${due.length ? `<ul class="review-ahead">${rows}</ul>` : '<p class="muted">Nothing due in the next two weeks.</p>'}`;
}

// ---- The note ----

function saveReviewNote(text) {
  const note = text.trim();
  const week = reviewWeek;
  if ((loadEvents().find(e => isReviewNote(e) && e.date === week)?.note ?? "") === note) return;
  // commitWithUndo (storage.js) saves what the function returns and hands back a function that undoes it.
  const undo = commitWithUndo(events => {
    const old = events.find(e => isReviewNote(e) && e.date === week);
    if (!note) return events.filter(e => e !== old);
    return old ? events.map(e => (e === old ? { ...e, note } : e)) : [...events, { date: week, activity: "review", note }];
  });
  render();
  showUndo(note ? "Note saved" : "Note removed", undo, render);
}

function drawReviewNote(events) {
  const saved = events.find(e => isReviewNote(e) && e.date === reviewWeek)?.note ?? "";
  const form = document.createElement("form");
  form.className = "review-note";
  form.innerHTML = `<label class="card-title" for="review-note-text">What I'll change next week</label>
    <textarea id="review-note-text" rows="3" maxlength="400" placeholder="One line is enough."></textarea>
    <div class="card-row"><span class="muted">${saved ? "Saved for this week. Edit and save again to change it." : "Kept with this week, synced like everything else."}</span>
      <button class="filter-button" type="submit">Save</button></div>`;
  form.querySelector("textarea").value = saved;
  form.addEventListener("submit", event => { event.preventDefault(); saveReviewNote(form.querySelector("textarea").value); });
  document.getElementById("review-note").replaceChildren(form);
}

function drawReviewPast(events) {
  const notes = events.filter(e => isReviewNote(e) && e.note && e.date !== reviewWeek).sort((a, b) => b.date.localeCompare(a.date));
  const box = document.getElementById("review-past");
  box.hidden = notes.length === 0;
  if (!notes.length) return;
  box.innerHTML = `<div class="card-row"><span class="card-title">Earlier notes</span></div><ul class="review-past"></ul>`;
  const list = box.querySelector("ul");
  notes.forEach(n => {
    const open = Object.assign(document.createElement("button"), { type: "button", className: "review-past-week", textContent: weekName(n.date) });
    open.addEventListener("click", () => { reviewWeek = n.date; render(); window.scrollTo({ top: 0 }); });
    const item = document.createElement("li");
    item.append(open, Object.assign(document.createElement("p"), { textContent: n.note })); // textContent: the note is typed text, never HTML
    list.append(item);
  });
}

function render() {
  const events = loadEvents();
  drawReviewWeek(events);
  drawReviewBranches(events);
  drawReviewBalance(events);
  drawReviewFacts(events);
  drawReviewAhead(events);
  drawReviewNote(events);
  drawReviewPast(events);
}

render();
