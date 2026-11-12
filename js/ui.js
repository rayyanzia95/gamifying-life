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

// An arc of a Home ring: `length` long, starting `from` along the ring (from the top, clockwise).
// The dash pattern is: nothing for 0, a gap of `from`, the arc, then a gap for the rest.
function ringArc(cls, r, from, length) {
  const C = 2 * Math.PI * r;
  return `<circle class="${cls}" cx="50" cy="50" r="${r}"
    transform="rotate(-90 50 50)" stroke-dasharray="0 ${from} ${length} ${C}"/>`;
}

const RING_PART_GAP = 2; // space between the parts of a split ring

// One ring split into parts (Health: sleep today, then sessions this week).
// Each part's share of the ring is sized by its goal; it has its own colour
// and a faint track in that colour.
function ringPartsSvg(parts, r) {
  const C = 2 * Math.PI * r;
  const total = parts.reduce((sum, part) => sum + part.goal, 0);
  return parts.map((part, i) => {
    const before = parts.slice(0, i).reduce((sum, p) => sum + p.goal, 0);
    const from = (before / total) * C + RING_PART_GAP / 2;
    const room = (part.goal / total) * C - RING_PART_GAP;
    const share = part.goal > 0 ? Math.min((part.core + part.extra) / part.goal, 1) : 0;
    return ringArc(`ring-part-track part-${part.colour}`, r, from, room) +
      ringArc(`ring-part part-${part.colour}`, r, from, share * room);
  }).join("");
}

// Legend text: "40 / 115 XP", or for a split ring one coloured dot and text per part.
function legendValue(row) {
  if (row.parts) {
    return row.parts.map(part =>
      `<span class="legend-dot part-${part.colour}"></span>${part.text}`).join(" ");
  }
  return `${row.core + row.extra} / ${row.goal} XP${row.weekly ? " this week" : ""}`;
}

// The outer and inner ring radii. Rings are spread evenly between them,
// at most 11 apart, so a fourth or fifth branch still leaves a hole in the middle.
const RING_OUTER = 40;
const RING_INNER = 10;
const RING_MAX_SPACING = 11;

// Rows are { name, core, extra, goal, weekly? }, or { name, parts } for a split ring,
// where each part is { core, extra, goal, colour, text }.
function ringsHtml(rows) {
  const spacing = Math.min(RING_MAX_SPACING, (RING_OUTER - RING_INNER) / Math.max(rows.length - 1, 1));
  const circles = rows.map((row, i) => {
    const r = RING_OUTER - i * spacing;
    if (row.parts) return ringPartsSvg(row.parts, r);
    const C = 2 * Math.PI * r;
    const coreShare = row.goal > 0 ? Math.min(row.core / row.goal, 1) : 0;
    const bonusShare = row.goal > 0 ? Math.min(row.extra / row.goal, 1 - coreShare) : 0;
    return `
      <circle class="ring-track" cx="50" cy="50" r="${r}"/>
      <circle class="ring-bonus" cx="50" cy="50" r="${r}"
        transform="rotate(-90 50 50)" stroke-dasharray="${(coreShare + bonusShare) * C} ${C}"/>
      <circle class="ring-fill" cx="50" cy="50" r="${r}"
        transform="rotate(-90 50 50)" stroke-dasharray="${coreShare * C} ${C}"/>`;
  }).join("");

  const legend = rows.map(row => `
    <div class="legend-row">
      <span>${row.name}</span>
      <span>${legendValue(row)}</span>
    </div>`).join("");

  return `
    <svg class="rings" viewBox="0 0 100 100" role="img" aria-label="Today's progress">${circles}</svg>
    <div class="legend">${legend}</div>`;
}
// Shared controls, used by the Deen, Chores and Health pages.

function makeCheckbox(text, checked, onChange) {
  const label = document.createElement("label");
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
  badge.textContent = `🔥 ${days}`;
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
