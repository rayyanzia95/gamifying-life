// The quest wheel on the Chores page: one slice for each time a quest needs doing
// this week (dishes gets 3), clockwise from the top in CHORES order.
// Solid green = done this week. Dashed green = last week's tick still covers it
// (every-two-weeks chores). Faint track = still to do. The centre counts what's left.

// Same drawing size, ring radius and label distance as the Deen dial (DIAL in dial.js),
// so the two rings look alike on screen.
const CHORE_WHEEL = {
  size: 300,
  radius: 80,
  labelRadius: 93,
  gap: 0.05,         // radians between slices
};

// A point on a circle round the centre; turn 0 is the top, 0.5 the bottom, going clockwise.
function wheelPoint(radius, turn) {
  const angle = turn * 2 * Math.PI;
  const centre = CHORE_WHEEL.size / 2;
  return [centre + radius * Math.sin(angle), centre - radius * Math.cos(angle)].map(n => n.toFixed(1));
}

function wheelArc(radius, from, to) {
  const [x1, y1] = wheelPoint(radius, from);
  const [x2, y2] = wheelPoint(radius, to);
  const largeArc = to - from > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// One entry per slice: { chore, index, state: "covered" | "done" | "todo" }.
function wheelSlices(events, week) {
  return CHORES.list.flatMap(chore => {
    const covered = choreTarget(chore) - choreDueThisWeek(events, chore, week);
    const done = choreCount(events, chore.id, week, shiftDate(week, 7));
    return Array.from({ length: choreTarget(chore) }, (_, index) => {
      const state = index < covered ? "covered" : index < covered + done ? "done" : "todo";
      return { chore, index, state };
    });
  });
}

// "dishes:1" for the second dishes slice. Used to animate only newly done slices.
function sliceKey(slice) {
  return slice.chore.id + ":" + slice.index;
}

function sliceHtml(slice, position, count, isNew) {
  const gap = CHORE_WHEEL.gap / (2 * Math.PI);
  const from = position / count + gap / 2;
  const to = (position + 1) / count - gap / 2;
  const fresh = isNew ? " fresh" : "";
  return `<path class="wheel-slice ${slice.state}${fresh}" d="${wheelArc(CHORE_WHEEL.radius, from, to)}"/>`;
}

// The quest's name just outside its slices, anchored to grow away from the ring
// (same rule as prayerLabel on the dial): names on the right start at the point,
// names on the left end there, names near the top or bottom sit above or below it.
function wheelLabel(events, chore, firstPosition, count, week) {
  const middle = (firstPosition + choreTarget(chore) / 2) / count;
  const angle = middle * 2 * Math.PI;
  const [dx, dy] = [Math.sin(angle), -Math.cos(angle)];
  const SIDE = 0.35; // how far off vertical/horizontal before a name counts as on a side
  const anchor = dx > SIDE ? "start" : dx < -SIDE ? "end" : "middle";
  const baseline = dy > SIDE ? "hanging" : dy < -SIDE ? "auto" : "middle";
  const [x, y] = wheelPoint(CHORE_WHEEL.labelRadius, middle);
  const isDone = choreLeftThisWeek(events, chore, week) === 0;
  return `<text class="wheel-label${isDone ? " done" : ""}" x="${x}" y="${y}"
    text-anchor="${anchor}" dominant-baseline="${baseline}">${chore.short ?? chore.name}</text>`;
}

// Centre, in the dial's style: a heading and a line under it.
function wheelCentre(left, daysLeft) {
  const centre = CHORE_WHEEL.size / 2;
  const heading = left === 0 ? "All done" : `${left} left`;
  const subline = left === 0 ? `+${CHORES.weekBonus} bonus`
    : daysLeft === 1 ? "last day" : `${daysLeft} days to go`;
  return `<text class="wheel-heading${left === 0 ? " done" : ""}" x="${centre}" y="${centre - 4}">${heading}</text>
    <text class="wheel-sub" x="${centre}" y="${centre + 14}">${subline}</text>`;
}

// before: the set of slice keys that were done at the last draw (null on the first draw),
// so only slices done since then animate in.
function choreWheelHtml(events, today, before) {
  const week = weekStart(today);
  const slices = wheelSlices(events, week);
  const count = slices.length;

  const arcs = slices.map((slice, position) => {
    const isNew = before !== null && slice.state === "done" && !before.has(sliceKey(slice));
    return sliceHtml(slice, position, count, isNew);
  }).join("");

  const labels = slices
    .map((slice, position) => (slice.index === 0 ? wheelLabel(events, slice.chore, position, count, week) : ""))
    .join("");

  const left = CHORES.list.reduce((sum, chore) => sum + choreLeftThisWeek(events, chore, week), 0);
  const daysLeft = 7 - daysBetween(week, today);

  return `<svg class="chore-wheel" viewBox="0 0 ${CHORE_WHEEL.size} ${CHORE_WHEEL.size}" role="img"
      aria-label="${left} chores left this week">
    ${arcs}${labels}${wheelCentre(left, daysLeft)}
  </svg>`;
}

// The keys of this week's done slices, to pass back in as `before` next time.
function doneSliceKeys(events, today) {
  const done = wheelSlices(events, weekStart(today)).filter(slice => slice.state === "done");
  return new Set(done.map(sliceKey));
}
