/* Personal — your own corner of the cliff: campsite → stilt cabin → studio tower → garden house → lookout → the sanctuary spire */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.personal = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'personal' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  function campfire(x, y, z) {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add('rock', i % 2 ? 'rock' : 'rockL', x + Math.cos(a) * 0.1, y - 0.015, z + Math.sin(a) * 0.1, 0.06, 0.05, 0.06, i, i * 2, 0); }
    k.addC('c8', 'woodD', x, y + 0.03, z, 0.035, 0.16, 0.035, Math.PI / 2, 0.6);
    k.addC('c8', 'woodD', x, y + 0.03, z, 0.035, 0.16, 0.035, Math.PI / 2, -0.6);
    k.lamp(x, y + 0.03, z, 0.1, { shape: 'p8' }).scale.set(0.09, 0.16, 0.09);
    k.lamp(x + 0.02, y + 0.03, z + 0.02, 0.06, { shape: 'p8', mat: 'win' }).scale.set(0.05, 0.1, 0.05);
  }
  // floating paper lanterns
  function skyLanterns(pts) {
    pts.forEach((q, i) => {
      const l = k.sub(q[0], q[1], q[2], 'float');
      l.group.userData.amp = 0.07; l.group.userData.speed = 0.7 + i * 0.13;
      const body = l.add('taper', i % 2 ? 'g' : 'win', 0, 0, 0, 0.1, 0.12, 0.1, Math.PI);
      body.castShadow = false;
      l.add('c8', 'woodD', 0, -0.012, 0, 0.06, 0.012, 0.06);
    });
  }
  if (tier === 1) {
    k.base(p, { top: 'grass' });
    add('roof', 'm', -0.16, 0.1, -0.12, 0.46, 0.36, 0.52);
    add('roof', 'd', -0.16, 0.1, 0.145, 0.2, 0.22, 0.012);
    add('b', 'a', -0.16, 0.1, -0.12, 0.5, 0.012, 0.56);
    campfire(0.26, 0.1, 0.16);
    k.addC('c8', 'wood', 0.32, 0.14, -0.14, 0.08, 0.3, 0.08, Math.PI / 2, 0.5);
    k.tree(0.42, 0.1, -0.34, 0.8);
    k.tree(-0.5, 0.1, 0.24, 0.5);
    add('c8', 'iron', -0.02, 0.1, 0.36, 0.02, 0.2, 0.02);
    k.lamp(-0.02, 0.3, 0.36, 0.06, { anim: false });
  } else if (tier === 2) {
    k.base(p, { top: 'grass' });
    k.crag(-0.22, 0.1, -0.22, 0.6, 0.34, 0.56, { taper: 0.2, boulders: 3 });
    k.deck(0, 0.5, 0, 0.72, 0.64, 0.1);
    k.house(-0.06, 0.5, -0.06, 0.48, 0.36, 0.44, { roofH: 0.26, plinth: false });
    k.door(-0.06, 0.5, 0.16, 0.12, 0.24, 'f');
    k.win(0.18, 0.62, -0.06, 0.1, 0.12, 'r');
    k.rail(0.02, 0.5, 0.3, 0.68, 'x');
    k.rail(0.34, 0.5, 0.0, 0.6, 'z');
    // ladder
    [-0.05, 0.05].forEach(d => add('b', 'woodD', 0.2 + d, 0.1, 0.4, 0.02, 0.44, 0.02, 0.25));
    for (let i = 0; i < 4; i++) add('b', 'wood', 0.2, 0.16 + i * 0.09, 0.44 - i * 0.022, 0.12, 0.015, 0.02);
    add('b', 'woodD', 0.2, 0.74, 0.2, 0.02, 0.02, 0.14);
    k.lamp(0.2, 0.66, 0.26, 0.07);
    k.tree(0.46, 0.1, -0.36, 0.9);
  } else if (tier === 3) {
    k.base(p, { top: 'grass' });
    add('c8', 'w', -0.05, 0.1, -0.05, 0.54, 1.0, 0.54);
    add('c8', 'wd', -0.05, 0.1, -0.05, 0.58, 0.07, 0.58);
    add('flare', 'wd', -0.05, 0.58, -0.05, 0.8, 0.07, 0.8);
    add('c8', 'wood', -0.05, 0.65, -0.05, 0.82, 0.025, 0.82);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; add('b', 'woodD', -0.05 + Math.cos(a) * 0.38, 0.67, -0.05 + Math.sin(a) * 0.38, 0.022, 0.1, 0.022); }
    k.addC('t05', 'woodD', -0.05, 0.78, -0.05, 0.78, 0.78, 0.3, Math.PI / 2);
    add('flare', 'wd', -0.05, 1.1, -0.05, 0.62, 0.05, 0.62);
    add('p8', 'm', -0.05, 1.15, -0.05, 0.72, 0.48, 0.72);
    k.door(-0.05, 0.1, 0.2, 0.14, 0.28, 'f');
    k.addC('c16', 'wd', -0.05, 0.9, 0.2, 0.2, 0.03, 0.2, Math.PI / 2);
    k.addC('c16', 'win', -0.05, 0.9, 0.212, 0.15, 0.03, 0.15, Math.PI / 2);
    k.win(0.2, 0.82, -0.05, 0.09, 0.16, 'r', { arch: true });
    k.win(0.2, 0.3, -0.05, 0.09, 0.16, 'r', { arch: true });
    // weathervane
    add('c8', 'iron', -0.05, 1.6, -0.05, 0.02, 0.18, 0.02);
    const v = k.sub(-0.05, 1.78, -0.05, 'spin'); v.group.userData.speed = 0.4;
    v.addC('b', 'a', 0, 0, 0, 0.22, 0.02, 0.02);
    v.addC('wedge', 'a', 0.1, 0.02, 0, 0.08, 0.07, 0.015);
    k.bush(0.36, 0.14, 0.34, 0.2);
    k.bush(0.46, 0.13, 0.2, 0.15);
    k.tree(-0.5, 0.1, 0.3, 0.75, 'round');
  } else if (tier === 4) {
    k.base(p, { top: 'grass' });
    k.house(-0.14, 0.1, -0.08, 0.52, 1.3, 0.54, { roofH: 0.36 });
    add('b', 'woodD', -0.14, 0.74, -0.08, 0.55, 0.04, 0.57);
    k.door(-0.14, 0.1, 0.19, 0.14, 0.28, 'f');
    k.win(-0.14, 0.5, 0.19, 0.12, 0.16, 'f');
    // bay window
    add('b', 'w', -0.14, 0.92, 0.23, 0.26, 0.26, 0.1);
    add('b', 'wd', -0.14, 0.88, 0.23, 0.3, 0.04, 0.14);
    add('wedge', 'm', -0.14, 1.18, 0.23, 0.14, 0.08, 0.3, 0, -Math.PI / 2);
    k.win(-0.14, 0.96, 0.28, 0.16, 0.16, 'f');
    k.addC('c16', 'win', -0.14, 1.52, 0.2, 0.12, 0.03, 0.12, Math.PI / 2);
    add('b', 'stone', -0.3, 1.5, -0.2, 0.1, 0.36, 0.1);
    // hanging garden terrace
    add('b', 'wood', 0.36, 0.74, -0.04, 0.5, 0.04, 0.56);
    add('b', 'leafD', 0.38, 0.78, -0.04, 0.42, 0.03, 0.48);
    [-0.24, 0.2].forEach(z => add('b', 'woodD', 0.3, 0.42, z, 0.035, 0.46, 0.035, 0, 0, -0.75));
    k.rail(0.6, 0.78, -0.04, 0.56, 'z');
    k.rail(0.36, 0.78, 0.23, 0.48, 'x');
    k.tree(0.44, 0.8, -0.2, 0.6, 'round');
    k.bush(0.3, 0.86, 0.08, 0.16);
    add('s8', 'a', 0.48, 0.84, 0.1, 0.05, 0.05, 0.05);
    add('s8', 'g', 0.38, 0.84, 0.16, 0.045, 0.045, 0.045);
    k.win(0.12, 0.96, -0.08, 0.1, 0.18, 'r');
    // vines
    [[0.125, 0.3, 0.1], [0.125, 0.42, -0.2], [0.125, 0.2, -0.05]].forEach(v => add('b', 'leaf', v[0], v[1], v[2], 0.02, 0.26, 0.09));
    k.lantern(0.5, 0.1, 0.4, 0.34);
    k.bush(-0.5, 0.14, 0.34, 0.2);
  } else if (tier === 5) {
    k.base(p, { top: 'grass' });
    const top = k.crag(0, 0.1, -0.05, 1.05, 0.42, 1.0, { taper: 0.18, boulders: 5 });
    k.steps(0.1, 0.1, 0.44, 0.26, 4, 0.11, 0.06, 'f', 'stone');
    add('taper', 'w', 0, top, -0.05, 0.6, 1.4, 0.6);
    add('c8', 'wd', 0, top, -0.05, 0.64, 0.08, 0.64);
    k.door(0, top, 0.24, 0.14, 0.28, 'f');
    k.win(0, top + 0.7, 0.2, 0.08, 0.16, 'f', { arch: true });
    k.win(0.25, top + 0.4, -0.05, 0.08, 0.16, 'r', { arch: true });
    // timber gallery
    const gy = top + 1.4;
    add('flare', 'woodD', 0, gy - 0.12, -0.05, 0.9, 0.12, 0.9);
    add('c8', 'wood', 0, gy, -0.05, 0.94, 0.03, 0.94);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; add('b', 'woodD', Math.cos(a) * 0.43, gy + 0.03, -0.05 + Math.sin(a) * 0.43, 0.025, 0.12, 0.025); }
    k.addC('t05', 'woodD', 0, gy + 0.16, -0.05, 0.88, 0.88, 0.3, Math.PI / 2);
    // lookout room
    add('c8', 'w', 0, gy + 0.03, -0.05, 0.5, 0.34, 0.5);
    add('c8', 'win', 0, gy + 0.12, -0.05, 0.52, 0.14, 0.52);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; add('b', 'wd', Math.cos(a) * 0.255, gy + 0.03, -0.05 + Math.sin(a) * 0.255, 0.04, 0.34, 0.04, 0, -a); }
    add('flare', 'wd', 0, gy + 0.37, -0.05, 0.62, 0.05, 0.62);
    add('p8', 'm', 0, gy + 0.42, -0.05, 0.74, 0.52, 0.74);
    k.flag(0, gy + 0.92, -0.05, 0.28);
    // spyglass on the rail
    k.addC('c8', 'a', 0.4, gy + 0.24, 0.2, 0.045, 0.22, 0.045, Math.PI / 2 - 0.3, 0.9);
    add('b', 'iron', 0.36, gy + 0.03, 0.16, 0.02, 0.18, 0.02);
    k.tree(-0.56, 0.1, 0.44, 0.8);
    k.tree(0.56, 0.1, -0.44, 0.65);
    k.lantern(0.5, 0.1, 0.5, 0.34);
  } else {
    k.base(p, { top: 'grass', rocks: 8 });
    const top = k.crag(0, 0.1, -0.08, 1.2, 0.62, 1.1, { taper: 0.22, boulders: 6 });
    k.steps(0.12, 0.1, 0.48, 0.26, 6, 0.105, 0.055, 'f', 'stone');
    k.fall(-0.34, top - 0.04, 0.4, 0.16, 0.12, 'f');
    add('b', 'water', -0.34, top - 0.05, 0.3, 0.16, 0.03, 0.2);
    k.pool(-0.34, 0.1, 0.56, 0.3, 0.2);
    // the spire
    add('taper16', 'w', 0, top, -0.08, 0.62, 1.9, 0.62);
    add('c16', 'wd', 0, top, -0.08, 0.66, 0.08, 0.66);
    k.door(0.0, top, 0.22, 0.14, 0.28, 'f');
    [0.55, 1.05, 1.5].forEach((h, i) => { k.win(0, top + h, 0.2 - i * 0.025, 0.07, 0.15, 'f', { arch: true }); k.win(0.26 - i * 0.025, top + h - 0.2, -0.08, 0.07, 0.15, 'r', { arch: true }); });
    // spiral of hanging gardens
    [[0.75, 0.42], [2.3, 0.82], [3.9, 1.22], [5.5, 1.6]].forEach((g, i) => {
      const r = 0.4 - i * 0.02, x = Math.cos(g[0]) * r, z = -0.08 + Math.sin(g[0]) * r, y = top + g[1];
      add('flare', 'woodD', x, y - 0.1, z, 0.36, 0.1, 0.36);
      add('c8', 'wood', x, y, z, 0.4, 0.03, 0.4);
      add('c8', 'leafD', x, y + 0.03, z, 0.34, 0.025, 0.34);
      if (i % 2) k.tree(x, y + 0.05, z, 0.42, 'round'); else { k.bush(x - 0.04, y + 0.12, z, 0.18); add('s8', 'a', x + 0.09, y + 0.08, z + 0.06, 0.05, 0.05, 0.05); }
      k.lamp(x + Math.cos(g[0]) * 0.17, y + 0.06, z + Math.sin(g[0]) * 0.17, 0.05, { anim: false });
    });
    // glasshouse crown
    const cy = top + 1.9;
    add('flare', 'wd', 0, cy, -0.08, 0.6, 0.08, 0.6);
    add('c16', 'wood', 0, cy + 0.08, -0.08, 0.64, 0.025, 0.64);
    add('hemi', 'glass', 0, cy + 0.1, -0.08, 0.52, 0.36, 0.52);
    k.lamp(0, cy + 0.14, -0.08, 0.16);
    k.bush(0.1, cy + 0.17, -0.02, 0.13);
    k.addC('t05', 'a', 0, cy + 0.12, -0.08, 0.54, 0.54, 0.4, Math.PI / 2);
    add('c8', 'a', 0, cy + 0.44, -0.08, 0.03, 0.14, 0.03);
    k.lamp(0, cy + 0.58, -0.08, 0.06, { anim: false });
    skyLanterns([[0.62, top + 1.5, 0.3], [-0.6, top + 1.1, 0.2], [0.5, top + 2.1, -0.5], [-0.42, top + 1.95, -0.3]]);
    k.tree(0.66, 0.1, 0.36, 0.85);
    k.tree(-0.66, 0.1, -0.3, 0.7);
    k.tree(0.36, top, -0.44, 0.5);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
