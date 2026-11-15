// Home quick logging, drawing + taps: the "Now" strip, the quick-log chips, the Today checklist, the
// Spend / Study sheet and the Undo toast. Data from today-items.js, writers from quick-log.js.
// drawQuickLog(events) is called by home.js render(); a tap saves, then Home redraws through render().

const QL_CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';


function qlNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const qlCount = item => (item.goal ? `${item.count}/${item.goal}` : "");

// ---- Drawing ----

// "Opens 5:12 AM · in 7h 3m" for tomorrow's Fajr, under the given title (no tick, no bar).
function qlFajrTomorrowHtml(today, now, title) {
  const fajr = prayerOpensAt("fajr", shiftDate(today, 1));
  return `<div class="ql-pr"><div class="ql-grow"><div class="ql-name">${title}</div>
      <div class="ql-sub">Opens ${clock12(fajr)} · in ${durationLabel(MINUTES_PER_DAY - now + fajr)}</div></div></div>`;
}

function qlNowStripHtml(events, today, now, groups) {
  const { windows, current, next } = prayerNow(events, today, now);
  const prayed = windows.filter(w => w.done).length;
  const dots = windows.map(w => `<i class="${w.done ? "on" : ""}${w === current ? " cur" : ""}"></i>`).join("");
  let main;
  if (current && current.id === "isha" && current.done) {
    main = qlFajrTomorrowHtml(today, now, "Next: Fajr tomorrow");
  } else if (current) {
    const span = current.end - current.start;
    const left = durationLabel(current.end - now);
    main = `<div class="ql-pr">
        <button type="button" class="ql-tick${current.done ? " on" : ""}" style="--c:var(--deen)" data-ql="pray:${current.id}" data-key="now-tick" aria-pressed="${current.done}" aria-label="${current.name} prayed">${QL_CHECK}</button>
        <div class="ql-grow"><div class="ql-name">${current.name}</div><div class="ql-sub">Open until ${clock12(current.end)} · ${left} left</div></div>
        <button type="button" class="ql-btn${current.done ? " done" : " primary"}" style="--c:var(--deen)" data-ql="pray:${current.id}" data-key="now-btn">${current.done ? "Prayed" : "I prayed"}</button>
      </div>
      <div class="ql-pbar" role="img" aria-label="${Math.round(100 * (now - current.start) / span)}% of the ${current.name} window passed"><i style="width:${Math.round(100 * (now - current.start) / span)}%"></i></div>`;
  } else if (next) {
    main = `<div class="ql-pr"><div class="ql-grow"><div class="ql-name">Next: ${next.name}</div>
      <div class="ql-sub">Opens ${clock12(next.start)} · in ${durationLabel(next.start - now)}</div></div></div>`;
  } else {
    main = qlFajrTomorrowHtml(today, now, "Prayers done for today");
  }
  return `<div class="ql-hd"><h2>Now · ${clock12(now)}</h2><small>${prayed} of ${windows.length} prayers</small></div>${main}
    <div class="ql-dots" role="img" aria-label="${prayed} of ${windows.length} prayers done today">${dots}</div>`;
}

// One chip: act, label, branch colour and a small meta ("1/3") when it counts something.
function qlChipHtml(act, label, branch, meta, full) {
  return `<button type="button" class="ql-chip ql-q${full ? " full" : ""}" style="--c:var(--${branch})" data-ql="${act}" data-key="chip-${act}"><span class="ql-p" aria-hidden="true">+</span>${label}${meta ? ` <span class="ql-m">${meta}</span>` : ""}</button>`;
}

function qlChipsHtml(groups) {
  const find = act => groups.flatMap(g => g.items).find(i => i.act === act);
  return `<div class="ql-hd"><h2>Quick log</h2><small>one tap, or a small sheet</small></div>
    <div class="ql-qbar">
      ${qlChipHtml("spend", "Spend", "money")}
      ${qlChipHtml("workout-add", "Workout", "health", "", find("workout")?.done)}
    </div>`;
}

function qlItemHtml(item) {
  const attrs = item.later ? ' aria-disabled="true"' : "";
  return `<button type="button" class="ql-item${item.done ? " isdone" : ""}${item.later ? " later" : ""}${item.soon ? " soon" : ""}" style="--c:var(--${item.branch})" data-ql="${item.later ? "" : item.act}" data-key="item-${item.act}" aria-pressed="${item.done}"${attrs}>
    <span class="ql-ring" aria-hidden="true">${QL_CHECK}</span>
    <span class="ql-t">${item.label}${item.sub ? `<small>${item.sub}</small>` : ""}</span>
    ${item.goal ? `<span class="ql-ctr">${qlCount(item)}</span>` : ""}</button>`;
}

// Finished groups the user has opened again (ids). A finished group folds to its header so the list gets
// shorter as the day goes; a tap on the header shows its rows (to untick one), another tap folds it back.
let qlOpenGroups = new Set();

function qlGroupHtml(g, meter) {
  const finished = g.total > 0 && g.done === g.total;
  const open = !finished || qlOpenGroups.has(g.id);
  const head = finished
    ? `<button type="button" class="ql-gh ql-fold" data-ql="fold:${g.id}" data-key="fold-${g.id}" aria-expanded="${open}">
        <span>${g.name}</span><small>all ${g.total} done ${open ? "▾" : "▸"}</small></button>`
    : `<div class="ql-gh"><span>${g.name}</span><small>${g.done} of ${g.total}</small></div>`;
  return `<div class="ql-grp" style="--c:var(--${g.id})" role="group" aria-label="${g.name}, ${g.done} of ${g.total} done">
      ${head}${meter(g.done, g.total, `var(--${g.id})`)}
      ${open ? g.items.map(qlItemHtml).join("") : ""}</div>`;
}

function qlListHtml(groups) {
  const done = groups.reduce((n, g) => n + g.done, 0);
  const total = groups.reduce((n, g) => n + g.total, 0);
  const meter = (n, t, colour) => `<div class="ql-meter" role="img" aria-label="${n} of ${t} done"><i style="width:${t ? Math.round(100 * n / t) : 0}%;background:${colour}"></i></div>`;
  const body = groups.map(g => qlGroupHtml(g, meter)).join("");
  return `<div class="ql-hd"><h2>Today</h2><small>${done} of ${total} done</small></div>${meter(done, total, "var(--gold)")}${body}`;
}

function drawQuickLog(events) {
  const today = todayString();
  const now = qlNow();
  const groups = todayItems(events, today, now);
  const focused = document.activeElement?.dataset?.key;
  document.getElementById("home-date").textContent = dayLabel(today);
  document.getElementById("now-strip").innerHTML = qlNowStripHtml(events, today, now, groups);
  document.getElementById("quick-log").innerHTML = qlChipsHtml(groups);
  document.getElementById("today-list").innerHTML = qlListHtml(groups);
  if (focused) document.querySelector(`[data-key="${focused}"]`)?.focus();
}

// ---- Toast ----

function qlShowToast(message, undo) {
  showUndo(message, undo, qlRedraw);
}

function qlRedraw() {
  if (typeof redrawPage === "function") redrawPage(); else render();
}

// Save through a writer, say what happened with an Undo, redraw.
function qlDo(message, undo) {
  qlShowToast(message, undo);
  qlRedraw();
}

// ---- Sheet (a bottom sheet on phones, a dialog in the middle on desktop: css) ----

let qlCategory = MONEY.categories[0].id;

function qlOpenSheet(kind) {
  const sheet = document.getElementById("ql-sheet");
  if (kind === "spend") {
    const cats = MONEY.categories.map(c => `<button type="button" class="ql-chip${c.id === qlCategory ? " sel" : ""}" data-ql="cat:${c.id}" aria-pressed="${c.id === qlCategory}">${c.name}</button>`).join("");
    sheet.innerHTML = `<form method="dialog" class="ql-form" data-form="spend"><div class="ql-grab"></div>
      <h3>Log a spend <button type="button" class="ql-x" data-ql="close" aria-label="Close">×</button></h3>
      <label class="ql-amt"><span aria-hidden="true">$</span><input id="ql-amount" inputmode="decimal" autocomplete="off" placeholder="8.50" aria-label="Amount in dollars"></label>
      <p class="ql-err" id="ql-err" role="alert"></p>
      <div class="ql-cats" role="group" aria-label="Category">${cats}</div>
      <div class="ql-row"><button type="button" class="ql-link" data-ql="nospend">No spend today</button><button type="submit" class="ql-btn primary" style="--c:var(--money)">Save spend</button></div></form>`;
  } else {
    const last = lastStudyCourse(loadEvents());
    const courses = ACADEMICS.courses.map(c => `<button type="button" class="ql-chip${c.id === last ? " sel" : ""}" style="--c:var(--academics)" data-ql="course:${c.id}">${c.short}</button>`).join("");
    sheet.innerHTML = `<div class="ql-form"><div class="ql-grab"></div>
      <h3>Study block · ${ACADEMICS.blockMinutes} min <button type="button" class="ql-x" data-ql="close" aria-label="Close">×</button></h3>
      <div class="ql-cats" role="group" aria-label="Course">${courses}</div>
      <p class="ql-sub">Tap a course to add one block.</p></div>`;
  }
  sheet.showModal();
  sheet.querySelector("input, .ql-chip")?.focus();
}

function qlSaveSpend() {
  const input = document.getElementById("ql-amount");
  const cents = qlParseCents(input.value);
  if (cents === null) {
    document.getElementById("ql-err").textContent = "Type the amount first, like 8.50";
    input.focus();
    return;
  }
  document.getElementById("ql-sheet").close();
  const name = MONEY.categories.find(c => c.id === qlCategory).name;
  qlDo(`${name} $${(cents / 100).toFixed(2)} saved`, qlAddSpend(cents, qlCategory));
}

// ---- Taps ----

// What one tap on a checklist row does: add to a counted item until it is full, then take one back.
function qlTapItem(act, item) {
  const [kind, arg] = act.split(":");
  const verb = item.done ? "unticked" : "ticked";
  const say = (undo, text = `${item.label} ${verb}`) => qlDo(text, undo);
  if (kind === "pray") return say(qlTogglePrayer(arg));
  if (kind === "quran") return say(qlToggleQuran());
  if (kind === "adhkar") return say(qlToggleAdhkar(arg));
  if (kind === "deadline") return say(qlToggleDeadline(arg));
  if (kind === "journal") return say(qlSetJournal(!item.done));
  if (kind === "workout") return say(item.done ? qlRemoveSession() : qlAddSession(), item.done ? "Workout removed" : "Workout logged");
  if (kind === "water") return say(item.done ? qlAddWater(-1) : qlAddWater(1), `Water · ${item.done ? "glass removed" : "glass added"}`);
  if (kind === "study") return item.done ? say(qlRemoveStudy(), "Study block removed") : qlOpenSheet("study");
  if (kind === "chore") {
    return say(item.done ? qlRemoveChore(arg) : qlAddChore(arg), item.done ? `${item.label} · one removed` : `${item.label} · done`);
  }
  if (kind === "spend") return qlOpenSheet("spend");
}

function qlHandle(act) {
  if (act === "spend") return qlOpenSheet("spend");
  if (act === "close") return document.getElementById("ql-sheet").close();
  if (act.startsWith("fold:")) {
    const id = act.slice(5);
    qlOpenGroups = new Set(qlOpenGroups.has(id) ? [...qlOpenGroups].filter(g => g !== id) : [...qlOpenGroups, id]);
    return qlRedraw();
  }
  if (act === "nospend") { document.getElementById("ql-sheet").close(); return qlDo("No spend today", qlToggleNoSpend()); }
  if (act.startsWith("cat:")) {
    qlCategory = act.slice(4);
    document.querySelectorAll("#ql-sheet [data-ql^='cat:']").forEach(b => {
      const on = b.dataset.ql === act;
      b.classList.toggle("sel", on);
      b.setAttribute("aria-pressed", on);
    });
    return;
  }
  if (act.startsWith("course:")) {
    document.getElementById("ql-sheet").close();
    return qlDo("Study block added", qlAddStudy(act.slice(7)));
  }
  // The Workout chip always adds (extra sessions are bonus XP on the Health page too).
  if (act === "workout-add") return qlDo("Workout logged", qlAddSession());
  const item = todayItems(loadEvents(), todayString(), qlNow()).flatMap(g => g.items).find(i => i.act === act);
  if (item) qlTapItem(act, item);
}

function setupQuickLog() {
  document.addEventListener("click", event => {
    const el = event.target.closest("[data-ql]");
    if (el && el.dataset.ql) qlHandle(el.dataset.ql);
    else if (event.target.id === "ql-sheet") event.target.close(); // a tap on the dark backdrop
  });
  document.addEventListener("submit", event => {
    if (event.target.dataset.form === "spend") { event.preventDefault(); qlSaveSpend(); }
  });
}
