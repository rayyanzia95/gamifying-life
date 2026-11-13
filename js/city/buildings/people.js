/* People — where the city gathers: riverside bench → tea house → café → inn → community hall → the festival pavilion */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.people = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'people' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  function bench(x, y, z, w, ry) {
    const b = k.sub(x, y, z); b.group.rotation.y = ry || 0;
    b.add('b', 'wood', 0, 0.09, 0, w, 0.025, 0.12);
    b.add('b', 'wood', 0, 0.16, -0.055, w, 0.1, 0.02);
    [-1, 1].forEach(s => { b.add('b', 'iron', s * (w / 2 - 0.03), 0, 0, 0.025, 0.09, 0.11); b.add('b', 'iron', s * (w / 2 - 0.03), 0.09, -0.055, 0.025, 0.17, 0.02); });
  }
  function table(x, y, z, d, parasol) {
    add('c8', 'woodD', x, y, z, 0.03, 0.14, 0.03);
    add('c16', 'l', x, y + 0.14, z, d, 0.02, d);
    [0.6, 2.7, 4.8].forEach(a => add('c8', 'wood', x + Math.cos(a) * d * 0.8, y, z + Math.sin(a) * d * 0.8, 0.06, 0.08, 0.06));
    add('s8', 'win', x, y + 0.16, z, 0.035, 0.035, 0.035);
    if (parasol) {
      add('c8', 'woodD', x, y + 0.16, z, 0.018, 0.3, 0.018);
      add('p8', parasol, x, y + 0.42, z, d * 1.9, 0.12, d * 1.9);
    }
  }
  function longTable(x, y, z, len) {
    add('b', 'wood', x, y + 0.12, z, len, 0.025, 0.14);
    [-1, 1].forEach(s => add('b', 'woodD', x + s * (len / 2 - 0.04), y, z, 0.03, 0.12, 0.1));
    [-1, 1].forEach(s => add('b', 'wood', x, y + 0.06, z + s * 0.13, len, 0.02, 0.06));
    add('b', 'm', x, y + 0.146, z, len * 0.5, 0.006, 0.08);
    [-0.25, 0.25].forEach(t => add('s8', 'win', x + t * len, y + 0.15, z, 0.035, 0.035, 0.035));
  }
  function striped(x, y, z, w, d, n) {
    for (let i = 0; i < n; i++) add('wedge', i % 2 ? 'white' : 'm', x - w / 2 + (i + 0.5) * (w / n), y, z + d / 2, d, 0.1, w / n, 0, -Math.PI / 2);
  }
  const fest = ['g', 'win', 'a', 'g', 'win'];

  if (tier === 1) {
    k.base(p, { top: 'grass' });
    bench(-0.05, 0.1, -0.05, 0.42, 0);
    k.lantern(0.32, 0.1, -0.12, 0.5);
    k.tree(-0.4, 0.1, -0.26, 0.95, 'round');
    add('b', 'm', 0.02, 0.1, 0.3, 0.3, 0.012, 0.22, 0, 0.3);
    add('b', 'wood', 0.08, 0.11, 0.32, 0.09, 0.07, 0.07, 0, 0.3);
    add('s8', 'a', -0.06, 0.11, 0.3, 0.05, 0.05, 0.05);
    k.bush(0.44, 0.13, 0.28, 0.16);
  } else if (tier === 2) {
    k.base(p, { top: 'grass' });
    k.house(-0.2, 0.1, -0.18, 0.48, 0.36, 0.44, { roof: 'hip', roofH: 0.24, overhang: 0.26 });
    k.door(-0.2, 0.1, 0.04, 0.12, 0.24, 'f');
    add('b', 'woodD', 0.035, 0.22, -0.18, 0.02, 0.17, 0.26);
    add('b', 'win', 0.045, 0.24, -0.18, 0.02, 0.13, 0.22);
    add('b', 'wood', 0.08, 0.2, -0.18, 0.08, 0.025, 0.3);
    table(0.26, 0.1, 0.24, 0.24);
    add('c8', 'woodD', 0.5, 0.1, -0.05, 0.03, 0.5, 0.03);
    k.lights([0.06, 0.5, 0.04], [0.5, 0.58, -0.05], 3, 0.08, { mats: fest });
    k.lights([0.5, 0.58, -0.05], [0.42, 0.34, 0.5], 2, 0.06, { mats: fest });
    add('c8', 'woodD', 0.42, 0.1, 0.5, 0.025, 0.26, 0.025);
    k.bush(-0.46, 0.13, 0.3, 0.18);
  } else if (tier === 3) {
    k.base(p, { top: 'sand' });
    k.house(-0.1, 0.1, -0.2, 0.74, 0.5, 0.46, { roofH: 0.28, axis: 'x' });
    add('b', 'woodD', -0.2, 0.2, 0.035, 0.4, 0.22, 0.02);
    add('b', 'win', -0.2, 0.22, 0.045, 0.36, 0.18, 0.02);
    k.door(0.14, 0.1, 0.03, 0.13, 0.26, 'f');
    striped(-0.1, 0.48, 0.03, 0.74, 0.22, 7);
    k.win(0.27, 0.24, -0.2, 0.12, 0.14, 'r');
    // flower box
    add('b', 'wood', -0.2, 0.15, 0.07, 0.38, 0.04, 0.05);
    [-0.32, -0.2, -0.08].forEach((x, i) => add('s8', i % 2 ? 'a' : 'm', x, 0.19, 0.07, 0.05, 0.05, 0.05));
    table(-0.28, 0.1, 0.38, 0.2, 'a');
    table(0.2, 0.1, 0.42, 0.2, 'm');
    k.lantern(0.56, 0.1, 0.1, 0.34);
    add('b', 'stone', -0.36, 0.56, -0.3, 0.1, 0.3, 0.1);
  } else if (tier === 4) {
    k.base(p, { top: 'sand' });
    k.house(-0.12, 0.1, -0.2, 0.84, 0.9, 0.56, { roofH: 0.32, axis: 'x' });
    add('b', 'woodD', -0.12, 0.54, -0.2, 0.87, 0.04, 0.59);
    k.door(-0.12, 0.1, 0.08, 0.16, 0.3, 'f');
    [-0.4, 0.16].forEach(x => k.win(x, 0.22, 0.08, 0.12, 0.16, 'f'));
    // timber balcony
    add('b', 'wood', -0.12, 0.56, 0.16, 0.84, 0.03, 0.18);
    [-0.5, 0.26].forEach(x => add('b', 'woodD', x, 0.1, 0.23, 0.035, 0.46, 0.035));
    k.rail(-0.12, 0.59, 0.24, 0.84, 'x');
    [-0.38, -0.12, 0.14].forEach(x => k.win(x, 0.66, 0.08, 0.1, 0.16, 'f', { arch: true }));
    [-0.34, -0.06].forEach(z => k.win(0.3, 0.66, z, 0.1, 0.16, 'r', { arch: true }));
    k.win(0.3, 0.24, -0.2, 0.14, 0.16, 'r');
    // hanging sign
    add('b', 'woodD', 0.38, 0.5, 0.2, 0.18, 0.02, 0.02);
    const sign = k.sub(0.42, 0.5, 0.2, 'sway'); sign.group.userData.amp = 0.08;
    sign.add('b', 'm', 0, -0.13, 0, 0.12, 0.11, 0.015);
    sign.add('s8', 'g', 0, -0.1, 0.012, 0.05, 0.05, 0.02);
    add('b', 'stone', -0.42, 1.0, -0.36, 0.11, 0.42, 0.11);
    add('c8', 'woodD', 0.56, 0.1, 0.52, 0.03, 0.56, 0.03);
    add('c8', 'woodD', -0.56, 0.1, 0.52, 0.03, 0.56, 0.03);
    k.lights([0.3, 0.72, 0.25], [0.56, 0.66, 0.52], 3, 0.08, { mats: fest });
    k.lights([0.56, 0.66, 0.52], [-0.56, 0.66, 0.52], 6, 0.14, { mats: fest });
    k.lights([-0.56, 0.66, 0.52], [-0.54, 0.72, 0.25], 3, 0.08, { mats: fest });
    table(-0.3, 0.1, 0.42, 0.2);
    table(0.2, 0.1, 0.44, 0.2);
  } else if (tier === 5) {
    k.base(p, { top: 'sand' });
    k.house(-0.06, 0.1, -0.3, 1.04, 0.6, 0.56, { roof: 'hip', roofH: 0.4 });
    // veranda
    add('wedge', 'm', -0.06, 0.52, 0.1, 0.26, 0.1, 1.08, 0, -Math.PI / 2);
    [-0.54, -0.22, 0.1, 0.42].forEach(x => add('b', 'woodD', x, 0.1, 0.2, 0.035, 0.42, 0.035));
    add('b', 'wood', -0.06, 0.1, 0.1, 1.04, 0.025, 0.24);
    k.door(-0.06, 0.1, -0.02, 0.2, 0.32, 'f');
    [-0.4, 0.28].forEach(x => k.win(x, 0.22, -0.02, 0.14, 0.2, 'f', { arch: true }));
    [-0.4, -0.2].forEach(z => k.win(0.46, 0.26, z, 0.1, 0.2, 'r', { arch: true }));
    add('c8', 'w', -0.06, 1.0, -0.3, 0.2, 0.14, 0.2);
    add('p8', 'a', -0.06, 1.14, -0.3, 0.28, 0.2, 0.28);
    k.flag(-0.06, 1.32, -0.3, 0.24);
    // courtyard
    longTable(-0.26, 0.1, 0.46, 0.5);
    longTable(0.3, 0.1, 0.5, 0.4);
    [[-0.66, 0.6], [0.66, 0.6]].forEach(c => add('c8', 'woodD', c[0], 0.1, c[1], 0.035, 0.62, 0.035));
    k.lights([-0.66, 0.72, 0.6], [0.66, 0.72, 0.6], 7, 0.16, { mats: fest });
    k.lights([-0.66, 0.72, 0.6], [-0.54, 0.6, 0.22], 3, 0.06, { mats: fest });
    k.lights([0.66, 0.72, 0.6], [0.42, 0.6, 0.22], 3, 0.06, { mats: fest });
    k.tree(0.68, 0.1, -0.1, 0.9, 'round');
  } else {
    k.base(p, { top: 'sand' });
    // feast hall at the back
    k.house(-0.14, 0.1, -0.42, 1.1, 0.64, 0.46, { roofH: 0.32, axis: 'x' });
    k.door(-0.14, 0.1, -0.19, 0.2, 0.34, 'f');
    [-0.52, -0.36, 0.08, 0.24].forEach(x => k.win(x, 0.24, -0.19, 0.09, 0.22, 'f', { arch: true }));
    k.banner(-0.14, 0.5, -0.19, 0.12, 0.1, 'f');
    [-0.5, -0.34].forEach(z => k.win(0.41, 0.26, z, 0.09, 0.2, 'r', { arch: true }));
    add('b', 'stone', -0.56, 0.86, -0.5, 0.11, 0.36, 0.11);
    // round pavilion
    const px = -0.14, pz = 0.2;
    add('c16', 'stone', px, 0.1, pz, 0.78, 0.07, 0.78);
    add('c16', 'stoneD', px, 0.1, pz, 0.9, 0.035, 0.9);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; add('c8', 'stone', px + Math.cos(a) * 0.33, 0.17, pz + Math.sin(a) * 0.33, 0.055, 0.48, 0.055); }
    add('c16', 'wd', px, 0.65, pz, 0.8, 0.05, 0.8);
    add('p16', 'm', px, 0.7, pz, 0.88, 0.34, 0.88);
    add('c8', 'a', px, 1.0, pz, 0.1, 0.08, 0.1);
    k.lamp(px, 1.07, pz, 0.1);
    const heart = k.lamp(px, 0.4, pz, 0.14, { anim: 'float' }); heart.userData.amp = 0.03;
    add('b', 'rope', px, 0.52, pz, 0.01, 0.14, 0.01);
    add('c16', 'l', px, 0.17, pz, 0.26, 0.1, 0.26);
    // festival lights fanning out to poles
    [[-0.74, 0.62], [0.36, 0.72], [0.52, -0.02], [-0.76, 0.02]].forEach(c => {
      add('c8', 'woodD', c[0], 0.1, c[1], 0.035, 0.7, 0.035);
      k.lights([px + (c[0] - px) * 0.42, 0.78, pz + (c[1] - pz) * 0.42], [c[0], 0.8, c[1]], 3, 0.07, { mats: fest });
    });
    k.lights([0.36, 0.8, 0.72], [-0.74, 0.8, 0.62], 6, 0.14, { mats: fest });
    // jetty and a lantern boat
    k.deck(0.64, 0.16, 0.38, 0.3, 0.6, 0.0);
    k.pool(0.82, 0.0, 0.38, 0.5, 0.9);
    k.boat(0.9, 0.04, 0.34, 1.0, Math.PI / 2, { lamp: true, cargo: 'm' });
    k.lantern(0.6, 0.16, 0.62, 0.28);
    [[0.84, 0.03, 0.72], [0.98, 0.03, 0.02], [0.74, 0.03, -0.02]].forEach((q, i) => {
      const f = k.sub(q[0], q[1], q[2], 'float'); f.group.userData.amp = 0.01;
      f.add('c8', 'wood', 0, 0, 0, 0.07, 0.012, 0.07);
      f.add('s8', i % 2 ? 'g' : 'win', 0, 0.012, 0, 0.05, 0.05, 0.05).castShadow = false;
    });
    k.tree(0.56, 0.1, -0.5, 0.85, 'round');
    longTable(-0.52, 0.1, 0.62, 0.34);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
