// Renders personal.html: the Personal level beside the current book and this week's
// counts, the bar (journal + reading today, time alone + friends this week), Today,
// This week, Books, and the quiet session tick at the bottom.
// The event shapes are listed in scoring.js under "Personal".

const MAX_PAGES = 5000; // anything bigger is a typo

function heading(text, sub = "") {
  const h2 = document.createElement("h2");
  h2.textContent = text;
  if (sub) h2.append(sub);
  return h2;
}

function mutedLine(text) {
  return Object.assign(document.createElement("p"), { className: "muted money-hint", textContent: text });
}

function addEvent(event) {
  saveEvents([...loadEvents(), event]);
  render();
}

// "Book one · p. 142 / 320"
function pageLabel(book, page) {
  return page >= book.pages ? `Finished · ${book.pages} pages` : `p. ${page} / ${book.pages}`;
}

// The page a book is on now (today's event included).
function currentPage(events, bookId) {
  return pageBefore(events, bookId, shiftDate(todayString(), 1));
}

function isFinished(events, book) {
  return currentPage(events, book.id) >= book.pages;
}

// The book to show at the top: the last one read that isn't finished, else the
// newest unfinished one. findLast searches from the end of the array.
function currentBook(events) {
  const open = books(events).filter(b => !isFinished(events, b));
  const lastRead = events.findLast(e => isRead(e) && open.some(b => b.id === e.book));
  return open.find(b => b.id === lastRead?.book) ?? open.at(-1) ?? null;
}

// ---- Today: journal and reading ----

function toggleJournal(checked) {
  const today = todayString();
  const events = loadEvents().filter(e => !(e.activity === "journal" && e.date === today));
  saveEvents(checked ? [...events, { date: today, activity: "journal" }] : events);
  render();
}

// Replaces today's page for this book. Typing the page it was on before today
// removes today's entry instead (0 pages read).
function savePage(book, page) {
  const today = todayString();
  const events = loadEvents();
  const rest = events.filter(e => !(isRead(e) && e.book === book.id && e.date === today));
  const changed = page !== pageBefore(events, book.id, today);
  saveEvents(changed ? [...rest, { date: today, activity: "read", book: book.id, page }] : rest);
  render();
}

// Pages read on each day, as a Map of date → pages.
function pagesByDay(events) {
  return events.filter(isRead).reduce((days, e) =>
    new Map(days).set(e.date, (days.get(e.date) ?? 0) + pagesRead(e, events)), new Map());
}

function pageForm(book, page) {
  const form = Object.assign(document.createElement("form"), { className: "money-form" });
  const input = Object.assign(document.createElement("input"), {
    className: "money-input", inputMode: "numeric", placeholder: "Page you're on", value: page || "",
  });
  input.setAttribute("aria-label", `Page you're on in ${book.title}`);
  const save = Object.assign(document.createElement("button"), { className: "filter-button", textContent: "Save" });
  const error = Object.assign(document.createElement("p"), { className: "money-error", hidden: true });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = Number(input.value.trim());
    if (!Number.isInteger(value) || value < 0 || value > book.pages) {
      error.textContent = `Type a page from 0 to ${book.pages}`;
      error.hidden = false;
      return;
    }
    savePage(book, value);
  });
  form.append(input, save, error);
  return form;
}

function readingRow(events, book, today) {
  const page = currentPage(events, book.id);
  const todayEvent = events.find(e => isRead(e) && e.book === book.id && e.date === today);
  const read = todayEvent ? pagesRead(todayEvent, events) : 0;
  const row = document.createElement("li");
  const top = document.createElement("div");
  top.className = "money-row";
  const title = Object.assign(document.createElement("b"), { className: "book-title", textContent: book.title });
  const where = Object.assign(document.createElement("span"), {
    className: "muted", textContent: pageLabel(book, page) + (read ? ` · +${read} today` : ""),
  });
  top.append(title, where);
  row.append(top, pageForm(book, page));
  return row;
}

function drawToday(events) {
  const today = todayString();
  const journalDays = new Set(events.filter(e => e.activity === "journal").map(e => e.date));
  const journal = makeCheckbox("Journalled today", journalDays.has(today), e => toggleJournal(e.target.checked));
  journal.append(" ", streakBadge(dayStreak(journalDays)));

  const byDay = pagesByDay(events);
  const readDays = new Set([...byDay].filter(([, pages]) => pages >= PERSONAL.reading.dayPages).map(([d]) => d));
  // A book finished today stays here until tomorrow, so a typo in the last page can be fixed.
  const readToday = book => events.some(e => isRead(e) && e.book === book.id && e.date === today);
  const open = books(events).filter(b => !isFinished(events, b) || readToday(b));
  const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
  list.append(...open.map(book => readingRow(events, book, today)));
  const pagesToday = byDay.get(today) ?? 0;
  const readingHead = document.createElement("h3");
  readingHead.className = "personal-sub";
  readingHead.append(`Reading · ${pagesToday} / ${PERSONAL.reading.dayPages} pages today `,
    streakBadge(dayStreak(readDays)));

  document.getElementById("today").replaceChildren(
    heading("Today"), journal, readingHead,
    open.length ? list : mutedLine("No book on the go. Add one under Books."),
  );
}

// ---- This week: time alone and friends ----

// Undo this week's latest one of this activity.
function removeLatest(activity) {
  const events = loadEvents();
  const week = weekStart(todayString());
  const last = events.findLast(e => e.activity === activity && e.date >= week);
  if (!last) return;
  saveEvents(events.filter(e => e !== last));
  render();
}

// "2 to go · 4 days left", "1 to go · last day", or "Target met · +1 bonus".
function weekHint(count, perWeek, today) {
  const left = perWeek - count;
  if (left <= 0) return left < 0 ? `Target met · +${-left} bonus` : "Target met for the week";
  const daysLeft = 7 - daysBetween(weekStart(today), today);
  return `${left} to go · ${daysLeft === 1 ? "last day" : daysLeft + " days left"}`;
}

function weeklyCounter(label, activity, count, rule, today) {
  const onStep = delta => (delta > 0 ? addEvent({ date: today, activity }) : removeLatest(activity));
  const stepper = makeStepper(label, count, Infinity, onStep, { step: 1, target: rule.perWeek, unit: label });
  const block = document.createElement("div");
  block.className = "personal-counter";
  block.append(stepper, mutedLine(weekHint(count, rule.perWeek, today)));
  return block;
}

function drawWeek(parts) {
  const today = todayString();
  document.getElementById("week").replaceChildren(
    heading("This week"),
    weeklyCounter("time alone, no screens", "alone", parts.week.alone, PERSONAL.alone, today),
    weeklyCounter("with friends", "friends", parts.week.friends, PERSONAL.friends, today),
  );
}

// ---- Books: add one, see the finished shelf ----

function addBook(title, pages) {
  addEvent({ date: todayString(), activity: "book", id: "b" + Date.now(), title, pages });
}

// Only a book with no pages logged can be removed, so no reading XP is lost.
function removeBook(book) {
  saveEvents(loadEvents().filter(e => !(e.activity === "book" && e.id === book.id)));
  render();
}

function bookForm() {
  const form = Object.assign(document.createElement("form"), { className: "money-form" });
  const title = Object.assign(document.createElement("input"), {
    className: "money-input", placeholder: "Title", maxLength: 80,
  });
  const pages = Object.assign(document.createElement("input"), {
    className: "money-input book-pages", inputMode: "numeric", placeholder: "Pages",
  });
  title.setAttribute("aria-label", "Book title");
  pages.setAttribute("aria-label", "Number of pages");
  const add = Object.assign(document.createElement("button"), { className: "filter-button", textContent: "Add book" });
  const error = Object.assign(document.createElement("p"), { className: "money-error", hidden: true });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = title.value.trim();
    const count = Number(pages.value.trim());
    const problem = !name ? "Give it a title"
      : !Number.isInteger(count) || count < 1 || count > MAX_PAGES ? "Type the number of pages, like 320" : "";
    if (problem) {
      error.textContent = problem;
      error.hidden = false;
      return;
    }
    addBook(name, count);
  });
  form.append(title, pages, add, error);
  return form;
}

function bookRow(events, book) {
  const row = document.createElement("li");
  row.className = "money-row";
  const page = currentPage(events, book.id);
  const text = document.createElement("span");
  text.append(Object.assign(document.createElement("b"), { className: "book-title", textContent: book.title }),
    " ", Object.assign(document.createElement("span"), { className: "muted", textContent: pageLabel(book, page) }));
  row.append(text);
  if (page === 0 && !events.some(e => isRead(e) && e.book === book.id)) {
    const remove = Object.assign(document.createElement("button"), {
      className: "money-remove", type: "button", textContent: "×",
    });
    remove.setAttribute("aria-label", "Remove " + book.title);
    remove.addEventListener("click", () => removeBook(book));
    row.append(remove);
  }
  return row;
}

function drawBooks(events) {
  const list = Object.assign(document.createElement("ul"), { className: "plain-list" });
  const all = books(events);
  list.append(...all.map(book => bookRow(events, book)));
  const finished = all.filter(b => isFinished(events, b)).length;
  document.getElementById("books").replaceChildren(
    heading("Books"),
    all.length ? list : mutedLine("Your reading list lives on this device only."),
    finished ? mutedLine(`${finished} finished · +${PERSONAL.reading.finishXp} XP each`) : "",
    bookForm(),
  );
}

// ---- Quiet session tick ----

function toggleSession(checked) {
  const week = weekStart(todayString());
  const events = loadEvents().filter(e => !(e.activity === "session" && e.date >= week));
  saveEvents(checked ? [...events, { date: todayString(), activity: "session" }] : events);
  render();
}

function drawQuiet(events) {
  const week = weekStart(todayString());
  const done = events.some(e => e.activity === "session" && e.date >= week);
  document.getElementById("quiet").replaceChildren(
    makeCheckbox("Session this week", done, e => toggleSession(e.target.checked)));
}

// ---- Top card: current book + this week's counts ----

function drawTop(events, parts, today) {
  const book = currentBook(events);
  const top = document.getElementById("personal-top");
  const week = weekStart(today);
  const journalled = new Set(events.filter(e => e.activity === "journal" && e.date >= week).map(e => e.date)).size;
  const daysSoFar = daysBetween(week, today) + 1;
  const counts = document.createElement("div");
  counts.className = "personal-counts";
  counts.innerHTML = [
    ["Journal", journalled, daysSoFar],
    ["Alone", parts.week.alone, PERSONAL.alone.perWeek],
    ["Friends", parts.week.friends, PERSONAL.friends.perWeek],
  ].map(([name, n, of]) => `<span>${name} <b>${n}/${of}</b></span>`).join("");

  const finished = books(events).filter(b => isFinished(events, b)).length;
  if (!book) {
    top.replaceChildren(mutedLine(`No book on the go · ${finished} finished`), counts);
    return;
  }
  const page = currentPage(events, book.id);
  const title = Object.assign(document.createElement("div"), { className: "personal-book", textContent: book.title });
  const bar = document.createElement("div");
  bar.className = "personal-book-bar";
  bar.innerHTML = `<span style="width: ${(page / book.pages) * 100}%"></span>`;
  top.replaceChildren(title, bar, mutedLine(`p. ${page} / ${book.pages} · ${finished} finished`), counts);
}

function render() {
  const events = loadEvents();
  const today = todayString();
  const xp = xpByBranch(events)[PERSONAL.branch] || 0;
  document.getElementById("levels").innerHTML = badgeHtml("Personal", levelInfo(xp, 1));

  // The bar matches the Home ring: plum for today, teal for this week.
  const parts = personalParts(events, today);
  const barParts = [{ ...parts.today, colour: "plum" }, { ...parts.week, colour: "teal" }];
  const sum = key => barParts.reduce((total, part) => total + part[key], 0);
  document.getElementById("bar-parts").innerHTML = barPartsHtml(barParts);
  document.getElementById("progress-label").textContent =
    `${sum("core") + sum("extra")} / ${sum("goal")} XP · journal and reading today + this week`;

  drawTop(events, parts, today);
  drawToday(events);
  drawWeek(parts);
  drawBooks(events);
  drawQuiet(events);
}

render();
