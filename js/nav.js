// Shared navigation: a sidebar on wide screens, a ☰ drawer on phones. Built from BRANCHES, on every page.
// Needs config.js, scoring.js and storage.js loaded before it (for the names, colours and levels).

// The page link a file belongs to: the Planner is opened from Academics, so it highlights Academics.
const NAV_PARENT = { "planner.html": "academics.html" };
// Pages listed indented under a branch in the nav (each gets its own row).
const NAV_CHILDREN = { academics: [{ name: "Study guides", page: "study.html" }] };

const currentFile = () => location.pathname.split("/").pop() || "index.html";

function navItems() {
  const file = currentFile();
  const here = NAV_PARENT[file] ?? file;
  const totals = xpByBranch(loadEvents());
  const overall = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  const items = [
    { name: "Home", page: "index.html", colour: "gold", icon: "home", level: levelInfo(overall, LEVELS.overallMultiplier).level },
    ...BRANCHES.flatMap(b => [
      { name: b.name, page: b.page, colour: b.id, icon: b.id, level: levelOf(totals, b.id).level },
      ...(NAV_CHILDREN[b.id] ?? []).map(child => ({ ...child, colour: b.id, sub: true })),
    ]),
    { name: "Rewards", page: "rewards.html", colour: "muted", icon: "rewards" },
    { name: "Settings", page: "settings.html", colour: "muted", icon: "settings" },
    { name: "Appearance", page: "appearance.html", colour: "muted", icon: "appearance" },
  ];
  // Each row has both a colour dot and a drawn icon; Appearance → Icons decides which one shows (styles.css).
  return items.map(item => `
    <a href="${item.page}"${item.page === here ? ' class="on" aria-current="page"' : ""}${item.sub ? ' style="padding-left: 27px; font-size: 0.875rem"' : ""}>
      <span class="nav-dot" style="background: var(--${item.colour})"></span>${item.icon ? `<span class="nav-icon" style="color: var(--${item.colour})">${iconSvg(item.icon)}</span>` : ""}${item.name}
      ${item.level ? `<span class="nav-level">${item.level}</span>` : ""}
    </a>`).join("");
}

// The branch this page belongs to ("health" on health.html, "academics" on the Planner and Study guides),
// as data-branch on <html>: Appearance → Page tint colours the page from it, and the level-up finds its badge.
function pageBranch() {
  const page = NAV_PARENT[currentFile()] ?? currentFile();
  const child = Object.entries(NAV_CHILDREN).find(([, kids]) => kids.some(k => k.page === page));
  return child?.[0] ?? BRANCHES.find(b => b.page === page)?.id;
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
  const setOpen = open => {
    document.body.classList.toggle("nav-open", open);
    button.setAttribute("aria-expanded", String(open));
  };
  button.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
  backdrop.addEventListener("click", () => setOpen(false));
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });

  document.body.classList.add("has-nav");
  document.body.prepend(nav, backdrop);
  document.querySelector(".corner")?.prepend(button);
}

setupNav();
markPageBranch();
