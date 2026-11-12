// Home's level section: a balance web (radar) of branch levels and a level bar per branch.
// Both read levelOf (scoring.js) and the branch colours (--<branch> in styles.css).

const WEB = { centre: 80, radius: 52, labelRadius: 1.22, minTop: 5, rings: [1 / 3, 2 / 3, 1] };

// The point for branch number i of n at `fraction` of the way out (0 = centre, 1 = rim); first branch at the top.
function webPoint(i, n, fraction) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [WEB.centre + Math.cos(angle) * WEB.radius * fraction, WEB.centre + Math.sin(angle) * WEB.radius * fraction];
}

// levels: [{ id, name, level }]. The rim is the highest level so far (at least WEB.minTop), so the web never overflows.
function balanceWebHtml(levels) {
  const n = levels.length;
  const top = Math.max(WEB.minTop, ...levels.map(b => b.level));
  const polygon = fraction => levels.map((_, i) => webPoint(i, n, fraction).join(",")).join(" ");
  const grid = WEB.rings.map(f => `<polygon class="web-grid" points="${polygon(f)}"/>`).join("");
  const shape = `<polygon class="web-shape" points="${levels.map((b, i) => webPoint(i, n, b.level / top).join(",")).join(" ")}"/>`;
  const dots = levels.map((b, i) => {
    const [x, y] = webPoint(i, n, b.level / top);
    return `<circle cx="${x}" cy="${y}" r="3.5" style="fill: var(--${b.id})"/>`;
  }).join("");
  const labels = levels.map((b, i) => {
    const [x, y] = webPoint(i, n, WEB.labelRadius);
    return `<text class="web-label" x="${x}" y="${y + 3}" text-anchor="middle">${b.name} ${b.level}</text>`;
  }).join("");
  return `<svg class="web" viewBox="0 0 160 160" role="img"
    aria-label="Branch levels: ${levels.map(b => `${b.name} ${b.level}`).join(", ")}">${grid}${shape}${dots}${labels}</svg>`;
}

// One row per branch: name, level chip in its colour, bar to the next level.
function levelBarsHtml(levels) {
  return levels.map(b => `
    <div class="level-row">
      <span>${b.name}</span>
      <span class="level-chip" style="background: var(--${b.id})">${b.level}</span>
      <div class="level-bar"><i style="width: ${(b.into / b.cost) * 100}%; background: var(--${b.id})"></i></div>
    </div>`).join("");
}
