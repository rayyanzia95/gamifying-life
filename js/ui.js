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

// The outer and inner ring radii. Rings are spread evenly between them (mockup: r = 44 - i*6 for 7).
const RING_OUTER = 44;
const RING_INNER = 8;
const RING_MAX_SPACING = 11;

// Rows are { id, name, share } where share is 0..1 and id picks the branch colour.
// One ring per branch, one colour each, with a legend of dot, name and percent.
function ringsHtml(rows) {
  const spacing = Math.min(RING_MAX_SPACING, (RING_OUTER - RING_INNER) / Math.max(rows.length - 1, 1));
  const circles = rows.map((row, i) => {
    const r = RING_OUTER - i * spacing;
    const C = 2 * Math.PI * r;
    return `
      <circle class="ring-branch-track" cx="50" cy="50" r="${r}"/>
      <circle class="ring-branch" cx="50" cy="50" r="${r}" style="stroke: var(--${row.id})"
        transform="rotate(-90 50 50)" stroke-dasharray="${row.share * C} ${C}"/>`;
  }).join("");

  const legend = rows.map(row => `
    <div class="legend-row">
      <span class="legend-name"><span class="legend-dot" style="background: var(--${row.id})"></span>${row.name}</span>
      <span>${Math.round(row.share * 100)}%</span>
    </div>`).join("");

  return `
    <svg class="rings" viewBox="0 0 100 100" role="img" aria-label="Today's progress">${circles}</svg>
    <div class="legend">${legend}</div>`;
}
