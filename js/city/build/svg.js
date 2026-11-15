// City builder, part 5 of 5: the flat drawings. Each project as a few isometric boxes, for the SVG city that
// phones and reduced-motion get (js/city-svg.js), drawn with that file's own cityBoxSvg so they match its look.
// cityBuildMapSvg() is a drop-in for cityMapSvg(): the same town, plus what cityState() says is built, the roads,
// and (in build mode) a tappable plate on every open slot.
// Needs js/city-svg.js, catalogue.js and state.js loaded first. Colours: css/city-build.css (--cb-*).

const CB = {
  stone: "var(--cb-stone)", stoneD: "var(--cb-stone-d)", rock: "var(--cb-rock)", wood: "var(--cb-wood)", wall: "var(--cb-wall)",
  water: "var(--cb-water)", leaf: "var(--cb-leaf)", leafD: "var(--cb-leaf-d)", sand: "var(--cb-sand)", iron: "var(--cb-iron)", glow: "var(--city-window)",
};
const CB_SIDE = { river: ["var(--cb-river)", "var(--cb-river-2)"], mountain: ["var(--cb-mountain)", "var(--cb-mountain-2)"],
  shared: ["var(--cb-shared)", "var(--cb-shared-2)"], monument: ["var(--cb-monument)", "var(--cb-monument-2)"] };

// The parts of each project, drawn facing south on a footprint centred on 0, 0 (cell units; +b is the front).
// A part is [a, b, w, d, height, up, colour]: a box w by d standing at a, b, `height` tall, lifted `up`.
// R and A are the project's roof and accent colours; `sink` lowers a part to the water for riverside pieces.
const CITY_SVG_PARTS = {
  docks: (R, A, sink) => [
    [-1, -0.5, 2, 0.62, 1.2, 0, CB.stoneD], [-0.82, -0.44, 0.5, 0.36, 6, 1.2, CB.wall], [-0.86, -0.48, 0.58, 0.44, 2, 7.2, R],
    [0.3, -0.44, 0.5, 0.34, 3.5, 1.2, CB.wood], [0.28, -0.46, 0.54, 0.38, 1, 4.7, A],
    [-0.58, 0.12, 0.24, 0.84, 1, sink, CB.wood], [0.34, 0.12, 0.24, 0.7, 1, sink, CB.wood], [-0.6, 0.12, 1.2, 0.16, 1, sink, CB.wood],
    [-0.98, 0.5, 0.3, 0.14, 1.4, sink, CB.wood], [-0.86, 0.54, 0.04, 0.04, 5, sink + 1.4, R], [0.0, 0.62, 0.26, 0.12, 1.2, sink, CB.wood], [0.7, 0.5, 0.24, 0.12, 1.2, sink, A],
  ],
  watermill: (R, A, sink) => [
    [-0.98, -0.48, 1.96, 0.96, 0.6, 0, CB.leaf], [-0.8, -0.4, 0.9, 0.66, 3.5, 0.6, CB.stoneD], [-0.82, -0.42, 0.94, 0.7, 4, 4.1, CB.wall],
    [-0.86, -0.46, 1.02, 0.78, 3, 8.1, R], [-0.66, -0.3, 0.1, 0.1, 4, 11, CB.stoneD],
    [0.28, 0.36, 0.5, 0.1, 8, sink, CB.wood], [0.36, 0.3, 0.34, 0.22, 5.5, sink + 1.2, A], [0.5, 0.2, 0.5, 0.16, 0.8, 7, CB.wood],
    [0.5, -0.36, 0.3, 0.22, 2, 0.6, CB.wood],
  ],
  rivermarket: (R, A) => [
    [-0.48, -0.48, 0.96, 0.96, 0.6, 0, CB.stone], [-0.4, -0.38, 0.36, 0.2, 2, 0.6, CB.wood], [-0.44, -0.42, 0.44, 0.3, 0.8, 5, R],
    [0.06, -0.38, 0.34, 0.2, 2, 0.6, CB.wood], [0.02, -0.42, 0.42, 0.3, 0.8, 5, A],
    [-0.42, 0.08, 0.2, 0.32, 2, 0.6, CB.wood], [-0.46, 0.04, 0.3, 0.4, 0.8, 5, CB.wall], [0.2, 0.16, 0.14, 0.14, 1.6, 0.6, CB.wood],
  ],
  canal: (R) => [
    [-0.5, -1, 0.32, 2, 1.4, 0, CB.stone], [0.18, -1, 0.32, 2, 1.4, 0, CB.stone], [-0.18, -1, 0.36, 2, 0.5, 0, CB.water],
    [-0.5, -0.14, 1, 0.28, 1, 3, CB.stoneD], [-0.1, 0.4, 0.2, 0.34, 1.2, 0.5, CB.wood], [-0.06, 0.5, 0.12, 0.12, 1, 1.7, R],
  ],
  dam: (R, A, sink) => [
    [-1, -0.5, 2, 0.5, 0.8, sink + 6, CB.water], [-1, 0, 2, 0.4, 8, sink, CB.stone], [-1, 0.4, 2, 0.1, 4, sink, CB.stoneD],
    [0.3, 0.4, 0.3, 0.06, 7, sink, CB.water], [-0.62, 0.04, 0.36, 0.26, 3.5, sink + 8, CB.wall], [-0.66, 0, 0.44, 0.34, 1.4, sink + 11.5, R],
  ],
  terraces: (R, A) => [
    [-1, 0.16, 2, 0.34, 0.6, 0, CB.stoneD],
    [-0.98, -0.48, 0.64, 0.62, 1, 0, CB.rock], [-0.9, -0.42, 0.44, 0.36, 5, 1, CB.wall], [-0.94, -0.46, 0.52, 0.44, 2.4, 6, R],
    [-0.32, -0.48, 0.64, 0.62, 4, 0, CB.rock], [-0.24, -0.42, 0.44, 0.36, 5, 4, CB.wall], [-0.28, -0.46, 0.52, 0.44, 2.4, 9, A],
    [0.34, -0.48, 0.64, 0.62, 7, 0, CB.rock], [0.42, -0.42, 0.44, 0.36, 5, 7, CB.wall], [0.38, -0.46, 0.52, 0.44, 2.4, 12, R],
  ],
  lookout: (R, A) => [
    [-0.42, -0.42, 0.84, 0.84, 2.4, 0, CB.stone],
    [-0.26, -0.26, 0.06, 0.06, 6.5, 2.4, CB.wood], [0.2, -0.26, 0.06, 0.06, 6.5, 2.4, CB.wood], [-0.26, 0.2, 0.06, 0.06, 6.5, 2.4, CB.wood], [0.2, 0.2, 0.06, 0.06, 6.5, 2.4, CB.wood],
    [-0.34, -0.34, 0.68, 0.68, 1.6, 8.9, R], [-0.2, -0.2, 0.4, 0.4, 1.6, 10.5, R], [-0.03, -0.03, 0.06, 0.06, 4, 12.1, A], [-0.04, 0.26, 0.08, 0.16, 1, 5, CB.iron],
  ],
  garden: (R, A) => [
    [-0.98, -0.98, 1.96, 1.96, 0.6, 0, CB.leaf], [-0.12, -0.96, 0.24, 1.92, 0.15, 0.6, CB.sand], [-0.96, -0.12, 1.92, 0.24, 0.15, 0.6, CB.sand],
    [-0.98, -0.98, 1.96, 0.06, 2.2, 0.6, CB.stone], [-0.98, -0.98, 0.06, 1.96, 2.2, 0.6, CB.stone],
    [-0.76, -0.76, 0.14, 0.14, 9, 0.6, CB.leafD], [0.62, -0.76, 0.14, 0.14, 9, 0.6, CB.leafD],
    [-0.28, -0.28, 0.56, 0.56, 1.4, 0.6, CB.stoneD], [-0.2, -0.2, 0.4, 0.4, 0.3, 2, CB.water], [-0.05, -0.05, 0.1, 0.1, 4, 2, CB.stone],
    [-0.62, 0.42, 0.3, 0.3, 2, 0.6, A], [0.34, 0.42, 0.3, 0.3, 2, 0.6, R],
    [-0.76, 0.62, 0.14, 0.14, 9, 0.6, CB.leafD], [0.62, 0.62, 0.14, 0.14, 9, 0.6, CB.leafD],
    [0.92, -0.98, 0.06, 1.96, 2.2, 0.6, CB.stone], [-0.98, 0.92, 0.7, 0.06, 2.2, 0.6, CB.stone], [0.28, 0.92, 0.7, 0.06, 2.2, 0.6, CB.stone],
  ],
  quarry: (R, A) => [
    [-0.98, -0.98, 1.96, 1.96, 0.6, 0, CB.rock],
    [-0.96, -0.96, 1.6, 0.7, 4.5, 0.6, CB.rock], [-0.96, -0.96, 1.2, 0.48, 4.5, 5.1, CB.rock], [-0.96, -0.96, 0.76, 0.3, 4.5, 9.6, CB.rock],
    [0.74, -0.3, 0.08, 0.08, 14, 0.6, CB.wood], [0.14, -0.29, 0.68, 0.06, 0.8, 14, CB.wood], [0.16, -0.36, 0.2, 0.2, 2, 7, CB.stone],
    [0.4, 0.05, 0.22, 0.18, 2.4, 0.6, CB.stone], [0.64, 0.08, 0.18, 0.16, 2, 0.6, CB.stoneD], [-0.66, 0.3, 0.2, 0.16, 2.2, 0.6, CB.stone],
    [-0.7, 0.62, 1.3, 0.12, 0.3, 0.6, CB.iron], [-0.4, 0.58, 0.26, 0.2, 2, 0.9, CB.wood], [-0.86, 0.6, 0.3, 0.26, 3, 0.6, CB.wood], [-0.9, 0.56, 0.38, 0.34, 1, 3.6, R],
  ],
  square: (R, A) => [
    [-0.98, -0.98, 1.96, 1.96, 0.8, 0, CB.stone], [-0.6, -0.6, 1.2, 1.2, 0.15, 0.8, CB.stoneD],
    [-0.72, -0.7, 0.12, 0.12, 3, 0.8, CB.wood], [-0.84, -0.84, 0.36, 0.36, 5, 3.8, CB.leaf],
    [0.34, -0.8, 0.46, 0.2, 2, 0.8, CB.wood], [0.3, -0.84, 0.54, 0.3, 0.8, 5, A],
    [-0.2, -0.2, 0.4, 0.4, 2.6, 0.8, CB.stoneD], [-0.16, -0.16, 0.06, 0.06, 4, 3.4, CB.wood], [0.1, 0.1, 0.06, 0.06, 4, 3.4, CB.wood], [-0.26, -0.26, 0.52, 0.52, 1.4, 7.4, R],
    [-0.8, 0.7, 0.06, 0.06, 5.5, 0.8, CB.iron], [-0.83, 0.67, 0.12, 0.12, 1, 6.3, CB.glow], [0.74, 0.7, 0.06, 0.06, 5.5, 0.8, CB.iron], [0.71, 0.67, 0.12, 0.12, 1, 6.3, CB.glow],
    [0.6, 0.5, 0.05, 0.05, 11, 0.8, CB.iron], [0.65, 0.5, 0.2, 0.03, 2.4, 9, R],
  ],
  station: (R, A) => [
    [-0.98, -0.48, 1.96, 0.6, 2, 0, CB.stone], [-0.86, -0.42, 0.76, 0.32, 5.5, 2, CB.wall], [-0.9, -0.46, 0.84, 0.4, 2.2, 7.5, R],
    [-0.04, -0.42, 0.24, 0.24, 12, 2, CB.wall], [-0.07, -0.45, 0.3, 0.3, 2.6, 14, R], [0.03, -0.2, 0.1, 0.02, 2, 10.5, CB.glow],
    [0.3, -0.3, 0.05, 0.05, 5.5, 2, CB.iron], [0.84, -0.3, 0.05, 0.05, 5.5, 2, CB.iron], [0.24, -0.4, 0.72, 0.5, 0.8, 7.5, A],
    [-0.98, 0.24, 1.96, 0.2, 0.4, 0, CB.iron],
    [-0.5, 0.27, 0.42, 0.15, 2.6, 0.4, A], [0.0, 0.27, 0.36, 0.15, 3, 0.4, R], [0.26, 0.3, 0.07, 0.07, 1.6, 3.4, CB.iron],
  ],
  beacon: (R, A) => [
    [-0.44, -0.44, 0.88, 0.88, 3, 0, CB.rock], [-0.26, -0.26, 0.52, 0.52, 1.2, 3, CB.stoneD],
    [-0.2, -0.2, 0.4, 0.4, 7, 4.2, CB.wall], [-0.22, -0.22, 0.44, 0.44, 1.2, 11.2, R], [-0.17, -0.17, 0.34, 0.34, 6, 12.4, CB.wall],
    [-0.19, -0.19, 0.38, 0.38, 1, 18.4, R], [-0.14, -0.14, 0.28, 0.28, 4, 19.4, CB.wall],
    [-0.24, -0.24, 0.48, 0.48, 0.8, 23.4, CB.stoneD], [-0.13, -0.13, 0.26, 0.26, 3, 24.2, CB.glow], [-0.17, -0.17, 0.34, 0.34, 1.4, 27.2, R],
  ],
  statue: (R, A) => [
    [-0.38, -0.38, 0.76, 0.76, 1.4, 0, CB.stone], [-0.28, -0.28, 0.56, 0.56, 1.2, 1.4, CB.stoneD], [-0.18, -0.18, 0.36, 0.36, 5, 2.6, CB.stone],
    [-0.22, -0.22, 0.44, 0.44, 0.7, 7.6, CB.stoneD], [-0.05, -0.05, 0.1, 0.1, 1.6, 8.3, R], [-0.14, -0.14, 0.28, 0.28, 2.6, 9.9, CB.glow],
  ],
  lanterns: (R, A) => [
    [-0.44, -0.28, 0.88, 0.56, 0.6, 0, CB.stone], [-0.38, -0.08, 0.16, 0.16, 10, 0.6, CB.wall], [0.22, -0.08, 0.16, 0.16, 10, 0.6, CB.wall],
    [-0.4, -0.1, 0.8, 0.2, 1.6, 10.6, R], [-0.16, -0.06, 0.32, 0.12, 1.4, 12.2, R], [-0.04, -0.04, 0.08, 0.08, 2.4, 13.6, CB.glow],
    [-0.16, -0.04, 0.08, 0.08, 1.6, 6.6, CB.glow], [0.08, -0.04, 0.08, 0.08, 1.6, 7.4, CB.glow], [-0.04, -0.04, 0.08, 0.08, 1.6, 5.4, A],
  ],
};

// Turn a south-facing part round to the slot's facing and move it to the slot. Returns [gx, gy, w, d].
function cityPartRect(part, cx, cy, face) {
  const [a, b, w, d] = part;
  if (face === "s") return [cx + a, cy + b, w, d];
  if (face === "n") return [cx - a - w, cy - b - d, w, d];
  if (face === "e") return [cx + b, cy - a - w, d, w];
  return [cx - b - d, cy + a, d, w];
}

const cityTint = (colour, svg) => `<g style="--c: ${colour}">${svg}</g>`;

// Which way a project faces in a slot (the 2D twin of CityBuildKit.facing).
function cityFacing(project, slot) {
  const [w, d] = project.size;
  const alongX = slot.face === "n" || slot.face === "s";
  const fits = alongX ? w <= slot.w && d <= slot.h : d <= slot.w && w <= slot.h;
  return fits ? slot.face : { n: "e", s: "w", e: "s", w: "n" }[slot.face];
}

// One built project as a part for the painter's sort: { key, svg }.
function cityProjectPart(projectId, slot) {
  const project = cityProject(projectId);
  const [R, A] = CB_SIDE[project.side] ?? CB_SIDE.shared;
  const g = svg => `<g class="cb-project" data-slot="${slot.id}" data-project="${projectId}">${svg}</g>`;

  if (slot.zones.includes("crossing")) {
    const top = Math.max(...slot.ends.map(cityTopH));
    const stone = projectId === "stonebridge";
    let svg = cityTint(stone ? CB.stone : CB.wood, cityBoxSvg(slot.x + (stone ? 0.1 : 0.25), slot.y, stone ? 0.8 : 0.5, slot.h, stone ? 1.5 : 0.6, top - (stone ? 1.5 : 0.6)));
    if (stone) [0.33, 0.66].forEach(t => { svg = cityTint(CB.stoneD, cityBoxSvg(slot.x + 0.3, slot.y + slot.h * t - 0.1, 0.4, 0.2, top - 2, 1)) + svg; });
    else [0.02, slot.h - 0.1].forEach(t => [0.2, 0.72].forEach(a => { svg += cityTint(CB.wood, cityBoxSvg(slot.x + a, slot.y + t, 0.08, 0.08, 3, top)); }));
    return { key: slot.x + slot.y + slot.h + 0.6, svg: g(svg) };
  }

  if (slot.zones.includes("cliff")) {
    const st = { x: slot.x + 0.5, y: slot.y + 0.5, dir: slot.face, low: slot.low, high: slot.high };
    const rise = cityTopH(slot.high) - cityTopH(slot.low);
    let svg = projectId === "rockstairs" ? cityStairsSvg(st) : cityTint(CB.rock, cityStairsSvg(st).replaceAll("city-step", ""));
    const [dx, dy] = CITY_DIRS[slot.face];
    if (projectId === "funicular") {
      svg += cityTint(R, cityBoxSvg(st.x - 0.18 + dx * 0.05, st.y - 0.18 + dy * 0.05, 0.36, 0.36, 2.6, cityTopH(slot.low) + rise * 0.55));
      svg += cityTint(A, cityBoxSvg(st.x - 0.2 + dx * 0.05, st.y - 0.2 + dy * 0.05, 0.4, 0.4, 0.5, cityTopH(slot.low) + rise * 0.55 + 2.6));
    }
    if (projectId === "tunnel") {
      svg = cityTint(CB.rock, cityBoxSvg(slot.x + 0.1, slot.y + 0.1, 0.8, 0.8, rise, cityTopH(slot.low)))
        + cityTint(CB.iron, cityBoxSvg(st.x - 0.2 - dx * 0.42, st.y - 0.2 - dy * 0.42, 0.4, 0.4, rise * 0.6, cityTopH(slot.low)));
    }
    return { key: st.x + st.y + 0.2, svg: g(svg) };
  }

  const cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
  const lift = cityTopH(slot.level);
  const sink = -(lift - CITY_WATER_H) + 0.3; // from the slot's ground down to just above the water
  const face = cityFacing(project, slot);
  const boxes = (CITY_SVG_PARTS[projectId]?.(R, A, sink) ?? []).map(part => {
    const [gx, gy, w, d] = cityPartRect(part, cx, cy, face);
    return { key: gx + w + gy + d + part[5] * 0.002, svg: cityTint(part[6], cityBoxSvg(gx, gy, w, d, part[4], part[5])) };
  }).sort((a, b) => a.key - b.key).map(p => p.svg).join("");
  return { key: cx + cy + 0.5, svg: g(`<g transform="translate(0 ${-lift})">${boxes}</g>`) };
}

// A road as flat tiles between its via points.
function cityRoadPart(road) {
  let svg = "";
  for (let i = 1; i < road.via.length; i++) {
    const [ax, ay] = road.via[i - 1], [bx, by] = road.via[i];
    const gx = Math.min(ax, bx) - 0.14, gy = Math.min(ay, by) - 0.14;
    const level = cityLevelAt(Math.floor(bx), Math.floor(by));
    svg += cityTint(CB.stoneD, cityBoxSvg(gx, gy, Math.abs(bx - ax) + 0.28, Math.abs(by - ay) + 0.28, 0.4, cityTopH(level)));
  }
  const [x, y] = road.via[road.via.length - 1];
  return { key: x + y + 0.05, svg: `<g class="cb-road">${svg}</g>` };
}

// The plate drawn on an open slot in build mode: a <a> you can tap or focus, with data-slot.
function citySlotPart(slot, state) {
  const upgrade = state.bySlot.has(slot.id);
  const crossing = slot.zones.includes("crossing");
  const up = crossing ? Math.max(...slot.ends.map(cityTopH)) : cityTopH(slot.zones.includes("cliff") ? slot.low : slot.level);
  const plate = cityBoxSvg(slot.x + 0.08, slot.y + 0.08, slot.w - 0.16, slot.h - 0.16, 0.8, up + (upgrade ? 6 : 0.2));
  return { key: slot.x + slot.w + slot.y + slot.h + 3, svg:
    `<a class="cb-slot${upgrade ? " is-upgrade" : ""}" href="#" role="button" data-slot="${slot.id}" aria-label="${slot.name}: ${upgrade ? "upgrade" : "build here"}">${plate}</a>` };
}

// Drop-in for cityMapSvg(items, label): the town with everything in `state` drawn on it.
// options.build: also draw the open slots as tappable plates. options.slots: draw exactly these slot ids as
// plates instead (the places a project being moved could go).
function cityBuildMapSvg(items, state, label, options = {}) {
  const parts = cityTerrainParts();
  cityRoads(state).forEach(road => parts.push(cityRoadPart(road)));
  state.built.forEach(b => parts.push(cityProjectPart(b.project, citySlot(b.slot))));
  const places = [...items.map(it => ({ at: CITY_PLOT[it.id], it })), { at: CITY_PLOT.park, scenery: "park" }, { at: CITY_PLOT.pool, scenery: "pool" }];
  places.forEach(({ at, it, scenery }) => {
    const gx = at.x - 0.75, gy = at.y - 0.75;
    const lift = cityTopH(cityPadLevel(at));
    const inner = scenery ? citySceneryHtml(gx, gy, scenery)
      : `<g class="city-bld" style="--c: ${it.c}" data-id="${it.id}" data-gx="${gx}" data-gy="${gy}" data-lit="${it.lit}">${cityBuildingSvg(gx, gy, it.tier, it.lit)}</g>`;
    const g = `<g transform="translate(0 ${-lift})">${inner}</g>`;
    parts.push({ key: at.x + at.y + 0.5, svg: it?.href && !options.build ? `<a href="${it.href}" aria-label="${it.label}">${g}</a>` : g });
  });
  const plates = options.slots ? options.slots.map(citySlot) : options.build ? cityOpenSlots(state) : [];
  plates.forEach(slot => parts.push(citySlotPart(slot, state)));
  const body = parts.sort((a, b) => a.key - b.key).map(p => p.svg).join("");
  const x0 = cityIso(0, CITY_ROWS)[0] - 10;
  const x1 = cityIso(CITY_COLS, 0)[0] + 10;
  const y1 = cityIso(CITY_COLS, CITY_ROWS)[1] + CITY_DEPTH + 6;
  const top = -cityTopH(3) - cityHeight(3) - CITY_TOWER - 16;
  return `<svg class="city-map${options.build || options.slots ? " is-building" : ""}" viewBox="${x0} ${top} ${x1 - x0} ${y1 - top}" role="img" aria-label="${label}">${body}</svg>`;
}
