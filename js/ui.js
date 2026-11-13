// True on the day this badge's level was reached ("Overall" is the overall level).
function reachedLevelToday(name) {
  const branch = BRANCHES.find(b => b.name === name)?.id ?? null;
  return levelUpsToday(loadEvents()).some(up => up.branch === branch);
}

// On the day a level is reached the badge gets a thin gold outer ring and "Level N · today".
function badgeHtml(name, info) {
  const C = 2 * Math.PI * 40;
  const filled = (info.into / info.cost) * C;
  const isNew = reachedLevelToday(name);
  return `
    <div class="badge">
      <svg viewBox="0 0 100 100" role="img" aria-label="${name} level ${info.level}${isNew ? ", reached today" : ""}">
        ${isNew ? '<circle class="ring-gold" cx="50" cy="50" r="47"/>' : ""}
        <circle class="ring-track" cx="50" cy="50" r="40"/>
        <circle class="ring-fill" cx="50" cy="50" r="40"
          transform="rotate(-90 50 50)" stroke-dasharray="${filled} ${C}"/>
        <text class="badge-level" x="50" y="60" text-anchor="middle">${info.level}</text>
      </svg>
      <div class="badge-name">${name}</div>
      <div class="badge-xp">${isNew ? `Level ${info.level} · today` : `${info.into} / ${info.cost} XP`}</div>
    </div>`;
}

// Shared controls, used by the Deen, Chores and Health pages.

function makeCheckbox(text, checked, onChange) {
  const label = document.createElement("label");
  label.className = "tick"; // Settings → Ticks restyles these (styles.css)
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = checked;
  box.addEventListener("change", onChange);
  label.append(box, " ", text);
  return label;
}

// The options object has defaults, so the rakah stepper can keep calling it
// with just four arguments. format turns the numbers into the label in the middle.
function makeStepper(text, current, max, onStep, {
  step = 2, target = max, unit = "rakah", format = (n, of) => n + " / " + of,
} = {}) {
  const row = document.createElement("div");
  row.className = "stepper";

  const minus = document.createElement("button");
  minus.textContent = "−";
  minus.setAttribute("aria-label", "Less " + unit);
  minus.disabled = current <= 0;
  minus.addEventListener("click", () => onStep(-step));

  const value = document.createElement("span");
  value.className = "stepper-value";
  value.textContent = format(current, target);

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.setAttribute("aria-label", "More " + unit);
  plus.disabled = current >= max;
  plus.addEventListener("click", () => onStep(step));

  row.append(minus, value, plus, " ", text);
  return row;
}

// "🔥 5", dimmed while the streak is paused. A streak from restStreak (streak.js) also gets a
// small button: "Use a rest day" when one would help (and you hold one), "Undo rest day" once
// spent today. The page redraws itself with its own render().
function streakBadge({ days, paused, id, rest }) {
  const badge = document.createElement("span");
  badge.className = paused ? "streak paused" : "streak";
  badge.innerHTML = `<span class="streak-flame" aria-hidden="true">🔥</span> ${Number(days)}`; // the flame flares on page open (anims.js)
  badge.setAttribute("aria-label", `${days}-day streak${paused ? ", paused" : ""}`);
  if (!rest) return badge;

  const button = Object.assign(document.createElement("button"), {
    type: "button", className: "rest-button", textContent: rest === "used" ? "Undo rest day" : "Use a rest day",
  });
  button.addEventListener("click", event => {
    event.stopPropagation();
    toggleRest(id);
    render();
  });
  const wrap = Object.assign(document.createElement("span"), { className: "streak-wrap" });
  wrap.append(badge, " ", button);
  return wrap;
}

// Fills the page's XP bar (#bar-fill and #bonus-fill): core first, bonus after it.
function fillBar(core, extra, goal) {
  const corePercent = goal > 0 ? Math.min((core / goal) * 100, 100) : 0;
  const bonusPercent = goal > 0 ? Math.min((extra / goal) * 100, 100 - corePercent) : 0;
  document.getElementById("bar-fill").style.width = corePercent + "%";
  document.getElementById("bonus-fill").style.width = bonusPercent + "%";
}

// The bar version of ringPartsSvg (Health: sleep, diet, sessions). Each part gets a
// section of the bar sized by its goal (flex-grow), and fills in its own colour over
// a faint track of that colour. Parts are { core, extra, goal, colour }.
function barPartsHtml(parts) {
  return parts.map(part => {
    const share = part.goal > 0 ? Math.min((part.core + part.extra) / part.goal, 1) : 0;
    return `<div class="bar-part" style="flex-grow: ${part.goal}">
      <span class="bar-part-track part-${part.colour}"></span>
      <span class="bar-part-fill part-${part.colour}" style="width: ${share * 100}%"></span>
    </div>`;
  }).join("");
}
