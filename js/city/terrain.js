// The land under the 3D city: the canyon river, the rock levels, the two bridges and the steps cut into the cliffs.
// Everything is read from the hand-drawn tables in js/city-svg.js (CITY_TERRAIN, CITY_PLOT, CITY_BRIDGES, CITY_STAIRS),
// so the flat SVG city matches. Bridges, steps and rock are plain boxes for now: they stand in for the bridge,
// stairs and cliffEdge models that will come later. Loaded by js/city-home.js before scene.js.

const CityTerrain = (() => {
  const CELL = 2.6; // one terrain cell, in scene units
  const LEVEL = 1.2; // how much taller each rock level is
  const WATER = 0.35; // the river's surface
  const DEPTH = 2.5; // how far the land drops below the river, so the island has thickness
  const STRIPES = 2; // rock sides alternate between this many shades, so the cliff layers read as strata

  const topOf = level => (level ? level * LEVEL : WATER);
  // Cell coordinates (a cell is 1 x 1, the whole map is CITY_COLS x CITY_ROWS) to scene x, z.
  const world = (cx, cy) => [(cx - CITY_COLS / 2) * CELL, (cy - CITY_ROWS / 2) * CELL];
  const levelAtPoint = (cx, cy) => cityLevelAt(Math.floor(cx), Math.floor(cy));

  // Where a building or scenery piece stands: scene x, y (the top of its pad), z, and its turn in radians.
  function pad(id) {
    const p = CITY_PLOT[id];
    const [x, z] = world(p.x, p.y);
    return { x, y: topOf(cityPadLevel(p)), z, turn: (p.turn * Math.PI) / 180 };
  }

  // Trees on the plateau, ridge and ledges (cell coordinates), and lamps at the bridge ends. Fixed, like everything else.
  const TREES = [
    [6, 1], [10, 1], [13, 2.4], [1, 0.6], [13.3, 0.7], [7.4, 9], [9, 8.6], [8.2, 9.6],
    [0.7, 7.6], [3.6, 6.6], [0.6, 9.5], [13.5, 6.5], [4, 3.4], [5.2, 7.7],
  ];
  const LAMP_SIDE = 0.45;
  const lampSpots = () => CITY_BRIDGES.flatMap(b => [b.y0 + 0.2, b.y1 - 0.2].flatMap(y => [-LAMP_SIDE, LAMP_SIDE].map(dx => [b.x + dx, y, b.level])));
  function spots() {
    const trees = TREES.map(([cx, cy]) => { const [x, z] = world(cx, cy); return { x, y: topOf(levelAtPoint(cx, cy)), z }; });
    const lamps = lampSpots().map(([cx, cy, level]) => { const [x, z] = world(cx, cy); return { x, y: topOf(level), z }; });
    return { trees, lamps };
  }

  // One slab of land: a box standing on `y0`, `h` tall; its sides are the rock material, its top the grass or water.
  function slab(group, x, z, y0, h, side, top, shadow = true) {
    const mats = [side, side, top, side, side, side]; // +x, -x, +y, -y, +z, -z
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(CELL, h, CELL), mats);
    mesh.position.set(x, y0 + h / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = shadow;
    group.add(mesh);
  }

  function addLand(group, m) {
    CITY_TERRAIN.forEach((row, r) => [...row].forEach((_, c) => {
      const level = cityLevelAt(c, r);
      const [x, z] = world(c + 0.5, r + 0.5);
      if (!level) { slab(group, x, z, -DEPTH, WATER + DEPTH, m.rock[0], m.water, false); return; }
      slab(group, x, z, -DEPTH, LEVEL + DEPTH, m.rock[0], level === 1 ? m.grass[0] : m.rock[0]);
      for (let k = 2; k <= level; k++) slab(group, x, z, (k - 1) * LEVEL, LEVEL, m.rock[(k - 1) % STRIPES], k === level ? m.grass[k - 1] : m.rock[(k - 1) % STRIPES]);
    }));
  }

  function box(group, w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }

  // A deck on the bank's level with a low rail down each side.
  function addBridges(group, m) {
    CITY_BRIDGES.forEach(b => {
      const [x, z0] = world(b.x, b.y0), [, z1] = world(b.x, b.y1);
      const len = z1 - z0, z = (z0 + z1) / 2, top = topOf(b.level), width = CELL * 0.8;
      box(group, width, 0.2, len, x, top - 0.05, z, m.deck);
      [-1, 1].forEach(side => box(group, 0.12, 0.4, len, x + (side * width) / 2, top + 0.2, z, m.rail));
    });
  }

  // Four steps in the direction the stair climbs, from the low level up to the high one.
  function addStairs(group, m) {
    const span = (c, d, i) => (d === 0 ? [c - 0.4, 0.8] : d > 0 ? [c - 0.5 + i / 4, 0.25] : [c + 0.5 - (i + 1) / 4, 0.25]);
    CITY_STAIRS.forEach(st => {
      const [dx, dy] = CITY_DIRS[st.dir];
      for (let i = 0; i < 4; i++) {
        const [gx, w] = span(st.x, dx, i), [gy, d] = span(st.y, dy, i);
        const h = ((i + 1) / 4) * (st.high - st.low) * LEVEL;
        const [x, z] = world(gx + w / 2, gy + d / 2);
        box(group, w * CELL, h, d * CELL, x, topOf(st.low) + h / 2, z, m.deck);
      }
    });
  }

  // colours: { grass: [lv1, lv2, lv3], rock: [shade, shade], water, deck, rail } as hex numbers.
  function build(scene, colours) {
    const mat = hex => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
    const m = {
      grass: colours.grass.map(mat), rock: colours.rock.map(mat),
      water: new THREE.MeshStandardMaterial({ color: colours.water, roughness: 0.35, metalness: 0.1 }),
      deck: mat(colours.deck), rail: mat(colours.rail),
    };
    const group = new THREE.Group();
    addLand(group, m);
    addBridges(group, m);
    addStairs(group, m);
    scene.add(group);
    return group;
  }

  return { build, pad, spots, size: [CITY_COLS * CELL, CITY_ROWS * CELL] };
})();
