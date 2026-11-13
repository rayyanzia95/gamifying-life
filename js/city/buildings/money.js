/* Money — the trading quay: market stall → trading post → counting house → merchant guild → cliff treasury → grand exchange */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.money = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'money' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  // gold coin standing on edge, facing a wall face
  function coin(x, y, z, d, face, spin) {
    const ry = face === 'r' ? Math.PI / 2 : 0;
    if (spin) {
      const s = k.sub(x, y, z, 'spin');
      s.group.userData.speed = 1.2;
      s.addC('c16', 'g', 0, 0, 0, d, 0.035, d, Math.PI / 2);
      s.addC('c16', 'a', 0, 0, 0, d * 0.62, 0.045, d * 0.62, Math.PI / 2);
      return;
    }
    k.addC('c16', 'a', x, y, z, d, 0.03, d, Math.PI / 2, ry);
    k.addC('c16', 'g', x + (face === 'r' ? 0.012 : 0), y, z + (face === 'r' ? 0 : 0.012), d * 0.78, 0.03, d * 0.78, Math.PI / 2, ry);
  }
  function coinStack(x, y, z, n) {
    for (let i = 0; i < n; i++) add('c16', i % 2 ? 'g' : 'a', x + (k.rand() - 0.5) * 0.008, y + i * 0.02, z, 0.07, 0.018, 0.07);
  }
  // sloped shop awning projecting from a front wall
  function awning(x, y, z, w, d, mat) {
    add('wedge', mat || 'a', x, y, z + d / 2, d, 0.1, w, 0, -Math.PI / 2);
  }
  function quay(x, z, len, w) {
    add('b', 'stoneD', x, 0.06, z, w, 0.07, len);
    [-0.4, 0, 0.4].forEach(t => add('c8', 'woodD', x + w / 2, 0.06, z + t * len, 0.045, 0.16, 0.045));
  }

  if (tier === 1) {
    k.base(p, { top: 'sand' });
    k.deck(0, 0.2, 0, 0.72, 0.56, 0.1);
    [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]].forEach(c => add('c8', 'woodD', c[0], 0.2, c[1], 0.03, 0.46, 0.03));
    add('roof', 'm', 0, 0.64, 0, 0.62, 0.16, 0.8, 0, Math.PI / 2);
    add('b', 'wood', 0, 0.2, 0.2, 0.56, 0.16, 0.12);
    add('b', 'woodD', 0, 0.36, 0.2, 0.6, 0.02, 0.15);
    coinStack(-0.18, 0.38, 0.2, 4);
    coinStack(-0.08, 0.38, 0.22, 2);
    add('b', 'a', 0.15, 0.38, 0.2, 0.1, 0.06, 0.08);
    k.crate(-0.18, 0.2, -0.1, 0.13);
    k.crate(0.12, 0.2, -0.12, 0.11, 'a');
    k.barrel(0.5, 0.1, 0.1, 0.11);
    coin(0, 0.6, 0.31, 0.13, 'f');
  } else if (tier === 2) {
    k.base(p, { top: 'sand' });
    k.house(-0.1, 0.1, -0.12, 0.62, 0.44, 0.5, { roofH: 0.28 });
    add('b', 'woodD', -0.1, 0.24, 0.135, 0.36, 0.2, 0.02);
    add('b', 'win', -0.1, 0.26, 0.14, 0.32, 0.16, 0.02);
    add('b', 'wood', -0.1, 0.22, 0.17, 0.4, 0.03, 0.08);
    awning(-0.1, 0.45, 0.13, 0.5, 0.2, 'a');
    k.door(0.21, 0.1, -0.12, 0.13, 0.25, 'r');
    add('b', 'woodD', 0.3, 0.52, 0.16, 0.2, 0.02, 0.02);
    add('b', 'rope', 0.36, 0.44, 0.16, 0.01, 0.08, 0.01);
    coin(0.36, 0.38, 0.16, 0.13, 'f');
    k.crate(0.36, 0.1, 0.34, 0.13);
    k.crate(0.34, 0.24, 0.34, 0.09, 'a');
    k.barrel(-0.46, 0.1, 0.28, 0.11);
    coinStack(-0.2, 0.25, 0.17, 3);
    k.lantern(0.5, 0.1, -0.3, 0.34);
  } else if (tier === 3) {
    k.base(p, { top: 'sand' });
    k.house(-0.16, 0.1, -0.06, 0.68, 0.8, 0.6, { roof: 'hip', roofH: 0.36 });
    add('b', 'woodD', -0.16, 0.5, -0.06, 0.71, 0.04, 0.63);
    k.door(-0.16, 0.1, 0.24, 0.16, 0.3, 'f');
    coin(-0.16, 0.48, 0.25, 0.14, 'f');
    [-0.36, 0.04].forEach(x => { k.win(x, 0.2, 0.24, 0.1, 0.15, 'f'); k.win(x, 0.62, 0.24, 0.1, 0.15, 'f', { arch: true }); });
    k.win(0.18, 0.62, -0.06, 0.12, 0.15, 'r', { arch: true });
    add('b', 'stone', -0.36, 1.0, -0.2, 0.1, 0.34, 0.1);
    // quay, crane and a cargo boat
    quay(0.36, 0.05, 1.15, 0.22);
    k.pool(0.58, 0.0, 0.05, 0.3, 1.0);
    k.boat(0.6, 0.05, 0.1, 0.9, Math.PI / 2, { cargo: 'a' });
    add('c8', 'woodD', 0.36, 0.13, -0.3, 0.05, 0.62, 0.05);
    add('b', 'woodD', 0.46, 0.72, -0.3, 0.36, 0.04, 0.04, 0, 0, 0.25);
    add('b', 'rope', 0.6, 0.56, -0.3, 0.01, 0.2, 0.01);
    add('b', 'wood', 0.6, 0.46, -0.3, 0.1, 0.1, 0.1);
    k.crate(0.34, 0.13, 0.42, 0.12);
    k.barrel(0.36, 0.13, 0.2, 0.1);
    k.flag(-0.16, 1.24, -0.06, 0.24);
  } else if (tier === 4) {
    k.base(p, { top: 'sand' });
    add('b', 'stoneD', -0.08, 0.1, 0.02, 1.08, 0.05, 1.0);
    k.house(-0.18, 0.15, -0.1, 0.76, 0.9, 0.66, { roofH: 0.4 });
    add('b', 'wd', -0.18, 0.56, -0.1, 0.79, 0.04, 0.69);
    k.arcade(-0.18, 0.15, 0.3, 0.76, 0.4, 3, 'f', { fill: 'win' });
    add('b', 'w', -0.18, 0.15, 0.25, 0.76, 0.42, 0.04);
    [-0.4, -0.18, 0.04].forEach(x => k.win(x, 0.68, 0.23, 0.1, 0.18, 'f', { arch: true }));
    coin(-0.18, 1.14, 0.24, 0.16, 'f');
    // counting tower
    add('b', 'w', 0.36, 0.15, -0.26, 0.36, 1.4, 0.36);
    add('b', 'wd', 0.36, 1.55, -0.26, 0.42, 0.05, 0.42);
    add('hip', 'a', 0.36, 1.6, -0.26, 0.46, 0.38, 0.46);
    k.lamp(0.36, 1.96, -0.26, 0.09);
    [0.5, 0.9, 1.25].forEach(y => k.win(0.54, y, -0.26, 0.08, 0.14, 'r', { arch: true }));
    k.win(0.36, 1.25, -0.08, 0.08, 0.14, 'f', { arch: true });
    k.banner(0.54, 0.2, -0.26, 0.12, 0.22, 'r');
    k.crate(0.4, 0.15, 0.2, 0.14);
    k.crate(0.42, 0.29, 0.2, 0.1, 'a');
    k.barrel(0.4, 0.15, 0.42, 0.11);
    coinStack(0.26, 0.15, 0.4, 5);
    k.lantern(-0.62, 0.1, 0.5, 0.38);
  } else if (tier === 5) {
    k.base(p, { top: 'stoneD' });
    // vault cut into the cliff
    const top = k.crag(0, 0.1, -0.22, 1.36, 1.3, 0.95, { taper: 0.22, boulders: 5 });
    add('b', 'w', 0, 0.1, 0.24, 0.98, 0.86, 0.3);
    add('b', 'wd', 0, 0.1, 0.24, 1.04, 0.08, 0.36);
    add('b', 'wd', 0, 0.96, 0.24, 1.06, 0.06, 0.38);
    add('roof', 'm', 0, 1.02, 0.24, 1.06, 0.22, 0.38);
    [-0.4, -0.22, 0.22, 0.4].forEach(x => add('c8', 'stone', x, 0.18, 0.42, 0.08, 0.76, 0.08));
    k.steps(0, 0.1, 0.44, 0.5, 2, 0.04, 0.07, 'f', 'stone');
    // round vault door with a turning lock
    k.addC('c16', 'd', 0, 0.55, 0.395, 0.46, 0.04, 0.46, Math.PI / 2);
    k.addC('c16', 'a', 0, 0.55, 0.41, 0.38, 0.04, 0.38, Math.PI / 2);
    const lockOuter = new THREE.Group();
    lockOuter.position.set(0, 0.55, 0.44); lockOuter.rotation.x = Math.PI / 2; group.add(lockOuter);
    const lock = k.sub(0, 0, 0, 'spin', lockOuter);
    lock.group.userData.speed = 0.5;
    lock.addC('b', 'g', 0, 0, 0, 0.3, 0.03, 0.045);
    lock.addC('b', 'g', 0, 0, 0, 0.045, 0.03, 0.3);
    lock.addC('c16', 'm', 0, 0, 0, 0.12, 0.05, 0.12);
    [-0.31, 0.31].forEach(x => { add('b', 'g', x, 0.3, 0.395, 0.03, 0.42, 0.02); });
    // lookout and gold store on the clifftop
    add('c8', 'w', -0.2, top, -0.3, 0.4, 0.3, 0.4);
    add('dome', 'm', -0.2, top + 0.3, -0.3, 0.44, 0.3, 0.44);
    k.lamp(-0.2, top + 0.6, -0.3, 0.08);
    k.win(-0.2, top + 0.08, -0.1, 0.08, 0.14, 'f', { arch: true });
    k.tree(0.3, top, -0.3, 0.55);
    k.fall(0.5, top - 0.3, 0.12, 0.14, 0.1, 'r');
    k.pool(0.66, 0.1, 0.12, 0.2, 0.3);
    k.crate(0.52, 0.1, 0.5, 0.13, 'a');
    coinStack(-0.55, 0.1, 0.5, 6);
    coinStack(-0.47, 0.1, 0.55, 3);
    k.lantern(0.62, 0.1, 0.44, 0.36);
  } else {
    k.base(p, { top: 'stoneD' });
    add('b', 'stoneD', -0.1, 0.1, 0, 1.3, 0.06, 1.22);
    add('b', 'stone', -0.1, 0.16, -0.02, 1.2, 0.05, 1.1);
    k.steps(-0.1, 0.1, 0.56, 0.5, 2, 0.055, 0.07, 'f', 'stone');
    // great hall with colonnade
    k.house(-0.1, 0.21, -0.12, 1.08, 0.7, 0.76, { roof: 'flat' });
    k.arcade(-0.1, 0.21, 0.38, 1.08, 0.56, 5, 'f', { round: true });
    add('b', 'wd', -0.1, 0.83, 0.3, 1.14, 0.05, 0.24);
    add('roof', 'm', -0.1, 0.88, 0.3, 1.14, 0.2, 0.24);
    coin(-0.1, 0.97, 0.43, 0.13, 'f');
    k.door(-0.1, 0.21, 0.26, 0.2, 0.36, 'f');
    [-0.5, -0.3, 0.1, 0.3].forEach(x => k.win(x, 0.34, 0.26, 0.09, 0.2, 'f', { arch: true }));
    [-0.3, -0.05, 0.2].forEach(z => k.win(0.44, 0.42, z - 0.1, 0.1, 0.22, 'r', { arch: true }));
    // drum, golden dome and the turning coin
    add('c16', 'w', -0.1, 0.99, -0.12, 0.6, 0.26, 0.6);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; add('b', 'win', -0.1 + Math.cos(a) * 0.3, 1.05, -0.12 + Math.sin(a) * 0.3, 0.07, 0.13, 0.02, 0, -a + Math.PI / 2); }
    add('c16', 'wd', -0.1, 1.25, -0.12, 0.66, 0.04, 0.66);
    add('dome', 'm', -0.1, 1.29, -0.12, 0.62, 0.46, 0.62);
    add('c8', 'a', -0.1, 1.73, -0.12, 0.05, 0.2, 0.05);
    coin(-0.1, 2.08, -0.12, 0.3, 'f', true);
    // corner towers
    [-0.56, 0.36].forEach(x => {
      add('b', 'w', x, 0.21, -0.42, 0.26, 1.2, 0.26);
      add('b', 'wd', x, 1.41, -0.42, 0.3, 0.05, 0.3);
      add('hip', 'a', x, 1.46, -0.42, 0.34, 0.34, 0.34);
      k.lamp(x, 1.78, -0.42, 0.07);
      k.win(x, 1.14, -0.29, 0.07, 0.14, 'f', { arch: true });
    });
    k.banner(-0.56, 0.72, -0.29, 0.1, 0.26, 'f');
    k.banner(0.36, 0.72, -0.29, 0.1, 0.26, 'f');
    // quay and a sailing trader
    quay(0.66, 0.1, 1.2, 0.2);
    k.pool(0.88, 0.0, 0.1, 0.3, 1.1);
    k.boat(0.9, 0.05, 0.15, 1.1, Math.PI / 2, { sail: 'm', lamp: true });
    k.crate(0.64, 0.13, 0.5, 0.13);
    k.crate(0.66, 0.13, 0.32, 0.1, 'a');
    coinStack(0.64, 0.13, -0.2, 6);
    k.lantern(-0.72, 0.1, 0.52, 0.4);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
