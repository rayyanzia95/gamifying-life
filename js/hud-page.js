// Cockpit HUD layout (Appearance → Layout), branch pages: marks the body so css/layout-hud.css can lay the
// page out as a cockpit, and adds a status strip under the title: branch, level, XP to the next level,
// XP today and the time. Loads right after nav.js (which sets data-branch); does nothing in other layouts.

const HUD_STRIP_CELLS = 20; // segments in the strip's level bar

function hudStripHtml(branch) {
  const events = loadEvents();
  const { level, into, cost } = levelOf(xpByBranch(events), branch.id);
  const { core, extra } = todayXp(events, branch.id);
  const lit = Math.floor((into / cost) * HUD_STRIP_CELLS);
  const cells = Array.from({ length: HUD_STRIP_CELLS }, (_, k) => `<i${k < lit ? ' class="on"' : ""}></i>`).join("");
  const now = new Date();
  const time = minutesToHhmm(now.getHours() * 60 + now.getMinutes());
  return `<div class="hud-panel hud-strip" style="--c: var(--${branch.id})">
    <span class="hud-strip-name">${branch.name} · LV <b>${level}</b></span>
    <span class="hud-strip-bar" role="img" aria-label="${Math.round((into / cost) * 100)}% to level ${level + 1}">${cells}</span>
    <span>${into}/${cost} XP</span><span>TODAY <b>+${core + extra}</b></span><span>${time}</span>
  </div>`;
}

function setupHudPage() {
  if (document.documentElement.dataset.layout !== "hud") return;
  const branch = BRANCHES.find(b => b.page === currentFile()); // nav.js
  if (!branch) return;
  document.body.classList.add("hud-branch");
  document.querySelector("h1")?.insertAdjacentHTML("afterend", hudStripHtml(branch));
}

setupHudPage();
