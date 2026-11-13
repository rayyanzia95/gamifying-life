/* Health — springs and crags: training deck → spring bath → climbing crag → bathhouse → terraced spa → the grand thermae */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.health = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'health' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  // coloured climbing holds scattered over a rock face
  function holds(x, y, z, w, h, face, n) {
    const cols = ['a', 'g', 'm', 'white', 'l'];
    for (let i = 0; i < n; i++) {
      const u = (k.rand() - 0.5) * w, v = ((i + 0.5) / n) * h;
      const px = face === 'r' ? x : x + u, pz = face === 'r' ? z + u : z;
      k.addC('rock', cols[i % cols.length], px, y + v, pz, 0.045, 0.045, 0.045, k.rand() * 3, k.rand() * 3, 0).castShadow = false;
    }
  }
  function steam(x, y, z, n) {
    for (let i = 0; i < n; i++) {
      const s = k.addC('rock2', 'foam', x + (k.rand() - 0.5) * 0.22, y + i * 0.11, z + (k.rand() - 0.5) * 0.22, 0.13 - i * 0.02, 0.1 - i * 0.015, 0.13 - i * 0.02, k.rand() * 3, k.rand() * 3, 0);
      s.castShadow = false;
      s.userData.anim = 'float'; s.userData.amp = 0.04; s.userData.speed = 0.9;
    }
  }
  function basin(x, y, z, d, h) {
    add('c16', 'stone', x, y, z, d, h, d);
    add('c16', 'stoneD', x, y + h - 0.02, z, d * 1.06, 0.03, d * 1.06);
    add('c16', 'water', x, y + h - 0.005, z, d * 0.84, 0.03, d * 0.84);
  }
  function pullUpBar(x, y, z, w, h) {
    [-1, 1].forEach(s => add('c8', 'woodD', x + s * w / 2, y, z, 0.04, h, 0.04));
    k.addC('c8', 'a', x, y + h - 0.03, z, 0.025, w + 0.08, 0.025, 0, 0, Math.PI / 2);
  }

  if (tier === 1) {
    k.base(p, { top: 'grass' });
    k.deck(-0.12, 0.17, 0.08, 0.6, 0.5, 0.1);
    add('b', 'm', -0.12, 0.17, 0.14, 0.34, 0.025, 0.2);
    pullUpBar(-0.12, 0.17, -0.12, 0.42, 0.5);
    // dumbbell
    k.addC('c8', 'iron', 0.08, 0.2, 0.26, 0.02, 0.14, 0.02, 0, 0, Math.PI / 2);
    [-1, 1].forEach(s => k.addC('c8', 'a', 0.08 + s * 0.07, 0.2, 0.26, 0.07, 0.03, 0.07, 0, 0, Math.PI / 2));
    // bouldering rock
    add('rock', 'rock', 0.34, 0.06, -0.2, 0.44, 0.5, 0.42, 0.4, 0.3, 0);
    holds(0.34, 0.2, 0.01, 0.2, 0.3, 'f', 5);
    k.lantern(-0.5, 0.1, -0.3, 0.32);
  } else if (tier === 2) {
    k.base(p, { top: 'grass' });
    k.house(-0.24, 0.1, -0.2, 0.44, 0.36, 0.4, { roof: 'hip', roofH: 0.26 });
    k.door(-0.24, 0.1, 0.0, 0.12, 0.22, 'f');
    k.win(-0.02, 0.22, -0.2, 0.1, 0.11, 'r');
    basin(0.2, 0.1, 0.18, 0.56, 0.1);
    steam(0.2, 0.3, 0.18, 3);
    [0.42, 0.5].forEach((x, i) => add('rock', i ? 'rockD' : 'rockL', x, 0.06, -0.08 - i * 0.1, 0.2, 0.18, 0.2, i, 1, 2));
    add('c8', 'woodD', -0.42, 0.1, 0.3, 0.025, 0.3, 0.025);
    add('c8', 'woodD', -0.18, 0.1, 0.3, 0.025, 0.3, 0.025);
    add('b', 'woodD', -0.3, 0.38, 0.3, 0.28, 0.02, 0.02);
    add('b', 'white', -0.36, 0.26, 0.3, 0.08, 0.12, 0.015);
    add('b', 'm', -0.25, 0.28, 0.3, 0.08, 0.1, 0.015);
    k.lantern(-0.5, 0.1, -0.05, 0.3);
  } else if (tier === 3) {
    k.base(p, { top: 'grass' });
    const top = k.crag(0.22, 0.1, -0.15, 0.62, 1.2, 0.6, { taper: 0.4, boulders: 3 });
    holds(0.22, 0.2, 0.19, 0.3, 0.95, 'f', 9);
    holds(0.5, 0.2, -0.15, 0.3, 0.8, 'r', 6);
    add('b', 'rope', 0.12, 0.3, 0.2, 0.012, 0.98, 0.012);
    k.flag(0.22, top, -0.15, 0.3);
    add('b', 'a', 0.22, 0.1, 0.34, 0.4, 0.05, 0.22);
    k.house(-0.36, 0.1, 0.06, 0.44, 0.42, 0.52, { roofH: 0.26 });
    k.door(-0.36, 0.1, 0.32, 0.13, 0.24, 'f');
    k.win(-0.14, 0.24, 0.06, 0.1, 0.12, 'r');
    k.lantern(-0.62, 0.1, 0.4, 0.3);
  } else if (tier === 4) {
    k.base(p, { top: 'stoneD' });
    // domed bathhouse
    add('c16', 'w', -0.16, 0.1, -0.16, 0.8, 0.58, 0.8);
    add('c16', 'wd', -0.16, 0.1, -0.16, 0.84, 0.07, 0.84);
    add('c16', 'wd', -0.16, 0.68, -0.16, 0.88, 0.05, 0.88);
    add('hemi', 'm', -0.16, 0.73, -0.16, 0.8, 0.36, 0.8);
    add('c8', 'a', -0.16, 1.07, -0.16, 0.14, 0.06, 0.14);
    k.lamp(-0.16, 1.12, -0.16, 0.1);
    [-0.75, 0.75, 1.25, 1.75].forEach(a => {
      add('b', 'win', -0.16 + Math.sin(a) * 0.4, 0.3, -0.16 + Math.cos(a) * 0.4, 0.09, 0.22, 0.03, 0, a);
    });
    k.door(-0.16, 0.1, 0.24, 0.15, 0.3, 'f');
    // terrace pools with a spout
    add('b', 'stone', 0.28, 0.1, 0.3, 0.62, 0.12, 0.5);
    add('b', 'water', 0.28, 0.2, 0.3, 0.52, 0.03, 0.4);
    add('b', 'stone', 0.34, 0.1, -0.22, 0.3, 0.3, 0.3);
    add('b', 'water', 0.34, 0.385, -0.22, 0.22, 0.03, 0.22);
    k.fall(0.34, 0.4, -0.06, 0.12, 0.22, 'f');
    steam(0.28, 0.34, 0.32, 3);
    k.tree(-0.56, 0.1, 0.34, 0.8, 'cypress');
    k.tree(-0.4, 0.1, 0.46, 0.6, 'cypress');
  } else if (tier === 5) {
    k.base(p, { top: 'grass' });
    const top = k.crag(-0.3, 0.1, -0.25, 0.8, 0.8, 0.7, { taper: 0.2, cap: 'stoneD', boulders: 4 });
    // spring pool up on the rock, cascading to the lower bath
    add('c16', 'water', -0.3, top - 0.01, -0.2, 0.46, 0.03, 0.4);
    add('b', 'water', -0.3, top - 0.01, 0.05, 0.16, 0.03, 0.2);
    k.fall(-0.3, top, 0.14, 0.16, 0.22, 'f');
    add('b', 'stone', -0.25, 0.1, 0.38, 0.66, 0.12, 0.44);
    add('b', 'water', -0.25, 0.2, 0.38, 0.56, 0.03, 0.34);
    steam(-0.3, top + 0.12, -0.2, 3);
    holds(0.1, 0.2, -0.3, 0.4, 0.6, 'r', 7);
    // sanatorium tower
    add('c16', 'w', 0.36, 0.1, -0.1, 0.56, 1.3, 0.56);
    add('c16', 'wd', 0.36, 0.1, -0.1, 0.6, 0.08, 0.6);
    add('flare', 'wd', 0.36, 0.86, -0.1, 0.8, 0.08, 0.8);
    add('c16', 'wood', 0.36, 0.94, -0.1, 0.82, 0.025, 0.82);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add('b', 'woodD', 0.36 + Math.cos(a) * 0.39, 0.96, -0.1 + Math.sin(a) * 0.39, 0.02, 0.1, 0.02); }
    k.addC('t05', 'woodD', 0.36, 1.07, -0.1, 0.78, 0.78, 0.3, Math.PI / 2);
    add('c16', 'wd', 0.36, 1.4, -0.1, 0.62, 0.05, 0.62);
    add('p16', 'm', 0.36, 1.45, -0.1, 0.7, 0.5, 0.7);
    k.lamp(0.36, 1.93, -0.1, 0.09);
    k.door(0.36, 0.1, 0.18, 0.14, 0.28, 'f');
    [0.5, 1.1].forEach(y => { k.win(0.36, y, 0.18, 0.08, 0.16, 'f', { arch: true }); k.win(0.64, y, -0.1, 0.08, 0.16, 'r', { arch: true }); });
    k.tree(0.6, 0.1, 0.46, 0.75, 'cypress');
    k.lantern(0.2, 0.1, 0.56, 0.34);
  } else {
    k.base(p, { top: 'stoneD' });
    // climbing spire with the source at its top
    const top = k.crag(-0.42, 0.1, -0.38, 0.74, 2.2, 0.7, { taper: 0.45, boulders: 4 });
    holds(-0.42, 0.3, -0.06, 0.3, 1.5, 'f', 12);
    holds(-0.1, 0.3, -0.38, 0.3, 1.3, 'r', 9);
    k.flag(-0.42, top, -0.38, 0.32);
    add('b', 'rope', -0.5, 0.5, -0.07, 0.012, 1.5, 0.012);
    // great rotunda
    add('c16', 'stone', 0.14, 0.1, 0.0, 1.06, 0.08, 1.06);
    add('c16', 'w', 0.14, 0.18, 0.0, 0.8, 0.6, 0.8);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      add('c8', 'stone', 0.14 + Math.cos(a) * 0.48, 0.18, Math.sin(a) * 0.48, 0.07, 0.6, 0.07);
    }
    add('c16', 'wd', 0.14, 0.78, 0.0, 1.08, 0.06, 1.08);
    add('c16', 'w', 0.14, 0.84, 0.0, 0.7, 0.16, 0.7);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; add('b', 'win', 0.14 + Math.cos(a) * 0.35, 0.87, Math.sin(a) * 0.35, 0.08, 0.09, 0.02, 0, -a + Math.PI / 2); }
    add('hemi', 'm', 0.14, 1.0, 0.0, 0.76, 0.44, 0.76);
    k.addC('t05', 'a', 0.14, 1.03, 0.0, 0.8, 0.8, 0.5, Math.PI / 2);
    add('c8', 'a', 0.14, 1.42, 0.0, 0.16, 0.08, 0.16);
    k.lamp(0.14, 1.48, 0.0, 0.16, { shape: 'p8' });
    for (let i = 0; i < 4; i++) { const a = 0.35 + i * 0.42; add('b', 'win', 0.14 + Math.sin(a) * 0.4, 0.3, Math.cos(a) * 0.4, 0.09, 0.3, 0.03, 0, a); }
    // cascade from the spire into two stepped pools
    add('b', 'stone', -0.42, 0.1, 0.12, 0.4, 0.42, 0.34);
    add('b', 'water', -0.42, 0.505, 0.12, 0.3, 0.03, 0.26);
    k.fall(-0.36, 1.3, -0.07, 0.14, 0.52, 'f');
    add('b', 'stone', -0.4, 0.1, 0.5, 0.52, 0.16, 0.4);
    add('b', 'water', -0.4, 0.245, 0.5, 0.42, 0.03, 0.3);
    k.fall(-0.42, 0.52, 0.3, 0.2, 0.27, 'f');
    steam(-0.4, 0.4, 0.5, 3);
    k.steps(0.14, 0.1, 0.58, 0.36, 2, 0.04, 0.06, 'f', 'stone');
    k.tree(0.72, 0.1, 0.4, 0.9, 'cypress');
    k.tree(0.74, 0.1, -0.36, 0.75, 'cypress');
    k.lantern(0.5, 0.1, 0.62, 0.36);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
