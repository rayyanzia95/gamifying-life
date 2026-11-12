// Home's one card: today's progress as an outer ring of coloured segments, the balance web of
// branch levels inside it, the overall level in the middle, and a row per branch underneath.
// Branch colours are --<branch> in styles.css; levels come from levelOf (scoring.js).

const HOME = { centre: 110, ringRadius: 98, ringWidth: 8, ringGapDegrees: 4, webRadius: 56, labelRadius: 69,
  minTop: 5, gridSteps: [1 / 3, 2 / 3, 1] };

const percent = share => Math.round(share * 100);

// A track circle with a coloured arc over it, `share` of the way round from the top.
function arcHtml(cx, cy, r, share, colour, width) {
  const C = 2 * Math.PI * r;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${width}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})" stroke-dasharray="${Math.max(share * C, 0.01)} ${C}"/>`;
}

// The point for branch i of n at `fraction` of `radius` from the centre; branch 0 is at the top.
function homePoint(i, n, radius, fraction = 1) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [HOME.centre + Math.cos(angle) * radius * fraction, HOME.centre + Math.sin(angle) * radius * fraction];
}

// Outer ring: one segment per branch (centred on its spoke), filled with today's share, a gap between.
function todaySegmentsHtml(branches) {
  const { centre, ringRadius: r, ringWidth, ringGapDegrees } = HOME;
  const C = 2 * Math.PI * r;
  const span = 360 / branches.length;
  const length = ((span - ringGapDegrees) / 360) * C;
  return branches.map((b, i) => {
    const turn = `rotate(${-90 + i * span - span / 2 + ringGapDegrees / 2} ${centre} ${centre})`;
    const segment = (colour, dash) => `<circle cx="${centre}" cy="${centre}" r="${r}" fill="none" stroke="${colour}"
      stroke-width="${ringWidth}" transform="${turn}" stroke-dasharray="${dash} ${C}"/>`;
    return segment("var(--line)", length) + (b.share > 0 ? segment(`var(--${b.id})`, length * b.share) : "");
  }).join("");
}

// The web of levels: grid, spokes, the gold shape, a dot per branch in its colour, and the names.
// The rim is the highest level so far (at least HOME.minTop). Labels sit between the web and the ring.
function levelWebHtml(branches) {
  const n = branches.length;
  const top = Math.max(HOME.minTop, ...branches.map(b => b.level));
  const polygon = points => points.map(p => p.join(",")).join(" ");
  const grid = HOME.gridSteps.map(f =>
    `<polygon points="${polygon(branches.map((_, i) => homePoint(i, n, HOME.webRadius, f)))}" fill="none" stroke="var(--border)"/>`).join("");
  const spokes = branches.map((_, i) => {
    const [x, y] = homePoint(i, n, HOME.webRadius);
    return `<line x1="${HOME.centre}" y1="${HOME.centre}" x2="${x}" y2="${y}" stroke="var(--border)"/>`;
  }).join("");
  const shape = `<polygon class="web-shape" points="${polygon(branches.map((b, i) => homePoint(i, n, HOME.webRadius, b.level / top)))}"/>`;
  const dots = branches.map((b, i) => {
    const [x, y] = homePoint(i, n, HOME.webRadius, b.level / top);
    return `<circle cx="${x}" cy="${y}" r="3" style="fill: var(--${b.id})"/>`;
  }).join("");
  const labels = branches.map((b, i) => {
    const [x, y] = homePoint(i, n, HOME.labelRadius);
    return `<text class="web-label" x="${x}" y="${y + 3}" text-anchor="middle">${b.name}</text>`;
  }).join("");
  return grid + spokes + shape + dots + labels;
}

// The overall level in the middle, with a gold arc for its XP to the next level.
function overallCentreHtml(overall) {
  const { centre } = HOME;
  return `<circle cx="${centre}" cy="${centre}" r="22" fill="var(--surface)"/>` +
    arcHtml(centre, centre, 19, overall.into / overall.cost, "var(--gold)", 3.5) +
    `<text class="overall-level" x="${centre}" y="${centre + 6}" text-anchor="middle">${overall.level}</text>`;
}

// One row per branch, linking to its page: name, level chip, bar to the next level, today's mini ring.
function branchRowHtml(b) {
  return `<a class="level-row" href="${b.page}">
    <span><span class="row-icon" style="color: var(--${b.id})">${iconSvg(b.id)}</span>${b.name}</span>
    <span class="level-chip" style="background: var(--${b.id})">${b.level}</span>
    <span class="level-bar"><i style="width: ${(b.into / b.cost) * 100}%; background: var(--${b.id})"></i></span>
    <svg viewBox="0 0 26 26" width="20" role="img" aria-label="${percent(b.share)}% done today">${arcHtml(13, 13, 9, b.share, `var(--${b.id})`, 4)}</svg>
  </a>`;
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }], share = today 0..1.
function homeCardHtml(overall, branches) {
  const label = `Overall level ${overall.level}. ` +
    branches.map(b => `${b.name} level ${b.level}, ${percent(b.share)}% today`).join(". ");
  return `<svg class="home-hub" viewBox="0 0 220 220" role="img" aria-label="${label}">
      ${todaySegmentsHtml(branches)}${levelWebHtml(branches)}${overallCentreHtml(overall)}
    </svg>
    <div class="hub-key"><span class="key-today">today</span><span class="key-level">level progress</span></div>
    <div class="level-rows">${branches.map(branchRowHtml).join("")}</div>`;
}
