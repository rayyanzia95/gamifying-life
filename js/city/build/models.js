/* City builder, part 3 of 5: the 3D models. One generator per project in catalogue.js.
 *
 * Same contract as js/city/props.js:
 *   CityProjects3D[id](palette, opts) -> THREE.Group, built with CityUtils.kit and merged by finishBuilding.
 *   palette = { main, accent, dark, light, glow }   (CITY_PROJECT_PALETTES below has one per project)
 *
 * Sizes: one terrain cell is 2 x 2 units, like the river and terrace tiles. A project with size [2, 1] in the
 * catalogue is drawn 4 wide (x) and 2 deep (z), centred on the origin, standing on y = 0 (the top of its slot).
 * The front is +z: the side that faces the water, the view or the street (the slot's `face`).
 *
 * opts.drop: how far the water lies below the slot's ground (0.05 on a low bank, about 1.2 on a high one).
 *            Docks, the watermill and the beacon reach down by this much, so they work on both.
 * opts.running: the station's train shuttles when true and waits at the platform when false.
 *
 * Two parts move in ways CityUtils.tick doesn't know: the funicular car and the train. They are tagged
 * userData.anim = 'shuttle' and moved by CityBuildKit.tick (scene-kit.js), which also calls CityUtils.tick.
 *
 * Loaded after js/city/utils.js and js/city/props.js (the bridges and the rock stairs reuse those props).
 */
window.CityProjects3D = window.CityProjects3D || {};

window.CITY_PROJECT_PALETTES = {
  river: { main: "#2f8fae", accent: "#e8a23a", dark: "#1f5f78", light: "#e4f4f6", glow: "#7fe3f2" },
  mountain: { main: "#b5653a", accent: "#e0b44c", dark: "#6e3b22", light: "#f3e6d4", glow: "#ffc76a" },
  shared: { main: "#9370db", accent: "#e8c15a", dark: "#4b3b75", light: "#f4f0fb", glow: "#e0b0ff" },
  monument: { main: "#c9a227", accent: "#f2d675", dark: "#7a611a", light: "#fbf3d5", glow: "#ffe27a" },
};

(function () {
  const U = window.CityUtils;
  const P3 = window.CityProjects3D;

  function start(palette, seed) {
    const group = new THREE.Group();
    const k = U.kit(group, palette, seed);
    return { group, k, add: k.add };
  }
  function done(group) { U.finishBuilding(group); return group; }

  // A part that travels back and forth between two points, waiting at each end (the funicular car, the train).
  // CityBuildKit.tick moves it; `period` is the seconds for one way, `wait` the pause at each end.
  function shuttle(k, from, to, period, wait) {
    const s = k.sub(from[0], from[1], from[2], "shuttle");
    Object.assign(s.group.userData, { from, to, period: period || 6, wait: wait || 2 });
    return s;
  }

  // Sloped shop awning on posts: w wide (x), d deep (z), front edge lower.
  function awning(k, x, y, z, w, d, mat) {
    k.add("wedge", mat, x, y, z, d, 0.12, w, 0, Math.PI / 2);
    [-1, 1].forEach(s => k.add("c8", "woodD", x + s * (w / 2 - 0.04), y - 0.36, z + d / 2 - 0.04, 0.035, 0.36, 0.035));
  }

  // A market stall: counter, goods, awning.
  function stall(k, x, y, z, w, mat, goods) {
    k.add("b", "wood", x, y, z, w, 0.2, 0.3);
    k.add("b", "woodD", x, y + 0.2, z, w + 0.04, 0.025, 0.34);
    for (let i = 0; i < 3; i++) k.add(i % 2 ? "s8" : "b", goods[i % goods.length], x - w / 3 + (i * w) / 3, y + 0.225, z, 0.09, 0.07, 0.09);
    [-1, 1].forEach(s => k.add("c8", "woodD", x + s * (w / 2 - 0.03), y, z - 0.14, 0.035, 0.62, 0.035));
    awning(k, x, y + 0.6, z + 0.02, w + 0.1, 0.42, mat);
  }

  // Paving: one slab with a grid of darker joints, sx by sz.
  function paving(k, x, y, z, sx, sz, mat) {
    k.add("b", mat || "stone", x, y, z, sx, 0.05, sz);
    const nx = Math.round(sx / 0.5), nz = Math.round(sz / 0.5);
    for (let i = 1; i < nx; i++) k.add("b", "stoneD", x - sx / 2 + (i * sx) / nx, y + 0.05, z, 0.02, 0.004, sz);
    for (let i = 1; i < nz; i++) k.add("b", "stoneD", x, y + 0.05, z - sz / 2 + (i * sz) / nz, sx, 0.004, 0.02);
  }

  function bench(k, x, y, z, ry) {
    k.add("b", "wood", x, y + 0.1, z, 0.34, 0.03, 0.12, 0, ry);
    k.add("b", "woodD", x, y, z, 0.3, 0.1, 0.04, 0, ry);
  }

  // Straight railway: two rails and sleepers along x, centred at (x, z), len long.
  function track(k, x, y, z, len) {
    const n = Math.round(len / 0.22);
    for (let i = 0; i < n; i++) k.add("b", "woodD", x - len / 2 + (i + 0.5) * (len / n), y, z, 0.07, 0.025, 0.42);
    [-0.13, 0.13].forEach(dz => k.add("b", "iron", x, y + 0.025, z + dz, len, 0.03, 0.03));
  }

  // ---------------------------------------------------------------- toward the river

  // The bridges are the props the town already has; scene-kit.js stretches them across their crossing.
  P3.footbridge = palette => window.CityProps.ropeBridge(palette);
  P3.stonebridge = palette => window.CityProps.bridge(palette);
  P3.rockstairs = palette => window.CityProps.stairs(palette);

  // Docks, 4 x 2. A stone quay on the bank and two timber jetties reaching out over the water in front.
  P3.docks = function (palette, opts) {
    const { group, k, add } = start(palette, "docks");
    const drop = (opts && opts.drop) || 0.05;
    const water = -drop;          // the river's surface, seen from the slot's ground
    const pier = water + 0.16;    // the jetties' deck
    paving(k, 0, 0, -0.2, 3.9, 1.5, "stoneD");
    add("b", "stone", 0, 0, 0.6, 3.9, 0.09, 0.14);
    // harbour office and a store shed
    const top = k.house(-1.2, 0.05, -0.45, 1.0, 0.62, 0.8, { roofH: 0.34, axis: "x" });
    k.door(-1.2, 0.05, -0.05, 0.2, 0.36, "f");
    k.win(-1.5, 0.3, -0.05, 0.16, 0.2, "f");
    k.win(-0.9, 0.3, -0.05, 0.16, 0.2, "f");
    k.banner(-0.7, 0.3, -0.45, 0.14, 0.3, "r");
    k.flag(-1.2, top + 0.34, -0.45, 0.4);
    add("b", "wood", 1.25, 0.05, -0.5, 1.1, 0.42, 0.7);
    add("wedge", "a", 1.25, 0.47, -0.5, 0.8, 0.22, 1.2, 0, Math.PI / 2);
    k.crate(0.2, 0.05, -0.5, 0.2); k.crate(0.45, 0.05, -0.4, 0.16, "a"); k.crate(0.28, 0.25, -0.48, 0.14, "m");
    k.barrel(-0.25, 0.05, -0.55, 0.15); k.barrel(-0.05, 0.05, -0.32, 0.13);
    // a crane for the cargo
    add("c8", "woodD", 0.75, 0.05, 0.25, 0.08, 0.9, 0.08);
    add("b", "woodD", 0.75, 0.9, 0.62, 0.06, 0.06, 0.9);
    add("b", "rope", 0.75, 0.55, 1.0, 0.015, 0.36, 0.015);
    const load = k.sub(0.75, 0.5, 1.0, "sway"); load.group.userData.amp = 0.05;
    load.addC("b", "a", 0, -0.02, 0, 0.16, 0.14, 0.16);
    // on a high bank: steps down the rock to the water
    if (drop > 0.3) {
      const n = Math.max(3, Math.round(drop / 0.12));
      for (let i = 0; i < n; i++) add("b", i % 2 ? "stone" : "stoneD", -1.75, water + 0.14, 0.72 + i * 0.13, 0.36, drop - 0.14 - (i * (drop - 0.14)) / n, 0.13);
    }
    // jetties and mooring posts
    k.deck(-0.9, pier, 1.45, 0.5, 1.5, water - 0.3, { posts: 0.16 });
    k.deck(0.9, pier, 1.3, 0.5, 1.2, water - 0.3, { posts: 0.16 });
    k.deck(0, pier, 0.86, 2.3, 0.34, water - 0.3);
    [[-0.9, 2.1], [0.9, 1.8], [-0.2, 0.95]].forEach(p => k.lantern(p[0], pier, p[1], 0.38));
    k.rail(0, pier, 0.72, 2.2, "x");
    add("c8", "rope", -0.7, pier, 1.9, 0.16, 0.05, 0.16);
    k.boat(-1.55, water + 0.04, 1.5, 1.7, Math.PI / 2, { sail: "m", lamp: true });
    k.boat(0.1, water + 0.04, 1.65, 1.3, Math.PI / 2 + 0.25, { cargo: "a" });
    k.boat(1.6, water + 0.04, 1.35, 1.1, Math.PI / 2 - 0.2, { sail: "l" });
    return done(group);
  };

  // Watermill, 4 x 2. The mill house stands on the bank; the wheel hangs off its front, into the current.
  P3.watermill = function (palette, opts) {
    const { group, k, add } = start(palette, "watermill");
    const drop = (opts && opts.drop) || 0.05;
    const dia = Math.min(1.9, Math.max(1.1, 1.0 + drop * 0.8));
    const axleY = -drop + dia * 0.36;
    add("b", "grass", 0, 0, 0, 3.9, 0.04, 1.9);
    // stone ground floor, timber upper floor, steep roof
    add("b", "stoneD", -0.5, 0.04, -0.15, 1.7, 0.5, 1.3);
    const top = k.house(-0.5, 0.54, -0.15, 1.8, 0.6, 1.4, { roofH: 0.6, wall: "w", axis: "x" });
    [-1.0, -0.5, 0.0].forEach(x => k.win(x, 0.72, 0.55, 0.18, 0.24, "f", { arch: true }));
    k.door(-1.05, 0.04, 0.5, 0.26, 0.4, "f");
    k.win(-1.4, 0.72, -0.15, 0.2, 0.24, "l");
    add("b", "stoneD", -1.1, top + 0.1, -0.3, 0.22, 0.6, 0.22);         // chimney
    add("b", "iron", -1.1, top + 0.7, -0.3, 0.28, 0.04, 0.28);
    // wheel on an axle from the front wall, with a timber frame and a launder feeding it
    add("c8", "woodD", 0.75, axleY - 0.05, 0.62, 0.1, 0.1, 1.1, Math.PI / 2);
    k.wheel(0.75, axleY, 1.05, dia, 0.34, "z", { speed: 0.6 });
    [0.2, 1.3].forEach(x => add("b", "woodD", x, -drop - 0.2, 1.3, 0.09, drop + 0.2 + axleY + 0.1, 0.09));
    add("b", "woodD", 0.75, axleY + 0.05, 1.3, 1.2, 0.07, 0.07);
    add("b", "wood", 1.35, axleY + dia / 2 + 0.02, 1.05, 1.2, 0.05, 0.3);  // launder
    add("b", "water", 1.35, axleY + dia / 2 + 0.07, 1.05, 1.2, 0.02, 0.22);
    [1.25, 1.9].forEach(x => add("b", "woodD", x, -drop - 0.2, 1.05, 0.07, drop + 0.2 + axleY + dia / 2, 0.07));
    k.fall(0.78, axleY + dia / 2 + 0.05, 1.05, 0.22, -drop + 0.05, "l");
    // sacks, a cart and a lantern in the yard
    [[0.9, -0.5], [1.15, -0.4], [1.0, -0.25]].forEach((p, i) => add("s8", i % 2 ? "sand" : "white", p[0], 0.04, p[1], 0.24, 0.2, 0.2));
    add("b", "wood", 1.6, 0.14, -0.55, 0.5, 0.14, 0.34);
    [-0.2, 0.2].forEach(dx => add("c8", "woodD", 1.6 + dx, 0.04, -0.36, 0.22, 0.04, 0.22, Math.PI / 2));
    k.lantern(0.2, 0.04, 0.4, 0.5);
    k.tree(-1.65, 0.04, -0.6, 1.2, "round");
    k.bush(1.75, 0.1, 0.3, 0.26);
    return done(group);
  };

  // Riverside market, 2 x 2. Three stalls under coloured awnings round a small paved yard.
  P3.rivermarket = function (palette) {
    const { group, k, add } = start(palette, "rivermarket");
    paving(k, 0, 0, 0, 1.9, 1.9, "stone");
    stall(k, -0.45, 0.05, -0.55, 0.8, "m", ["a", "g", "l"]);
    stall(k, 0.5, 0.05, -0.5, 0.7, "a", ["m", "leaf", "sand"]);
    // a side stall turned to face the yard
    const side = k.sub(-0.7, 0.05, 0.35, null);
    side.group.rotation.y = Math.PI / 2;
    stall({ add: side.add }, 0, 0, 0, 0.7, "l", ["a", "m", "g"]);
    k.crate(0.55, 0.05, 0.45, 0.18); k.crate(0.72, 0.05, 0.25, 0.14, "a"); k.barrel(0.3, 0.05, 0.6, 0.14);
    add("s8", "a", 0.55, 0.23, 0.45, 0.1, 0.1, 0.1);
    k.lights([-0.85, 0.95, 0.8], [0.85, 0.95, 0.8], 6, 0.14, { mats: ["g", "a", "m"] });
    [-0.85, 0.85].forEach(x => add("c8", "woodD", x, 0.05, 0.8, 0.04, 0.92, 0.04));
    return done(group);
  };

  // Canal, 2 x 4 (later). A stone-lined channel through the low ground, with a footbridge and a moored boat.
  P3.canal = function (palette) {
    const { group, k, add } = start(palette, "canal");
    add("b", "rockD", 0, 0, 0, 1.9, 0.02, 3.9);
    [-0.62, 0.62].forEach(x => { add("b", "stone", x, 0, 0, 0.5, 0.16, 3.9); add("b", "stoneD", x, 0.16, 0, 0.56, 0.03, 3.9); });
    const w = add("b", "water", 0, 0.02, 0, 0.8, 0.07, 3.9);
    w.userData.anim = "float"; w.userData.amp = 0.006;
    // hump-backed footbridge across the middle
    add("arch", "stone", 0, 0.12, 0, 1.3, 0.42, 0.5, 0, 0, 0);
    add("b", "stoneD", 0, 0.5, 0, 1.3, 0.04, 0.5);
    [-0.25, 0.25].forEach(z => k.rail(0, 0.54, z, 1.2, "x", "stoneD"));
    [-1.5, 1.5].forEach(z => [-0.62, 0.62].forEach(x => add("c8", "woodD", x, 0.19, z, 0.07, 0.2, 0.07)));
    k.boat(0, 0.1, 1.1, 1.1, Math.PI / 2, { cargo: "a", lamp: true });
    k.lantern(-0.72, 0.19, -1.1, 0.4);
    k.lantern(0.72, 0.19, 0.9, 0.4);
    return done(group);
  };

  // Dam and reservoir, 4 x 2 (later). A stepped wall across the river, a spillway and a sluice house on top.
  P3.dam = function (palette, opts) {
    const { group, k, add } = start(palette, "dam");
    const drop = (opts && opts.drop) || 0.05;
    const h = 0.9;
    for (let i = 0; i < 4; i++) add("b", i % 2 ? "stone" : "stoneD", 0, -drop + i * (h / 4), 0.5 - i * 0.12, 3.9, h / 4 + drop * (i === 0 ? 1 : 0), 0.9 - i * 0.16);
    add("b", "stoneD", 0, -drop + h, 0.14, 3.9, 0.06, 0.5);
    k.rail(0, -drop + h + 0.06, 0.34, 3.7, "x", "iron");
    // the lake held back behind it
    const lake = add("b", "water", 0, -drop + h - 0.16, -0.5, 3.9, 0.06, 1.0);
    lake.userData.anim = "float"; lake.userData.amp = 0.006;
    // spillway and sluice house
    add("b", "water", 0.9, -drop + h - 0.02, 0.2, 0.6, 0.04, 0.6);
    k.fall(0.9, -drop + h, 0.75, 0.6, -drop + 0.04, "f");
    k.house(-0.9, -drop + h + 0.06, 0.1, 0.7, 0.4, 0.5, { roof: "hip", roofH: 0.26 });
    k.win(-0.9, -drop + h + 0.2, 0.35, 0.16, 0.16, "f");
    add("c8", "iron", -0.2, -drop + h + 0.06, 0.1, 0.18, 0.04, 0.18, Math.PI / 2);   // sluice wheel
    k.lantern(1.7, -drop + h + 0.06, 0.1, 0.4);
    k.lantern(-1.7, -drop + h + 0.06, 0.1, 0.4);
    return done(group);
  };

  // ---------------------------------------------------------------- toward the mountain

  // Terraced street, 4 x 2. Three houses on stepped stone terraces, backs to the cliff (-z), fronts to the street.
  P3.terraces = function (palette) {
    const { group, k, add } = start(palette, "terraces");
    add("b", "stoneD", 0, 0, 0.55, 3.9, 0.05, 0.8);   // the street
    const steps = [{ x: -1.25, y: 0.05, roof: "m" }, { x: 0, y: 0.38, roof: "a" }, { x: 1.25, y: 0.71, roof: "m" }];
    steps.forEach((s, i) => {
      // retaining wall and garden terrace
      add("b", "rock", s.x, 0, -0.4, 1.24, s.y, 1.1);
      add("b", "stone", s.x, 0, 0.16, 1.24, s.y + 0.03, 0.06);
      add("b", "grass", s.x, s.y, -0.4, 1.2, 0.03, 1.06);
      const top = k.house(s.x - 0.05, s.y + 0.03, -0.5, 0.86, 0.52, 0.7, { roofH: 0.36, roofMat: s.roof });
      k.door(s.x - 0.25, s.y + 0.03, -0.15, 0.16, 0.3, "f");
      k.win(s.x + 0.12, s.y + 0.22, -0.15, 0.16, 0.18, "f");
      k.win(s.x + 0.38, s.y + 0.22, -0.5, 0.14, 0.18, "r");
      add("b", "stoneD", s.x + 0.2, top + 0.08, -0.6, 0.12, 0.34, 0.12);     // chimney
      k.bush(s.x + 0.42, s.y + 0.09, -0.02, 0.2);
      if (i > 0) k.steps(s.x - 0.62, steps[i - 1].y + 0.03, 0.0, 0.3, 3, (s.y - steps[i - 1].y) / 3, 0.1, "l");
      if (s.y > 0.1) k.rail(s.x, s.y + 0.03, 0.12, 1.1, "x", "stoneD");
    });
    k.steps(-1.25, 0, 0.3, 0.4, 1, 0.05, 0.14, "f");
    k.lights([-1.8, 0.95, 0.2], [1.8, 1.55, 0.2], 7, 0.2, { mats: ["g", "a"] });
    add("c8", "woodD", -1.8, 0.05, 0.2, 0.04, 0.9, 0.04);
    add("c8", "woodD", 1.8, 0.71, 0.2, 0.04, 0.86, 0.04);
    k.tree(1.75, 0.74, -0.75, 0.9, "cypress");
    k.lantern(-0.62, 0.05, 0.6, 0.42);
    k.lantern(0.65, 0.05, 0.6, 0.42);
    return done(group);
  };

  // Lookout, 2 x 2. A round stone platform, a four-post pavilion, a telescope pointed at the valley.
  P3.lookout = function (palette) {
    const { group, k, add } = start(palette, "lookout");
    add("c8", "rock", 0, 0, 0, 1.9, 0.14, 1.9, 0, Math.PI / 8);
    add("c16", "stone", 0, 0.14, 0, 1.6, 0.1, 1.6);
    add("c16", "stoneD", 0, 0.24, 0, 1.45, 0.03, 1.45);
    // parapet with gaps to see through
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (Math.abs(a - Math.PI * 1.5) < 0.3) continue;   // the way in, at the back
      add("b", i % 2 ? "stone" : "stoneD", Math.cos(a) * 0.74, 0.27, Math.sin(a) * 0.74, 0.3, i % 2 ? 0.2 : 0.14, 0.09, 0, -a + Math.PI / 2);
    }
    [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(p => add("c8", "wood", p[0], 0.27, p[1], 0.07, 0.72, 0.07));
    add("b", "woodD", 0, 0.99, 0, 0.95, 0.05, 0.95);
    add("hip", "m", 0, 1.04, 0, 1.2, 0.5, 1.2);
    add("s8", "a", 0, 1.52, 0, 0.1, 0.1, 0.1);
    k.flag(0, 1.56, 0, 0.42);
    // telescope on a tripod, aimed out over the front
    add("c8", "iron", 0, 0.27, 0.5, 0.05, 0.32, 0.05);
    add("c8", "a", 0, 0.6, 0.6, 0.07, 0.36, 0.07, Math.PI / 2.4);
    add("c8", "d", 0, 0.69, 0.76, 0.09, 0.08, 0.09, Math.PI / 2.4);
    bench(k, -0.42, 0.27, 0, Math.PI / 2);
    k.lamp(0, 0.9, 0, 0.1);
    k.steps(0, 0, -0.95, 0.5, 2, 0.12, 0.14, "b");
    return done(group);
  };

  // Hilltop garden, 4 x 4. Walled, with sand paths in a cross, a fountain in the middle and cypress at the corners.
  P3.garden = function (palette) {
    const { group, k, add } = start(palette, "garden");
    add("b", "grass", 0, 0, 0, 3.9, 0.05, 3.9);
    add("b", "sand", 0, 0.05, 0, 0.5, 0.01, 3.6);
    add("b", "sand", 0, 0.05, 0, 3.6, 0.01, 0.5);
    // low wall with a gap at the front gate
    [[-1.9, 0, 0.12, 3.9], [1.9, 0, 0.12, 3.9]].forEach(w => add("b", "stone", w[0], 0.05, w[1], w[2], 0.22, w[3]));
    add("b", "stone", 0, 0.05, -1.9, 3.9, 0.22, 0.12);
    [-1.15, 1.15].forEach(x => add("b", "stone", x, 0.05, 1.9, 1.6, 0.22, 0.12));
    [-0.34, 0.34].forEach(x => { add("b", "stoneD", x, 0.05, 1.9, 0.16, 0.5, 0.16); k.lamp(x, 0.55, 1.9, 0.1); });
    add("arch", "stone", 0, 0.4, 1.9, 0.72, 0.36, 0.14);
    // fountain: basin, column, two bowls
    add("c16", "stoneD", 0, 0.05, 0, 1.1, 0.14, 1.1);
    k.pool(0, 0.17, 0, 0.94, 0.94, true);
    add("c8", "stone", 0, 0.19, 0, 0.14, 0.5, 0.14);
    add("flare", "stone", 0, 0.5, 0, 0.5, 0.08, 0.5);
    add("c16", "water", 0, 0.58, 0, 0.42, 0.02, 0.42);
    add("flare", "stone", 0, 0.69, 0, 0.26, 0.06, 0.26);
    add("s8", "foam", 0, 0.75, 0, 0.12, 0.12, 0.12).userData.anim = "bob";
    [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + Math.PI / 4; k.fall(Math.cos(a) * 0.2, 0.58, Math.sin(a) * 0.2, 0.06, 0.2, i % 2 ? "f" : "r"); });
    // planting
    [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(p => k.tree(p[0], 0.05, p[1], 1.5, "cypress"));
    [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]].forEach((p, i) => {
      add("c16", "leafD", p[0], 0.05, p[1], 0.9, 0.05, 0.9);
      add("s8", i % 2 ? "a" : "m", p[0], 0.08, p[1], 0.5, 0.26, 0.5);
      k.bush(p[0] + 0.3, 0.12, p[1] - 0.25, 0.22);
    });
    k.tree(-0.9, 0.05, -1.45, 1.1, "round");
    k.tree(0.95, 0.05, -1.4, 1.2, "round");
    bench(k, -0.5, 0.05, -0.75, 0); bench(k, 0.5, 0.05, 0.75, 0);
    [[-0.5, 0.5], [0.5, -0.5]].forEach(p => k.lantern(p[0], 0.05, p[1], 0.45));
    return done(group);
  };

  // Quarry, 4 x 4. Benches of cut rock climbing at the back, a timber crane, squared blocks and a cart on rails.
  P3.quarry = function (palette) {
    const { group, k, add } = start(palette, "quarry");
    add("b", "rockD", 0, 0, 0, 3.9, 0.05, 3.9);
    add("b", "sand", 0.2, 0.05, 0.9, 2.6, 0.01, 1.6);
    // three benches cut into a rock mass, each stepping back
    k.crag(-0.3, 0.05, -1.25, 3.2, 0.5, 1.4, { taper: 0.08, boulders: 5, cap: false });
    k.crag(-0.6, 0.55, -1.45, 2.4, 0.5, 1.0, { taper: 0.1, boulders: 2, cap: false });
    k.crag(-0.9, 1.05, -1.55, 1.5, 0.5, 0.8, { taper: 0.14, boulders: 0, cap: "grass" });
    [[0.1, 0.55, -0.7, 2.2], [-0.2, 1.05, -1.05, 1.4]].forEach(f => add("b", "stone", f[0], f[1], f[2], f[3], 0.02, 0.5));  // clean-cut ledges
    k.tree(-1.0, 1.6, -1.6, 0.9);
    // squared blocks waiting to be taken down
    [[0.9, 0.05, 0.2, 0.36], [1.3, 0.05, 0.25, 0.3], [1.1, 0.4, 0.22, 0.3], [-1.2, 0.05, 0.6, 0.34], [0.5, 0.57, -0.7, 0.26], [0.85, 0.57, -0.72, 0.24]]
      .forEach((b, i) => add("b", i % 2 ? "stone" : "stoneD", b[0], b[1], b[2], b[3] * 1.3, b[3], b[3], 0, k.rand() * 0.3));
    // crane: mast, boom, rope and a block on the hook
    add("b", "woodD", 1.5, 0.05, -0.4, 0.5, 0.08, 0.5);
    add("c8", "woodD", 1.5, 0.13, -0.4, 0.1, 1.6, 0.1);
    add("b", "woodD", 0.95, 1.6, -0.4, 1.5, 0.08, 0.08, 0, 0, 0.12);
    add("b", "woodD", 1.25, 1.05, -0.4, 0.07, 0.8, 0.07, 0, 0, -0.7);
    add("b", "rope", 0.35, 0.95, -0.4, 0.02, 0.62, 0.02);
    const hook = k.sub(0.35, 0.95, -0.4, "sway"); hook.group.userData.amp = 0.04;
    hook.addC("b", "stone", 0, -0.14, 0, 0.3, 0.24, 0.26);
    // cart on a short track, tool shed, lanterns
    track(k, -0.1, 0.06, 1.3, 2.6);
    add("b", "wood", -0.6, 0.2, 1.3, 0.5, 0.2, 0.36);
    add("b", "stoneD", -0.6, 0.4, 1.3, 0.36, 0.1, 0.26);
    [-0.78, -0.42].forEach(x => [-0.14, 0.14].forEach(dz => add("c8", "iron", x, 0.11, 1.3 + dz, 0.14, 0.03, 0.14, Math.PI / 2)));
    add("b", "wood", -1.5, 0.05, 1.45, 0.6, 0.4, 0.5);
    add("wedge", "m", -1.5, 0.45, 1.45, 0.6, 0.18, 0.7, 0, Math.PI / 2);
    k.lantern(1.6, 0.05, 1.5, 0.45);
    k.lantern(-1.7, 0.05, 0.4, 0.45);
    return done(group);
  };

  // Funicular, on a cliff cell. Like the stairs prop it is 1 wide, 1 long and 1 tall, climbing toward +z;
  // scene-kit.js stretches it to the cell and the cliff's height. The car shuttles between the two halts.
  P3.funicular = function (palette) {
    const { group, k, add } = start(palette, "funicular");
    const slope = Math.atan2(1, 0.9), len = Math.hypot(1, 0.9);
    // bedding of rock steps under the rails
    for (let i = 0; i < 6; i++) add("b", i % 2 ? "rock" : "rockD", 0, 0, -0.45 + i * 0.18, 0.72, 0.06 + i * 0.18, 0.18);
    [-0.16, 0.16].forEach(x => k.addC("b", "iron", x, 0.56, 0, 0.035, 0.035, len, -slope));
    for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9; k.addC("b", "woodD", 0, 0.08 + t * 0.96, -0.45 + t * 0.9, 0.5, 0.03, 0.05, -slope); }
    k.addC("b", "rope", 0, 0.585, 0, 0.012, 0.012, len, -slope);    // haulage cable
    // lower halt and upper winding house
    add("b", "stoneD", 0.36, 0, -0.44, 0.24, 0.1, 0.12);
    add("c8", "woodD", 0.42, 0.1, -0.44, 0.025, 0.34, 0.025);
    add("wedge", "m", 0.36, 0.44, -0.44, 0.14, 0.06, 0.28, 0, Math.PI / 2);
    add("b", "w", -0.36, 1.0, 0.44, 0.26, 0.22, 0.12);
    add("roof", "m", -0.36, 1.22, 0.44, 0.3, 0.1, 0.16);
    add("c8", "iron", 0, 1.02, 0.47, 0.16, 0.04, 0.16, 0, 0, Math.PI / 2).userData.anim = "spin";   // winding drum
    k.lamp(0.42, 0.44, -0.44, 0.06);
    k.lamp(-0.36, 1.34, 0.44, 0.06);
    // the car: stepped so the floor stays level on the slope
    const car = shuttle(k, [0, 0.2, -0.36], [0, 0.98, 0.34], 5, 2.5);
    car.addC("b", "m", 0, 0.14, 0, 0.42, 0.2, 0.3);
    car.addC("b", "a", 0, 0.26, 0, 0.46, 0.035, 0.34);
    car.addC("b", "win", 0, 0.16, 0.152, 0.3, 0.09, 0.01);
    car.addC("b", "win", 0, 0.16, -0.152, 0.3, 0.09, 0.01);
    car.addC("b", "d", 0, 0.03, 0, 0.36, 0.04, 0.24);
    return done(group);
  };

  // Rail tunnel, on a cliff cell (later). Same 1 x 1 x 1 box as the stairs: a stone portal in the rock, facing back.
  P3.tunnel = function (palette) {
    const { group, k, add } = start(palette, "tunnel");
    add("b", "rock", 0, 0, 0.2, 1.0, 1.0, 0.6);
    add("b", "rockD", 0, 0, -0.05, 0.92, 0.9, 0.12);
    add("b", "iron", 0, 0, -0.1, 0.5, 0.5, 0.04);                     // the dark mouth
    add("c16", "iron", 0, 0.25, -0.1, 0.5, 0.04, 0.5, Math.PI / 2);
    add("arch", "stone", 0, 0.5, -0.12, 0.62, 0.3, 0.1);
    [-0.31, 0.31].forEach(x => add("b", "stone", x, 0, -0.12, 0.1, 0.52, 0.1));
    add("b", "stoneD", 0, 0.8, -0.12, 0.3, 0.1, 0.06);                // keystone plaque
    [-0.07, 0.07].forEach(x => add("b", "iron", x, 0.02, -0.3, 0.016, 0.016, 0.4));
    for (let i = 0; i < 4; i++) add("b", "woodD", 0, 0, -0.46 + i * 0.1, 0.24, 0.02, 0.04);
    add("c8", "iron", 0.42, 0, -0.4, 0.02, 0.4, 0.02);
    k.lamp(0.42, 0.4, -0.4, 0.06);
    add("b", "grass", 0, 1.0, 0.2, 1.0, 0.03, 0.6);
    return done(group);
  };

  // ---------------------------------------------------------------- shared

  // Market square, 4 x 4. Paving, a well with a little roof, benches, lamps, a tree and a banner pole.
  P3.square = function (palette) {
    const { group, k, add } = start(palette, "square");
    paving(k, 0, 0, 0, 3.9, 3.9, "stone");
    add("c16", "stoneD", 0, 0.05, 0, 2.2, 0.012, 2.2);
    add("c16", "stone", 0, 0.062, 0, 1.7, 0.01, 1.7);
    // the well
    add("c16", "stoneD", 0, 0.07, 0, 0.7, 0.3, 0.7);
    add("c16", "water", 0, 0.34, 0, 0.56, 0.02, 0.56);
    [-0.3, 0.3].forEach(x => add("c8", "woodD", x, 0.37, 0, 0.05, 0.6, 0.05));
    add("roof", "m", 0, 0.94, 0, 0.5, 0.26, 0.9, 0, Math.PI / 2);
    add("c8", "woodD", 0, 0.8, 0, 0.05, 0.6, 0.05, 0, 0, Math.PI / 2);
    add("b", "rope", 0, 0.5, 0, 0.012, 0.3, 0.012);
    add("c8", "wood", 0, 0.42, 0, 0.12, 0.12, 0.12);
    // around the edge
    [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(p => k.lantern(p[0], 0.05, p[1], 0.6));
    bench(k, -1.0, 0.05, 0, Math.PI / 2); bench(k, 1.0, 0.05, 0, Math.PI / 2);
    bench(k, 0, 0.05, 1.0, 0);
    add("c16", "stoneD", -1.25, 0.05, -1.2, 0.6, 0.1, 0.6);
    k.tree(-1.25, 0.15, -1.2, 1.6, "round");
    stall(k, 1.1, 0.05, -1.35, 0.9, "a", ["m", "g", "l"]);
    add("c8", "stoneD", 1.3, 0.05, 1.2, 0.3, 0.08, 0.3);
    k.flag(1.3, 0.13, 1.2, 1.2);
    k.banner(1.3, 0.55, 1.2, 0.16, 0.36, "l");
    k.lights([-1.5, 0.75, 1.5], [1.5, 0.75, 1.5], 8, 0.16, { mats: ["g", "a", "m"] });
    return done(group);
  };

  // Railway station, 4 x 2. A platform with a canopy, a station house with a clock tower, and a train on the
  // track along the front. The train shuttles when opts.running is true (a streak is alive) and otherwise waits.
  P3.station = function (palette, opts) {
    const { group, k, add } = start(palette, "station");
    add("b", "rockD", 0, 0, 0, 3.9, 0.04, 1.9);
    add("b", "stone", 0, 0.04, -0.15, 3.9, 0.14, 1.1);
    add("b", "stoneD", 0, 0.18, 0.36, 3.9, 0.012, 0.08);
    // station house and clock tower
    const top = k.house(-0.9, 0.18, -0.5, 1.5, 0.56, 0.6, { roofH: 0.3, axis: "x" });
    k.door(-0.9, 0.18, -0.2, 0.22, 0.38, "f");
    [-1.4, -0.4].forEach(x => k.win(x, 0.4, -0.2, 0.18, 0.22, "f", { arch: true }));
    add("b", "w", 0.1, 0.18, -0.5, 0.42, 1.2, 0.42);
    add("b", "wd", 0.1, 1.38, -0.5, 0.5, 0.05, 0.5);
    add("hip", "m", 0.1, 1.43, -0.5, 0.56, 0.4, 0.56);
    add("s8", "a", 0.1, 1.82, -0.5, 0.08, 0.08, 0.08);
    k.addC("c16", "white", 0.1, 1.12, -0.28, 0.3, 0.03, 0.3, Math.PI / 2);     // clock face
    k.addC("b", "iron", 0.1, 1.16, -0.26, 0.02, 0.1, 0.01);
    k.addC("b", "iron", 0.14, 1.12, -0.26, 0.09, 0.02, 0.01);
    void top;
    // platform canopy on posts, a bench and the name board
    [0.6, 1.2, 1.8].forEach(x => add("c8", "iron", x, 0.18, 0.2, 0.04, 0.56, 0.04));
    add("b", "woodD", 1.2, 0.74, 0.0, 1.5, 0.03, 0.7);
    add("wedge", "m", 1.2, 0.77, 0.0, 0.7, 0.1, 1.5, 0, Math.PI / 2);
    bench(k, 1.2, 0.18, -0.3, 0);
    add("b", "d", 1.2, 0.5, -0.62, 0.6, 0.14, 0.03);
    k.lamp(0.6, 0.68, 0.2, 0.07); k.lamp(1.8, 0.68, 0.2, 0.07);
    k.crate(1.75, 0.18, -0.4, 0.14); k.barrel(-1.75, 0.18, -0.1, 0.12);
    // track and train
    track(k, 0, 0.04, 0.68, 3.9);
    const running = !!(opts && opts.running);
    const train = running ? shuttle(k, [-0.9, 0.1, 0.68], [0.9, 0.1, 0.68], 7, 3) : k.sub(0.5, 0.1, 0.68, null);
    // engine
    train.addC("b", "d", 0.5, 0.06, 0, 0.7, 0.07, 0.3);
    train.addC("c8", "m", 0.56, 0.2, 0, 0.24, 0.5, 0.24, 0, 0, Math.PI / 2);
    train.addC("b", "m", 0.24, 0.24, 0, 0.26, 0.3, 0.3);
    train.addC("b", "a", 0.24, 0.41, 0, 0.3, 0.03, 0.34);
    train.addC("b", "win", 0.24, 0.28, 0.152, 0.14, 0.1, 0.01);
    train.addC("c8", "iron", 0.72, 0.38, 0, 0.08, 0.16, 0.08);
    train.addC("flare", "iron", 0.72, 0.48, 0, 0.12, 0.05, 0.12);
    train.addC("s8", "g", 0.84, 0.2, 0, 0.07, 0.07, 0.07);
    // carriage
    train.addC("b", "d", -0.4, 0.06, 0, 0.8, 0.07, 0.3);
    train.addC("b", "a", -0.4, 0.22, 0, 0.78, 0.26, 0.3);
    train.addC("b", "l", -0.4, 0.37, 0, 0.82, 0.03, 0.34);
    [-0.64, -0.4, -0.16].forEach(x => { train.addC("b", "win", x, 0.25, 0.152, 0.14, 0.1, 0.01); train.addC("b", "win", x, 0.25, -0.152, 0.14, 0.1, 0.01); });
    [0.7, 0.3, -0.12, -0.68].forEach(x => [-0.13, 0.13].forEach(z => train.addC("c8", "iron", x, 0.0, z, 0.12, 0.03, 0.12, Math.PI / 2)));
    if (running) {
      const smoke = train.addC("s8", "foam", 0.72, 0.62, 0, 0.12, 0.12, 0.12);
      smoke.userData.anim = "bob"; smoke.userData.amp = 0.05; smoke.castShadow = false;
    }
    return done(group);
  };

  // Beacon tower, 2 x 2. A tall tapering light on a rock base. On a riverbank it is a lighthouse; on a peak, a
  // watch-light. The lantern room glows in the palette's colour and a faint beam turns round it.
  P3.beacon = function (palette, opts) {
    const { group, k, add } = start(palette, "beacon");
    const drop = Math.min((opts && opts.drop) || 0, 0.4);
    k.crag(0, -drop, 0, 1.7, 0.3 + drop, 1.7, { taper: 0.2, boulders: 5, cap: "grass" });
    const y0 = 0.34;
    add("c16", "stoneD", 0, y0, 0, 0.9, 0.14, 0.9);
    // shaft in three courses, banded in the branch colour
    add("taper16", "w", 0, y0 + 0.14, 0, 0.72, 0.8, 0.72);
    add("c16", "m", 0, y0 + 0.94, 0, 0.56, 0.1, 0.56);
    add("taper16", "w", 0, y0 + 1.04, 0, 0.52, 0.7, 0.52);
    add("c16", "m", 0, y0 + 1.74, 0, 0.42, 0.08, 0.42);
    add("taper16", "w", 0, y0 + 1.82, 0, 0.4, 0.5, 0.4);
    k.door(0, y0 + 0.14, 0.36, 0.16, 0.3, "f");
    [0.75, 1.4, 2.0].forEach((y, i) => k.win(0, y0 + y, 0.3 - i * 0.045, 0.08, 0.14, "f", { arch: true }));
    // gallery, lantern room, cap
    add("flare", "stoneD", 0, y0 + 2.32, 0, 0.62, 0.08, 0.62);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add("b", "iron", Math.cos(a) * 0.28, y0 + 2.4, Math.sin(a) * 0.28, 0.02, 0.12, 0.02); }
    add("t05", "iron", 0, y0 + 2.5, 0, 0.58, 0.58, 0.4, Math.PI / 2);
    add("c8", "glass", 0, y0 + 2.4, 0, 0.36, 0.3, 0.36);
    k.lamp(0, y0 + 2.46, 0, 0.2);
    add("dome", "m", 0, y0 + 2.7, 0, 0.44, 0.24, 0.44);
    add("s8", "a", 0, y0 + 2.94, 0, 0.07, 0.07, 0.07);
    const beam = k.sub(0, y0 + 2.55, 0, "spin"); beam.group.userData.speed = 0.5;
    beam.addC("p8", "beam", 0.62, 0, 0, 0.3, 1.1, 0.3, 0, 0, Math.PI / 2).castShadow = false;
    beam.addC("p8", "beam", -0.62, 0, 0, 0.3, 1.1, 0.3, 0, 0, -Math.PI / 2).castShadow = false;
    k.bush(0.6, 0.38, 0.3, 0.2);
    return done(group);
  };

  // ---------------------------------------------------------------- monuments

  // Victory statue, 2 x 2. A stepped plinth and a golden cup wreathed in laurel, raised for an exam boss defeated.
  P3.statue = function (palette) {
    const { group, k, add } = start(palette, "statue");
    paving(k, 0, 0, 0, 1.5, 1.5, "stoneD");
    add("b", "stone", 0, 0.05, 0, 0.9, 0.12, 0.9);
    add("b", "stoneD", 0, 0.17, 0, 0.7, 0.1, 0.7);
    add("b", "stone", 0, 0.27, 0, 0.46, 0.5, 0.46);
    add("b", "stoneD", 0, 0.77, 0, 0.56, 0.06, 0.56);
    add("b", "a", 0, 0.42, 0.236, 0.28, 0.16, 0.012);                 // plaque
    // the cup
    add("c8", "g", 0, 0.83, 0, 0.22, 0.04, 0.22);
    add("c8", "g", 0, 0.87, 0, 0.07, 0.16, 0.07);
    add("flare", "g", 0, 1.03, 0, 0.34, 0.26, 0.34);
    add("t05", "a", 0, 1.27, 0, 0.36, 0.36, 0.5, Math.PI / 2);
    [-1, 1].forEach(s => add("tArc", "g", s * 0.2, 1.1, 0, 0.16, 0.16, 0.3, 0, s > 0 ? 0 : Math.PI, Math.PI * 0.35));
    k.lamp(0, 1.34, 0, 0.12, { mat: "g" });
    add("t15", "leaf", 0, 0.84, 0, 0.5, 0.5, 0.2, Math.PI / 2);      // laurel
    [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(p => { add("c8", "stoneD", p[0], 0.05, p[1], 0.1, 0.22, 0.1); k.lamp(p[0], 0.27, p[1], 0.07); });
    return done(group);
  };

  // Lantern arch, 2 x 2. Two pillars, an arch and a row of hanging lamps under a crescent, left after a Ramadan.
  P3.lanterns = function (palette) {
    const { group, k, add } = start(palette, "lanterns");
    paving(k, 0, 0, 0, 1.7, 1.1, "stone");
    [-0.6, 0.6].forEach(x => {
      add("b", "stoneD", x, 0.05, 0, 0.3, 0.12, 0.3);
      add("b", "w", x, 0.17, 0, 0.2, 1.0, 0.2);
      add("b", "m", x, 0.6, 0, 0.22, 0.06, 0.22);
      add("b", "stoneD", x, 1.17, 0, 0.26, 0.06, 0.26);
    });
    add("arch", "w", 0, 1.2, 0, 1.4, 0.6, 0.2);
    add("arch", "m", 0, 1.2, 0, 1.2, 0.5, 0.22);
    k.crescent(0, 1.8, 0, 1.4, "g");
    // hanging lamps in a row, each on its own cord
    [-0.36, -0.12, 0.12, 0.36].forEach((x, i) => {
      const drop = 0.26 + (i % 2) * 0.12;
      add("b", "iron", x, 1.3 - drop, 0, 0.01, drop + (0.25 - Math.abs(x) * 0.5), 0.01);
      const l = k.sub(x, 1.3 - drop, 0, "sway"); l.group.userData.amp = 0.06;
      l.addC("c6", "iron", 0, -0.02, 0, 0.1, 0.03, 0.1);
      l.addC("c6", i % 2 ? "g" : "glass", 0, -0.1, 0, 0.09, 0.13, 0.09);
      l.addC("p8", "iron", 0, -0.19, 0, 0.1, 0.05, 0.1, Math.PI);
      const glow = l.addC("s8", "g", 0, -0.1, 0, 0.06, 0.06, 0.06);
      glow.material = glow.material.clone(); glow.userData.anim = "flicker"; glow.castShadow = false;
    });
    k.lights([-0.6, 1.1, 0.14], [0.6, 1.1, 0.14], 5, 0.1, { mats: ["g", "a"], size: 0.05 });
    return done(group);
  };

  // ---------------------------------------------------------------- extras the scene draws for itself

  // One stretch of paved road, `len` long along z and 0.6 wide. scene-kit.js lays these along CITY_ROADS.
  P3.road = function (palette, len) {
    const { group, add } = start(palette, "road" + len);
    add("b", "stoneD", 0, 0, 0, 0.62, 0.035, len);
    add("b", "stone", 0, 0.035, 0, 0.5, 0.006, len);
    const n = Math.max(1, Math.round(len / 0.3));
    for (let i = 0; i < n; i++) add("b", "stoneD", 0, 0.041, -len / 2 + (i + 0.5) * (len / n), 0.5, 0.003, 0.02);
    return done(group);
  };
})();
