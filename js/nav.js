// Shared navigation: a sidebar on wide screens; on phones a bottom tab bar whose More opens the same list as a
// drawer. Built from BRANCHES, on every page.
// Needs config.js, scoring.js and storage.js loaded before it (for the names, colours and levels).

// Pages with no row of their own highlight the row they are reached from: Study guides from Academics,
// Rewards from Home (under the overall level), Appearance from Settings (it is one of its tabs).
const NAV_PARENT = { "study.html": "academics.html", "rewards.html": "index.html", "appearance.html": "settings.html" };
// Pages that belong to a branch without being its page (Page tint and the level-up badge use the branch).
const NAV_BRANCH = { "planner.html": "academics", "study.html": "academics" };
// The phone's bottom bar: the four places opened many times a day, then More (the full list as a drawer).
const NAV_TABS = [
  { name: "Home", page: "index.html", icon: "home", colour: "gold" },
  { name: "Deen", page: "deen.html", icon: "deen", colour: "deen" },
  { name: "Planner", page: "planner.html", icon: "planner", colour: "academics" },
  { name: "Money", page: "money.html", icon: "money", colour: "money" },
];

const currentFile = () => location.pathname.split("/").pop() || "index.html";

function navItems() {
  const file = currentFile();
  const here = NAV_PARENT[file] ?? file;
  const totals = xpByBranch(loadEvents());
  const overall = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  const levels = Object.fromEntries(BRANCHES.map(b => [b.id, levelOf(totals, b.id).level]));
  // A column of identical 1s says nothing, so levels show only once some branch has moved off level 1.
  const showLevels = Object.values(levels).some(level => level > 1);
  const items = [
    { name: "Home", page: "index.html", colour: "gold", icon: "home", level: levelInfo(overall, LEVELS.overallMultiplier).level },
    { name: "Planner", page: "planner.html", colour: "academics", icon: "planner" },
    ...BRANCHES.map(b => ({ name: b.name, page: b.page, colour: b.id, icon: b.id, level: levels[b.id] })),
    { name: "Settings", page: "settings.html", colour: "muted", icon: "settings" },
    // Reached from another page on a wide screen, so these three rows show in the phone drawer only.
    { name: "Study guides", page: "study.html", colour: "academics", icon: "academics", extra: true },
    { name: "Rewards", page: "rewards.html", colour: "muted", icon: "rewards", extra: true },
    { name: "Appearance", page: "appearance.html", colour: "muted", icon: "appearance", extra: true },
  ];
  // Each row has both a colour dot and a drawn icon; Appearance → Icons decides which one shows (styles.css).
  return items.map(item => `
    <a href="${item.page}" class="${item.extra ? "nav-extra" : ""}${item.page === (item.extra ? file : here) ? " on" : ""}"${item.page === (item.extra ? file : here) ? ' aria-current="page"' : ""}>
      <span class="nav-dot" style="background: var(--${item.colour})"></span>${item.icon ? `<span class="nav-icon" style="color: var(--${item.colour})">${iconSvg(item.icon)}</span>` : ""}${item.name}
      ${item.level && showLevels ? `<span class="nav-level">${item.level}</span>` : ""}
    </a>`).join("");
}

// The bottom bar's tabs. A page that isn't one of the four lights More.
function tabItems() {
  const here = NAV_PARENT[currentFile()] ?? currentFile();
  const onTab = NAV_TABS.some(tab => tab.page === here);
  const tabs = NAV_TABS.map(tab => `
    <a href="${tab.page}"${tab.page === here ? ' class="on" aria-current="page"' : ""} style="--tab: var(--${tab.colour})">
      ${iconSvg(tab.icon)}<span>${tab.name}</span>
    </a>`).join("");
  return `${tabs}
    <button type="button" id="tab-more" aria-expanded="false" aria-controls="side-nav"${onTab ? "" : ' class="on"'}>${iconSvg("more")}<span>More</span></button>`;
}

// The branch this page belongs to ("health" on health.html, "academics" on the Planner and Study guides),
// as data-branch on <html>: Appearance → Page tint colours the page from it, and the level-up finds its badge.
function pageBranch() {
  return NAV_BRANCH[currentFile()] ?? BRANCHES.find(b => b.page === currentFile())?.id;
}

// A branch's own page also gets its icon in the title (shown only when Icons is Outline or Filled).
function markPageBranch() {
  const branch = pageBranch();
  if (!branch) return;
  document.documentElement.dataset.branch = branch;
  const isBranchPage = BRANCHES.some(b => b.page === currentFile());
  if (isBranchPage) {
    document.querySelector("h1")?.insertAdjacentHTML("afterbegin",
      `<span class="title-icon" style="color: var(--${branch})">${iconSvg(branch)}</span>`);
  }
}

function setupNav() {
  const nav = Object.assign(document.createElement("nav"), { id: "side-nav", ariaLabel: "Pages", innerHTML: navItems() });
  const backdrop = Object.assign(document.createElement("div"), { id: "nav-backdrop" });
  const button = Object.assign(document.createElement("button"), {
    type: "button", className: "icon-button nav-toggle", textContent: "☰", ariaLabel: "Menu",
  });
  // Phones get a bottom tab bar; its More button opens the same drawer the ☰ button does.
  const tabs = Object.assign(document.createElement("nav"), { id: "tab-bar", ariaLabel: "Main pages", innerHTML: tabItems() });
  const more = tabs.querySelector("#tab-more");
  const setOpen = open => {
    document.body.classList.toggle("nav-open", open);
    button.setAttribute("aria-expanded", String(open));
    more.setAttribute("aria-expanded", String(open));
  };
  more.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
  button.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
  backdrop.addEventListener("click", () => setOpen(false));
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });

  document.body.classList.add("has-nav");
  document.body.prepend(nav, backdrop);
  document.body.append(tabs);
  document.querySelector(".corner")?.prepend(button);
}

setupNav();
markPageBranch();
