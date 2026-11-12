// Shared navigation: a sidebar on wide screens, a ☰ drawer on phones. Built from BRANCHES, on every page.
// Needs config.js, scoring.js and storage.js loaded before it (for the names, colours and levels).

// The page link a file belongs to: the Planner is opened from Academics, so it highlights Academics.
const NAV_PARENT = { "planner.html": "academics.html" };

function navItems() {
  const file = location.pathname.split("/").pop() || "index.html";
  const here = NAV_PARENT[file] ?? file;
  const totals = xpByBranch(loadEvents());
  const overall = Object.values(totals).reduce((sum, xp) => sum + xp, 0);
  const items = [
    { name: "Home", page: "index.html", colour: "gold", level: levelInfo(overall, LEVELS.overallMultiplier).level },
    ...BRANCHES.map(b => ({ name: b.name, page: b.page, colour: b.id, level: levelOf(totals, b.id).level })),
    { name: "Rewards", page: "rewards.html", colour: "muted" },
    { name: "Settings", page: "settings.html", colour: "muted" },
  ];
  return items.map(item => `
    <a href="${item.page}"${item.page === here ? ' class="on" aria-current="page"' : ""}>
      <span class="nav-dot" style="background: var(--${item.colour})"></span>${item.name}
      ${item.level ? `<span class="nav-level">${item.level}</span>` : ""}
    </a>`).join("");
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
