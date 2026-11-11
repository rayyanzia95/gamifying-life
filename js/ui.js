function badgeHtml(name, info) {
  const C = 2 * Math.PI * 40;
  const filled = (info.into / info.cost) * C;
  return `
    <div class="badge">
      <svg viewBox="0 0 100 100" role="img" aria-label="${name} level ${info.level}">
        <circle class="ring-track" cx="50" cy="50" r="40"/>
        <circle class="ring-fill" cx="50" cy="50" r="40"
          transform="rotate(-90 50 50)" stroke-dasharray="${filled} ${C}"/>
        <text class="badge-level" x="50" y="60" text-anchor="middle">${info.level}</text>
      </svg>
      <div class="badge-name">${name}</div>
      <div class="badge-xp">${info.into} / ${info.cost} XP</div>
    </div>`;
}

function ringsHtml(rows) {
  const circles = rows.map((row, i) => {
    const r = 40 - i * 11;
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
      <span>${row.core + row.extra} / ${row.goal} XP</span>
    </div>`).join("");

  return `
    <svg class="rings" viewBox="0 0 100 100" role="img" aria-label="Today's progress">${circles}</svg>
    <div class="legend">${legend}</div>`;
}
// Shared form controls, used by the Deen page and (soon) the Chores page.

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
// with just four arguments.
function makeStepper(text, current, max, onStep, { step = 2, target = max, unit = "rakah" } = {}) {
  const row = document.createElement("div");
  row.className = "stepper";

  const minus = document.createElement("button");
  minus.textContent = "−";
  minus.setAttribute("aria-label", "Less " + unit);
  minus.disabled = current <= 0;
  minus.addEventListener("click", () => onStep(-step));

  const value = document.createElement("span");
  value.className = "stepper-value";
  value.textContent = current + " / " + target;

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.setAttribute("aria-label", "More " + unit);
  plus.disabled = current >= max;
  plus.addEventListener("click", () => onStep(step));

  row.append(minus, value, plus, " ", text);
  return row;
}
