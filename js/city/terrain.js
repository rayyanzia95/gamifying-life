// The land under the 3D city, built from Gemini's props (js/city/props.js): a terrace block for every rock level, river
// tiles in the canyon, a waterfall where the river comes in, two stone bridges, steps cut into the cliffs and tree
// clusters. Everything is read from the hand-drawn tables in js/city-svg.js (CITY_TERRAIN, CITY_PLOT, CITY_BRIDGES,
// CITY_STAIRS), so the flat SVG city matches. Level 1 is a thin grass bank; level 2 and 3 stand on one and two terraces.
// The finished group is merged by material (CityUtils.finishBuilding), so the whole land costs a handful of draws.
// Loaded by js/city-home.js after utils.js and props.js, before scene.js.

const CityTerrain = (() => {
  const CELL = 2; // one terrain cell = one terrace block or river tile
  const RISE = 1.25; // each rock level is a terrace stretched to this height (the prop is 1.0 tall)
  const BANK = 0.14; // the grass bank at level 1, just above the river
  const WATER = 0.09; // the river's surface
  const FALL_CELL = [1, 0]; // the waterfall stands here, facing the river below it
  const PALETTE = { main: "#228B22", accent: "#FF69B4", dark: "#556B2F", light: "#D2B48C", glow: "#7CFC00" };

  const topOf = level => (level === 0 ? WATER : level === 1 ? BANK : (level - 1) * RISE);
  // Cell coordinates (a cell is 1 x 1, the whole map is CITY_COLS x CITY_ROWS) to scene x, z.
  const world = (cx, cy) => [(cx - CITY_COLS / 2) * CELL, (cy - CITY_ROWS / 2) * CELL];
  const levelAtPoint = (cx, cy) => cityLevelAt(Math.floor(cx), Math.floor(cy));
  const inMap = (c, r) => c >= 0 && r >= 0 && c < CITY_COLS && r < CITY_ROWS;

  // Where a building or scenery piece stands: scene x, y (the top of its pad), z, and its turn in radians.
  function pad(id) {
    const p = CITY_PLOT[id];
    const [x, z] = world(p.x, p.y);
    return { x, y: topOf(cityPadLevel(p)), z, turn: (p.turn * Math.PI) / 180 };
  }

  // Tree clusters on the plateau, ridge and ledges (cell coordinates). Fixed, like everything else.
  const TREES = [
    [6, 1], [10, 1], [13, 2.4], [1, 0.6], [13.3, 0.7], [7.4, 9], [9, 8.6], [8.2, 9.6],
    [0.7, 7.6], [3.6, 6.6], [0.6, 9.5], [13.5, 6.5], [4, 3.4], [5.2, 7.7],
  ];
  const CITY_DIR_TURN = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }; // the stairs prop climbs toward +z

  function put(group, prop, x, y, z, turn = 0, scale = [1, 1, 1]) {
    prop.position.set(x, y, z);
    prop.rotation.y = turn;
    prop.scale.set(...scale);
    group.add(prop);
  }

  // A river tile flows along z, or along x when turned. It flows along the way with more water around it, and has a
  // grassy bank on each side that has land beside it.
  function addRiver(group, c, r) {
    const water = (dc, dr) => !inMap(c + dc, r + dr) || cityLevelAt(c + dc, r + dr) === 0;
    const land = (dc, dr) => inMap(c + dc, r + dr) && cityLevelAt(c + dc, r + dr) > 0;
    const alongZ = Number(water(0, -1)) + Number(water(0, 1)) >= Number(water(-1, 0)) + Number(water(1, 0));
    // the tile's own "left" is -x; turned a quarter, left is the south side
    const [left, right] = alongZ ? [land(-1, 0), land(1, 0)] : [land(0, 1), land(0, -1)];
    const banks = left && right ? "both" : left ? "left" : right ? "right" : "none";
    const [x, z] = world(c + 0.5, r + 0.5);
    put(group, CityProps.river(PALETTE, { banks }), x, 0, z, alongZ ? 0 : Math.PI / 2);
  }

  function addLand(group) {
    const { mats, geos } = CityUtils.setup(PALETTE);
    const add = CityUtils.createAdder(group, geos, mats);
    CITY_TERRAIN.forEach((row, r) => [...row].forEach((_, c) => {
      const level = cityLevelAt(c, r);
      const [x, z] = world(c + 0.5, r + 0.5);
      if (level === 0) { addRiver(group, c, r); return; }
      if (c === FALL_CELL[0] && r === FALL_CELL[1]) { put(group, CityProps.waterfall(PALETTE), x, 0, z, 0, [1, RISE * 0.92, 1]); return; }
      if (level === 1) {
        add("b", "rock", x, 0, z, CELL, BANK - 0.04, CELL);
        add("b", "grass", x, BANK - 0.04, z, CELL, 0.04, CELL);
        return;
      }
      for (let k = 0; k < level - 1; k++) put(group, CityProps.terrace(PALETTE), x, k * RISE, z, 0, [1, RISE, 1]);
    }));
  }

  // The bridge prop is 3 long and 0.62 tall; stretch it to span the gap and meet the deck's bank.
  function addBridges(group) {
    CITY_BRIDGES.forEach(b => {
      const [x, z0] = world(b.x, b.y0), [, z1] = world(b.x, b.y1);
      put(group, CityProps.bridge(PALETTE), x, 0, (z0 + z1) / 2, 0, [1.4, topOf(b.level) / 0.62, (z1 - z0) / 3]);
    });
  }

  // Stairs climb toward +z; turned and stretched to fill their cell and rise from the low level to the high one.
  function addStairs(group) {
    CITY_STAIRS.forEach(st => {
      const [x, z] = world(st.x, st.y);
      const rise = topOf(st.high) - topOf(st.low);
      put(group, CityProps.stairs(PALETTE), x, topOf(st.low), z, CITY_DIR_TURN[st.dir], [1.7, rise, CELL]);
    });
  }

  function addTrees(group) {
    TREES.forEach(([cx, cy]) => {
      const [x, z] = world(cx, cy);
      put(group, CityProps.trees(PALETTE), x, topOf(levelAtPoint(cx, cy)), z, cx * 7);
    });
  }

  function build(scene) {
    const group = new THREE.Group();
    addLand(group);
    addBridges(group);
    addStairs(group);
    addTrees(group);
    CityUtils.finishBuilding(group);
    scene.add(group);
    return group;
  }

  return { build, pad, size: [CITY_COLS * CELL, CITY_ROWS * CELL] };
})();
