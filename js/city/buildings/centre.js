/* Centre — the heart of the city: spring well → river gate → town hall → clock tower → citadel → the great lighthouse */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.centre = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'centre' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  // ring of battlements on a round wall
  function crenels(x, y, z, r, n, mat) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      add('b', mat || 'w', x + Math.cos(a) * r, y, z + Math.sin(a) * r, 0.09, 0.09, 0.07, 0, -a + Math.PI / 2);
    }
  }

  if (tier === 1) {
    k.base(p, { top: 'stoneD' });
    add('c16', 'stone', 0, 0.1, 0, 0.52, 0.17, 0.52);
    add('c16', 'stoneD', 0, 0.25, 0, 0.56, 0.035, 0.56);
    add('c16', 'water', 0, 0.255, 0, 0.42, 0.035, 0.42);
    [-0.24, 0.24].forEach(x => add('b', 'woodD', x, 0.1, 0, 0.045, 0.62, 0.045));
    add('b', 'woodD', 0, 0.62, 0, 0.5, 0.035, 0.035);
    add('hip', 'm', 0, 0.7, 0, 0.72, 0.2, 0.5);
    add('b', 'rope', 0, 0.46, 0, 0.012, 0.18, 0.012);
    const orb = k.lamp(0, 0.4, 0, 0.11, { anim: 'float' });
    orb.userData.amp = 0.03;
    add('c8', 'wood', 0.36, 0.1, 0.22, 0.09, 0.09, 0.09);
    k.tree(-0.42, 0.1, -0.3, 0.55, 'round');
  } else if (tier === 2) {
    k.base(p, { top: 'stoneD' });
    [-0.3, 0.3].forEach(x => {
      add('b', 'w', x, 0.1, 0, 0.26, 0.62, 0.34);
      add('b', 'wd', x, 0.1, 0, 0.3, 0.07, 0.38);
      k.win(x, 0.42, 0.17, 0.07, 0.12, 'f');
      k.lamp(x, 0.3, 0.2, 0.06);
    });
    add('b', 'w', 0, 0.56, 0, 0.6, 0.2, 0.3);
    add('arch', 'stoneD', 0, 0.4, 0.14, 0.36, 0.18, 0.08);
    add('b', 'wd', 0, 0.74, 0, 0.9, 0.05, 0.4);
    add('roof', 'm', 0, 0.79, 0, 0.46, 0.26, 0.98, 0, Math.PI / 2);
    add('b', 'stone', 0, 0.1, 0, 0.3, 0.012, 0.9);
    k.flag(0, 1.05, 0, 0.3);
    k.banner(0, 0.56, 0.15, 0.12, 0.14, 'f');
  } else if (tier === 3) {
    k.base(p, { top: 'stoneD' });
    add('b', 'stoneD', 0, 0.1, 0.05, 1.0, 0.06, 0.95);
    k.house(0, 0.16, -0.08, 0.86, 0.62, 0.6, { roof: 'hip', roofH: 0.36 });
    k.arcade(0, 0.16, 0.36, 0.86, 0.42, 3, 'f');
    add('b', 'm', 0, 0.61, 0.3, 0.92, 0.04, 0.2);
    k.door(0, 0.16, 0.22, 0.17, 0.3, 'f');
    [-0.28, 0.28].forEach(x => k.win(x, 0.3, 0.22, 0.1, 0.16, 'f', { arch: true }));
    [-0.15, 0.15].forEach(z => k.win(0.43, 0.38, -0.08 + z, 0.1, 0.18, 'r', { arch: true }));
    add('c8', 'w', 0, 1.0, -0.08, 0.2, 0.16, 0.2);
    k.lamp(0, 1.02, -0.08, 0.13, { shape: 'c8' }).scale.set(0.15, 0.1, 0.15);
    add('p8', 'a', 0, 1.16, -0.08, 0.28, 0.2, 0.28);
    k.flag(0, 1.34, -0.08, 0.26);
    k.steps(0, 0.1, 0.52, 0.4, 2, 0.03, 0.06, 'f');
  } else if (tier === 4) {
    k.base(p, { top: 'stoneD' });
    k.house(-0.14, 0.1, -0.05, 0.84, 0.56, 0.7, { roofH: 0.32, axis: 'x' });
    k.door(-0.2, 0.1, 0.3, 0.17, 0.3, 'f');
    [-0.44, 0.02].forEach(x => k.win(x, 0.26, 0.3, 0.1, 0.17, 'f', { arch: true }));
    // clock tower
    add('b', 'w', 0.32, 0.1, 0.2, 0.42, 1.55, 0.42);
    add('b', 'wd', 0.32, 0.1, 0.2, 0.46, 0.09, 0.46);
    add('b', 'wd', 0.32, 1.0, 0.2, 0.46, 0.05, 0.46);
    add('b', 'wd', 0.32, 1.6, 0.2, 0.5, 0.06, 0.5);
    k.win(0.32, 0.3, 0.41, 0.1, 0.2, 'f', { arch: true });
    k.win(0.53, 0.62, 0.2, 0.08, 0.16, 'r', { arch: true });
    [['f', 0.32, 0.42], ['r', 0.54, 0.2]].forEach(c => {
      const ry = c[0] === 'f' ? 0 : Math.PI / 2;
      k.addC('c16', 'd', c[1], 1.3, c[2], 0.32, 0.03, 0.32, Math.PI / 2, ry);
      k.addC('c16', 'win', c[1] + (c[0] === 'r' ? 0.012 : 0), 1.3, c[2] + (c[0] === 'f' ? 0.012 : 0), 0.26, 0.03, 0.26, Math.PI / 2, ry);
      k.addC('b', 'iron', c[1] + (c[0] === 'r' ? 0.03 : 0), 1.335, c[2] + (c[0] === 'f' ? 0.03 : 0), 0.015, 0.09, 0.015);
      k.addC('b', 'iron', c[1] + (c[0] === 'r' ? 0.03 : 0.03), 1.3, c[2] + (c[0] === 'f' ? 0.03 : 0.03), c[0] === 'f' ? 0.07 : 0.015, 0.015, c[0] === 'f' ? 0.015 : 0.07);
    });
    add('hip', 'm', 0.32, 1.66, 0.2, 0.54, 0.5, 0.54);
    k.lamp(0.32, 2.14, 0.2, 0.09);
    k.flag(-0.4, 0.98, -0.05, 0.28);
    k.lantern(-0.5, 0.1, 0.5, 0.36);
  } else if (tier === 5) {
    k.base(p, { top: 'stoneD' });
    add('c16', 'w', 0, 0.1, 0, 1.06, 0.72, 1.06);
    add('c16', 'wd', 0, 0.1, 0, 1.1, 0.08, 1.1);
    add('c16', 'wd', 0, 0.8, 0, 1.12, 0.05, 1.12);
    crenels(0, 0.85, 0, 0.52, 14);
    k.door(0, 0.1, 0.53, 0.2, 0.36, 'f');
    k.banner(0.3, 0.42, 0.44, 0.12, 0.24, 'f');
    k.banner(-0.3, 0.42, 0.44, 0.12, 0.24, 'f');
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
      const x = c[0] * 0.44, z = c[1] * 0.44;
      add('c8', 'w', x, 0.1, z, 0.26, 1.15, 0.26);
      add('flare', 'wd', x, 1.2, z, 0.32, 0.08, 0.32);
      add('p8', 'm', x, 1.28, z, 0.36, 0.36, 0.36);
      k.win(x + (c[0] > 0 ? 0.13 : 0), 0.9, z + (c[0] > 0 ? 0 : 0.13), 0.06, 0.12, c[0] > 0 ? 'r' : 'f');
    });
    add('c16', 'w', 0, 0.82, 0, 0.5, 1.0, 0.5);
    add('flare', 'wd', 0, 1.76, 0, 0.64, 0.1, 0.64);
    crenels(0, 1.86, 0, 0.29, 8);
    add('c8', 'a', 0, 1.86, 0, 0.3, 0.22, 0.3);
    k.lamp(0, 1.9, 0, 0.2, { shape: 'c8' }).scale.set(0.34, 0.14, 0.34);
    add('p16', 'm', 0, 2.08, 0, 0.46, 0.44, 0.46);
    k.flag(0, 2.5, 0, 0.26);
    [0.3, 0.9].forEach(a => k.win(Math.sin(a) * 0.25, 1.2, Math.cos(a) * 0.25, 0.07, 0.16, 'f'));
  } else {
    k.base(p, { top: 'grass', rocks: 9 });
    // the crag
    const top = k.crag(0, 0.1, -0.05, 1.3, 0.72, 1.2, { taper: 0.2, cap: 'stoneD', boulders: 6 });
    k.fall(0.3, top - 0.04, 0.6, 0.2, 0.12, 'f');
    k.pool(0.3, 0.1, 0.7, 0.34, 0.2);
    add('b', 'water', 0.3, top - 0.05, 0.5, 0.2, 0.03, 0.22);
    add('b', 'rockD', 0.3, top - 0.3, 0.52, 0.3, 0.26, 0.14);
    k.steps(-0.3, 0.1, 0.48, 0.3, 6, 0.12, 0.07, 'f', 'stone');
    // bastion
    add('c16', 'w', 0, top, -0.05, 0.98, 0.3, 0.98);
    add('c16', 'wd', 0, top + 0.3, -0.05, 1.04, 0.05, 1.04);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      add('b', 'w', Math.cos(a) * 0.48, top + 0.35, -0.05 + Math.sin(a) * 0.48, 0.09, 0.08, 0.07, 0, -a + Math.PI / 2);
    }
    k.door(0, top, 0.44, 0.18, 0.22, 'f');
    k.banner(0.34, top + 0.04, 0.3, 0.1, 0.2, 'f');
    k.banner(-0.34, top + 0.04, 0.3, 0.1, 0.2, 'f');
    // lighthouse tower
    const ty = top + 0.3;
    add('taper16', 'w', 0, ty, -0.05, 0.62, 1.45, 0.62);
    add('taper16', 'm', 0, ty + 0.42, -0.05, 0.575, 0.2, 0.575);
    add('taper16', 'm', 0, ty + 0.98, -0.05, 0.515, 0.18, 0.515);
    [0.2, 0.74, 1.22].forEach((h, i) => k.win(0.0, ty + h, 0.24 - i * 0.03, 0.07, 0.14, 'f', { arch: true }));
    add('flare', 'wd', 0, ty + 1.45, -0.05, 0.72, 0.1, 0.72);
    add('c16', 'd', 0, ty + 1.55, -0.05, 0.74, 0.03, 0.74);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      add('b', 'iron', Math.cos(a) * 0.35, ty + 1.58, -0.05 + Math.sin(a) * 0.35, 0.02, 0.1, 0.02);
    }
    k.addC('t05', 'iron', 0, ty + 1.69, -0.05, 0.7, 0.7, 0.4, Math.PI / 2);
    // lantern room
    add('c8', 'glass', 0, ty + 1.58, -0.05, 0.4, 0.34, 0.4);
    k.lamp(0, ty + 1.63, -0.05, 0.22);
    add('c8', 'd', 0, ty + 1.92, -0.05, 0.46, 0.04, 0.46);
    add('p8', 'm', 0, ty + 1.96, -0.05, 0.5, 0.34, 0.5);
    k.lamp(0, ty + 2.3, -0.05, 0.07, { anim: false });
    // sweeping beam
    const beam = k.sub(0, ty + 1.75, -0.05, 'spin');
    beam.group.userData.speed = 0.6;
    beam.addC('p16', 'beam', 0.62, 0, 0, 0.3, 1.0, 0.3, 0, 0, Math.PI / 2).castShadow = false;
    beam.addC('p16', 'beam', -0.62, 0, 0, 0.3, 1.0, 0.3, 0, 0, -Math.PI / 2).castShadow = false;
    k.flag(0.42, top + 0.38, -0.3, 0.3);
    k.flag(-0.42, top + 0.38, -0.3, 0.3);
    k.tree(-0.62, 0.1, 0.42, 0.6);
    k.lantern(0.62, 0.1, 0.5, 0.34);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
