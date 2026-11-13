/* Academics — the scholars' quarter: study nook → schoolhouse → library → college → cliff observatory → the university */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.academics = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'academics' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  function books(x, y, z, n) {
    const cols = ['m', 'a', 'l', 'd'];
    for (let i = 0; i < n; i++) add('b', cols[i % 4], x + (k.rand() - 0.5) * 0.015, y + i * 0.03, z, 0.13, 0.028, 0.1, 0, (k.rand() - 0.5) * 0.5);
  }
  function clock(x, y, z, d, face) {
    const ry = face === 'r' ? Math.PI / 2 : 0, fx = face === 'r' ? 1 : 0, fz = face === 'r' ? 0 : 1;
    k.addC('c16', 'd', x, y, z, d, 0.03, d, Math.PI / 2, ry);
    k.addC('c16', 'win', x + fx * 0.012, y, z + fz * 0.012, d * 0.8, 0.03, d * 0.8, Math.PI / 2, ry);
    k.addC('b', 'iron', x + fx * 0.03, y + d * 0.14, z + fz * 0.03, 0.014, d * 0.3, 0.014);
  }
  // armillary sphere: three turning rings round a lit core
  function armillary(x, y, z, d) {
    add('c8', 'a', x, y - d * 0.75, z, 0.035, d * 0.3, 0.035);
    const s = k.sub(x, y, z, 'spin');
    s.group.userData.speed = 0.5;
    s.addC('t05', 'a', 0, 0, 0, d, d, d * 0.8);
    s.addC('t05', 'a', 0, 0, 0, d, d, d * 0.8, 0, Math.PI / 2);
    s.addC('t05', 'm', 0, 0, 0, d * 1.1, d * 1.1, d * 0.8, Math.PI / 2 - 0.4);
    k.lamp(x, y - d * 0.16, z, d * 0.32);
  }
  function observatory(x, y, z, d, h) {
    add('c16', 'w', x, y, z, d, h, d);
    add('c16', 'wd', x, y, z, d * 1.05, 0.06, d * 1.05);
    add('c16', 'wd', x, y + h, z, d * 1.08, 0.04, d * 1.08);
    add('hemi', 'm', x, y + h + 0.04, z, d, d * 0.5, d);
    // slit and telescope pointing up and out to the front-right
    const t = new THREE.Group();
    t.position.set(x, y + h + 0.04 + d * 0.18, z); t.rotation.y = Math.PI * 0.62; group.add(t);
    const ta = window.CityUtils.createAdder(t, k.geos, k.mats);
    ta('b', 'd', 0, -d * 0.02, d * 0.2, d * 0.2, d * 0.36, d * 0.52, -0.5);
    ta('c8', 'a', 0, d * 0.1, d * 0.34, d * 0.13, d * 0.5, d * 0.13, 0.95);
    ta('c8', 'g', 0, d * 0.25, d * 0.53, d * 0.1, 0.03, d * 0.1, 0.95);
  }

  if (tier === 1) {
    k.base(p, { top: 'grass' });
    k.tree(-0.26, 0.1, -0.2, 1.25, 'round');
    add('b', 'wood', 0.12, 0.3, 0.12, 0.42, 0.03, 0.24);
    [[-0.17, -0.09], [0.17, -0.09], [-0.17, 0.09], [0.17, 0.09]].forEach(c => add('b', 'woodD', 0.12 + c[0], 0.1, 0.12 + c[1], 0.03, 0.2, 0.03));
    add('c8', 'wood', 0.12, 0.1, 0.38, 0.11, 0.13, 0.11);
    books(0.0, 0.33, 0.1, 3);
    add('b', 'l', 0.16, 0.33, 0.15, 0.14, 0.012, 0.1, 0, 0.2);
    add('b', 'd', 0.16, 0.335, 0.15, 0.008, 0.012, 0.1, 0, 0.2);
    add('c8', 'iron', 0.28, 0.33, 0.06, 0.02, 0.1, 0.02);
    k.lamp(0.28, 0.42, 0.06, 0.08);
    books(-0.36, 0.1, 0.34, 2);
  } else if (tier === 2) {
    k.base(p, { top: 'grass' });
    k.house(0, 0.1, -0.06, 0.66, 0.42, 0.5, { roofH: 0.28, axis: 'x' });
    k.door(0, 0.1, 0.19, 0.14, 0.26, 'f');
    [-0.21, 0.21].forEach(x => k.win(x, 0.22, 0.19, 0.1, 0.14, 'f'));
    k.win(0.33, 0.22, -0.06, 0.12, 0.14, 'r');
    // bell cupola
    add('b', 'w', 0, 0.74, -0.06, 0.16, 0.16, 0.16);
    add('b', 'woodD', 0, 0.78, 0.022, 0.09, 0.09, 0.012);
    add('s8', 'a', 0, 0.79, 0.03, 0.06, 0.06, 0.04);
    add('hip', 'd', 0, 0.9, -0.06, 0.24, 0.18, 0.24);
    k.flag(0.36, 0.1, 0.36, 0.5);
    add('b', 'stone', 0, 0.1, 0.36, 0.2, 0.012, 0.3);
    books(-0.36, 0.1, 0.36, 3);
  } else if (tier === 3) {
    k.base(p, { top: 'grass' });
    add('b', 'stoneD', 0, 0.1, 0.02, 0.98, 0.04, 0.84);
    k.house(-0.1, 0.14, -0.08, 0.78, 0.56, 0.58, { roof: 'hip', roofH: 0.34 });
    k.door(-0.2, 0.14, 0.21, 0.16, 0.3, 'f');
    [-0.42, 0.02].forEach(x => k.win(x, 0.26, 0.21, 0.08, 0.26, 'f', { arch: true }));
    // reading tower
    add('c8', 'w', 0.34, 0.14, 0.2, 0.36, 1.0, 0.36);
    add('c8', 'wd', 0.34, 0.14, 0.2, 0.4, 0.07, 0.4);
    add('flare', 'wd', 0.34, 1.1, 0.2, 0.44, 0.06, 0.44);
    add('p8', 'm', 0.34, 1.16, 0.2, 0.5, 0.44, 0.5);
    k.lamp(0.34, 1.58, 0.2, 0.07);
    [0.36, 0.76].forEach(y => { k.win(0.34, y, 0.375, 0.08, 0.18, 'f', { arch: true }); k.win(0.515, y, 0.2, 0.08, 0.18, 'r', { arch: true }); });
    k.banner(0.29, 0.34, -0.2, 0.12, 0.24, 'r');
    k.steps(-0.2, 0.1, 0.46, 0.3, 1, 0.04, 0.06, 'f', 'stone');
    books(-0.5, 0.14, 0.34, 4);
  } else if (tier === 4) {
    k.base(p, { top: 'grass' });
    add('b', 'stoneD', 0, 0.1, 0.02, 1.1, 0.04, 0.96);
    k.house(-0.14, 0.14, -0.16, 0.86, 0.6, 0.56, { roofH: 0.3, axis: 'x' });
    k.arcade(-0.14, 0.14, 0.2, 0.86, 0.4, 4, 'f');
    add('wedge', 'm', -0.14, 0.56, 0.16, 0.16, 0.08, 0.9, 0, -Math.PI / 2);
    [-0.44, -0.24, -0.04, 0.16].forEach(x => k.win(x, 0.24, 0.12, 0.08, 0.2, 'f', { arch: true }));
    // small rooftop dome
    add('c8', 'w', -0.42, 0.86, -0.16, 0.22, 0.14, 0.22);
    add('hemi', 'l', -0.42, 1.0, -0.16, 0.24, 0.14, 0.24);
    // clock tower
    add('b', 'w', 0.38, 0.14, 0.2, 0.36, 1.4, 0.36);
    add('b', 'wd', 0.38, 0.14, 0.2, 0.4, 0.08, 0.4);
    add('b', 'wd', 0.38, 0.98, 0.2, 0.4, 0.04, 0.4);
    add('b', 'wd', 0.38, 1.54, 0.2, 0.44, 0.05, 0.44);
    clock(0.38, 1.28, 0.385, 0.26, 'f');
    clock(0.565, 1.28, 0.2, 0.26, 'r');
    add('hip', 'm', 0.38, 1.59, 0.2, 0.46, 0.6, 0.46);
    k.lamp(0.38, 2.17, 0.2, 0.07);
    k.door(0.38, 0.14, 0.38, 0.14, 0.28, 'f');
    [0.5, 0.76].forEach(y => k.win(0.56, y, 0.2, 0.08, 0.16, 'r', { arch: true }));
    k.tree(-0.6, 0.1, 0.44, 0.7, 'round');
    k.flag(0.02, 1.04, -0.16, 0.24);
  } else if (tier === 5) {
    k.base(p, { top: 'grass' });
    const top = k.crag(-0.05, 0.1, -0.1, 1.2, 0.5, 1.1, { taper: 0.14, cap: 'stoneD', boulders: 6 });
    k.steps(0.2, 0.1, 0.46, 0.3, 5, 0.105, 0.065, 'f', 'stone');
    observatory(-0.14, top, -0.14, 0.82, 0.52);
    k.door(-0.14, top, 0.27, 0.15, 0.28, 'f');
    [-0.75, 0.75].forEach(a => add('b', 'win', -0.14 + Math.sin(a) * 0.41, top + 0.18, -0.14 + Math.cos(a) * 0.41, 0.08, 0.2, 0.03, 0, a));
    [1.35, 1.85].forEach(a => add('b', 'win', -0.14 + Math.sin(a) * 0.41, top + 0.18, -0.14 + Math.cos(a) * 0.41, 0.08, 0.2, 0.03, 0, a));
    // astronomer's house
    k.house(0.36, top, -0.36, 0.3, 0.36, 0.34, { roofH: 0.2 });
    k.win(0.51, top + 0.12, -0.36, 0.09, 0.12, 'r');
    armillary(0.4, top + 0.42, 0.22, 0.24);
    add('c8', 'stone', 0.4, top, 0.22, 0.14, 0.16, 0.14);
    k.tree(-0.6, 0.1, 0.5, 0.7);
    k.lantern(0.56, 0.1, 0.56, 0.34);
  } else {
    k.base(p, { top: 'grass' });
    add('b', 'stoneD', 0, 0.1, 0, 1.36, 0.05, 1.2);
    // main range with cloister
    k.house(0, 0.15, -0.18, 1.2, 0.66, 0.6, { roofH: 0.32, axis: 'x' });
    k.arcade(0, 0.15, 0.22, 1.2, 0.42, 6, 'f');
    add('wedge', 'm', 0, 0.59, 0.17, 0.18, 0.08, 1.24, 0, -Math.PI / 2);
    [-0.5, -0.3, 0.3, 0.5].forEach(x => k.win(x, 0.26, 0.12, 0.08, 0.2, 'f', { arch: true }));
    [-0.3, -0.06].forEach(z => k.win(0.6, 0.34, z, 0.1, 0.24, 'r', { arch: true }));
    // great tower
    add('b', 'w', 0, 0.15, 0.06, 0.42, 1.85, 0.42);
    add('b', 'wd', 0, 0.15, 0.06, 0.46, 0.08, 0.46);
    add('b', 'wd', 0, 1.2, 0.06, 0.46, 0.04, 0.46);
    add('b', 'wd', 0, 1.64, 0.06, 0.46, 0.04, 0.46);
    add('b', 'wd', 0, 2.0, 0.06, 0.5, 0.05, 0.5);
    k.door(0, 0.15, 0.27, 0.16, 0.32, 'f');
    k.banner(0, 0.74, 0.27, 0.14, 0.34, 'f');
    clock(0, 1.43, 0.275, 0.3, 'f');
    clock(0.215, 1.43, 0.06, 0.3, 'r');
    k.win(0, 1.72, 0.27, 0.12, 0.22, 'f', { arch: true });
    k.win(0.21, 1.72, 0.06, 0.12, 0.22, 'r', { arch: true });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => add('hip', 'd', c[0] * 0.2, 2.05, 0.06 + c[1] * 0.2, 0.1, 0.2, 0.1));
    add('hip', 'm', 0, 2.05, 0.06, 0.4, 0.56, 0.4);
    armillary(0, 2.84, 0.06, 0.3);
    // observatory wing
    observatory(-0.5, 0.15, 0.3, 0.44, 0.5);
    // library wing with gable to the front
    k.house(0.48, 0.15, 0.32, 0.36, 0.5, 0.4, { roofH: 0.22 });
    k.win(0.48, 0.3, 0.52, 0.12, 0.24, 'f', { arch: true });
    k.win(0.66, 0.3, 0.32, 0.1, 0.2, 'r', { arch: true });
    k.flag(-0.5, 1.1, -0.18, 0.26);
    k.flag(0.5, 1.1, -0.18, 0.26);
    k.tree(0.74, 0.1, -0.44, 0.8, 'round');
    books(0.2, 0.15, 0.5, 4);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
