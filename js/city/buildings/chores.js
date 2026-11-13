/* Chores — the working riverbank: woodshed → wash-house → watermill → sluice mill → forge → great waterworks */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.chores = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'chores' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  // washing line with swaying cloths between two points at the same height
  function washLine(x1, x2, y, z, n) {
    add('b', 'rope', (x1 + x2) / 2, y, z, Math.abs(x2 - x1), 0.012, 0.012);
    const cols = ['white', 'a', 'l', 'm'];
    for (let i = 0; i < n; i++) {
      const c = k.sub(x1 + ((i + 0.5) / n) * (x2 - x1), y, z, 'sway');
      c.group.userData.amp = 0.14;
      c.add('b', cols[i % cols.length], 0, -0.13, 0, 0.075, 0.13, 0.012);
    }
  }
  function logPile(x, y, z, n) {
    for (let i = 0; i < n; i++) {
      k.addC('c8', i % 2 ? 'wood' : 'woodD', x + (i % 3) * 0.07 - 0.07 + Math.floor(i / 3) * 0.035, y + 0.035 + Math.floor(i / 3) * 0.058, z, 0.065, 0.28, 0.065, Math.PI / 2);
    }
  }
  // stone-lined mill race running along z under a wheel
  function race(x, z, len, w) {
    add('b', 'stoneD', x, 0.06, z, w + 0.1, 0.07, len);
    k.pool(x, 0.115, z, w, len);
  }

  if (tier === 1) {
    k.base(p, { top: 'grass' });
    add('b', 'wood', -0.2, 0.1, -0.12, 0.4, 0.3, 0.34);
    add('wedge', 'm', -0.2, 0.4, -0.12, 0.5, 0.15, 0.44);
    add('b', 'woodD', -0.2, 0.1, 0.055, 0.14, 0.22, 0.02);
    logPile(0.2, 0.1, -0.2, 6);
    add('c8', 'woodD', -0.05, 0.1, 0.3, 0.03, 0.42, 0.03);
    add('c8', 'woodD', 0.38, 0.1, 0.3, 0.03, 0.42, 0.03);
    washLine(-0.05, 0.38, 0.5, 0.3, 3);
    add('c8', 'wood', -0.3, 0.1, 0.3, 0.09, 0.08, 0.09);
    add('c8', 'water', -0.3, 0.17, 0.3, 0.07, 0.015, 0.07);
    k.lamp(-0.2, 0.2, 0.07, 0.05);
  } else if (tier === 2) {
    k.base(p, { top: 'grass' });
    k.house(-0.18, 0.1, -0.1, 0.52, 0.38, 0.5, { roofH: 0.26 });
    k.door(-0.18, 0.1, 0.15, 0.13, 0.24, 'f');
    k.win(0.08, 0.24, -0.1, 0.13, 0.12, 'r');
    add('b', 'stoneD', 0.34, 0.06, 0.1, 0.42, 0.06, 0.7);
    k.pool(0.34, 0.105, 0.1, 0.34, 0.62);
    k.deck(0.3, 0.2, 0.3, 0.3, 0.34, 0.1);
    add('c8', 'woodD', -0.42, 0.1, 0.38, 0.03, 0.42, 0.03);
    add('c8', 'woodD', 0.12, 0.1, 0.38, 0.03, 0.42, 0.03);
    washLine(-0.42, 0.12, 0.5, 0.38, 4);
    k.barrel(0.3, 0.2, 0.22, 0.1);
    add('b', 'stone', -0.3, 0.38, -0.25, 0.1, 0.4, 0.1);
  } else if (tier === 3) {
    k.base(p, { top: 'grass' });
    k.house(-0.2, 0.1, 0, 0.6, 0.55, 0.62, { roofH: 0.34 });
    k.door(-0.2, 0.1, 0.31, 0.15, 0.28, 'f');
    k.win(-0.2, 0.42, 0.31, 0.12, 0.12, 'f');
    k.win(-0.5, 0.3, 0, 0.12, 0.14, 'l');
    add('b', 'stone', -0.38, 0.5, -0.18, 0.11, 0.5, 0.11);
    race(0.33, 0, 1.15, 0.2);
    add('b', 'woodD', 0.2, 0.38, 0, 0.2, 0.05, 0.05);
    k.wheel(0.33, 0.42, 0, 0.6, 0.15, 'x');
    k.barrel(-0.05, 0.1, 0.45, 0.1);
    k.lantern(-0.48, 0.1, 0.42, 0.34);
  } else if (tier === 4) {
    k.base(p, { top: 'grass' });
    k.house(-0.22, 0.1, 0, 0.66, 0.82, 0.7, { roofH: 0.38 });
    add('b', 'woodD', -0.22, 0.5, 0, 0.69, 0.04, 0.73);
    k.door(-0.22, 0.1, 0.35, 0.16, 0.3, 'f');
    [-0.36, -0.08].forEach(x => k.win(x, 0.62, 0.35, 0.11, 0.15, 'f'));
    k.win(-0.55, 0.62, 0, 0.12, 0.15, 'l');
    add('b', 'stone', -0.42, 0.8, -0.2, 0.12, 0.6, 0.12);
    race(0.38, 0, 1.3, 0.22);
    add('b', 'woodD', 0.24, 0.5, 0, 0.26, 0.06, 0.06);
    k.wheel(0.38, 0.54, 0, 0.82, 0.18, 'x');
    // timber flume on trestles bringing water over the top of the wheel
    add('b', 'wood', 0.38, 0.98, -0.4, 0.2, 0.03, 0.62);
    [-1, 1].forEach(s => add('b', 'woodD', 0.38 + s * 0.1, 0.98, -0.4, 0.025, 0.08, 0.62));
    add('b', 'water', 0.38, 1.01, -0.4, 0.17, 0.025, 0.6);
    [-0.62, -0.3].forEach(z => [-1, 1].forEach(s => add('c8', 'woodD', 0.38 + s * 0.13, 0.1, z, 0.04, 0.9, 0.04)));
    k.fall(0.38, 1.0, -0.08, 0.14, 0.9, 'f');
    k.crate(-0.02, 0.1, 0.5, 0.12);
    k.crate(0.1, 0.1, 0.46, 0.09, 'a');
    k.lantern(-0.55, 0.1, 0.5, 0.36);
  } else if (tier === 5) {
    k.base(p, { top: 'stoneD' });
    k.house(-0.2, 0.1, -0.08, 0.8, 0.7, 0.78, { roofH: 0.36, axis: 'x' });
    // forge mouth and chimney
    add('b', 'rockD', -0.2, 0.1, 0.32, 0.3, 0.3, 0.04);
    k.lamp(-0.2, 0.14, 0.33, 0.16, { shape: 'b', mat: 'g' }).scale.set(0.22, 0.2, 0.03);
    [-0.45, 0.05].forEach(x => k.win(x, 0.5, 0.31, 0.11, 0.14, 'f'));
    add('taper', 'stoneD', -0.48, 0.1, -0.32, 0.26, 1.35, 0.26);
    add('c8', 'rockD', -0.48, 1.45, -0.32, 0.2, 0.06, 0.2);
    k.lamp(-0.48, 1.47, -0.32, 0.12);
    // quay with a crane
    add('b', 'stoneD', 0.44, 0.06, 0.1, 0.34, 0.07, 1.1);
    add('c8', 'woodD', 0.44, 0.13, 0.36, 0.07, 0.95, 0.07);
    add('b', 'woodD', 0.3, 1.02, 0.36, 0.62, 0.05, 0.05, 0, 0, 0.18);
    add('b', 'woodD', 0.36, 0.78, 0.36, 0.3, 0.035, 0.035, 0, 0, 0.9);
    add('b', 'rope', 0.03, 0.62, 0.36, 0.012, 0.36, 0.012);
    const hook = k.sub(0.03, 0.5, 0.36, 'float');
    hook.group.userData.amp = 0.05; hook.group.userData.speed = 1.1;
    hook.add('b', 'wood', 0, 0, 0, 0.13, 0.12, 0.13);
    hook.add('b', 'a', 0, 0.12, 0, 0.135, 0.02, 0.135);
    race(0.44, -0.45, 0.4, 0.2);
    k.wheel(0.44, 0.4, -0.45, 0.52, 0.14, 'x');
    k.barrel(0.42, 0.13, 0.02, 0.11);
    k.crate(0.46, 0.13, 0.55, 0.11, 'a');
    k.banner(0.2, 0.5, -0.08, 0.14, 0.24, 'r');
  } else {
    k.base(p, { top: 'stoneD' });
    // main works hall with a lantern roof
    k.house(-0.25, 0.1, 0.02, 0.86, 0.95, 0.9, { roofH: 0.4, axis: 'x' });
    add('b', 'w', -0.25, 1.32, 0.02, 0.4, 0.14, 0.3);
    add('roof', 'm', -0.25, 1.46, 0.02, 0.38, 0.14, 0.5, 0, Math.PI / 2);
    k.lamp(-0.25, 1.35, 0.175, 0.1, { shape: 'b', mat: 'win', anim: false }).scale.set(0.3, 0.07, 0.02);
    add('b', 'woodD', -0.25, 0.55, 0.02, 0.89, 0.04, 0.93);
    k.door(-0.25, 0.1, 0.47, 0.22, 0.36, 'f');
    [-0.52, 0.02].forEach(x => { k.win(x, 0.22, 0.47, 0.11, 0.16, 'f'); });
    [-0.52, -0.25, 0.02].forEach(x => k.win(x, 0.68, 0.47, 0.11, 0.17, 'f', { arch: true }));
    k.banner(-0.25, 0.42, 0.47, 0.12, 0.08, 'f');
    // tall chimney
    add('taper', 'stoneD', -0.56, 0.1, -0.36, 0.3, 1.95, 0.3);
    add('c8', 'd', -0.56, 1.55, -0.36, 0.26, 0.07, 0.26);
    add('c8', 'rockD', -0.56, 2.05, -0.36, 0.22, 0.07, 0.22);
    k.lamp(-0.56, 2.08, -0.36, 0.14);
    // great wheel in its race
    race(0.42, 0.08, 1.5, 0.26);
    add('b', 'woodD', 0.26, 0.62, 0.08, 0.3, 0.07, 0.07);
    add('b', 'stoneD', 0.6, 0.1, 0.08, 0.08, 0.56, 0.16);
    k.wheel(0.42, 0.68, 0.08, 1.08, 0.22, 'x', { speed: 0.5 });
    // stone aqueduct carrying the feed in from behind
    k.arcade(0.42, 0.1, -0.52, 0.5, 1.06, 2, 'r', { mat: 'stone' });
    add('b', 'stone', 0.42, 1.2, -0.42, 0.24, 0.05, 0.74);
    [-1, 1].forEach(s => add('b', 'stoneD', 0.42 + s * 0.12, 1.25, -0.42, 0.03, 0.06, 0.74));
    add('b', 'water', 0.42, 1.25, -0.42, 0.2, 0.03, 0.72);
    k.fall(0.42, 1.25, -0.04, 0.16, 1.18, 'f');
    // cargo hoist on the front quay
    add('b', 'woodD', 0.15, 0.1, 0.56, 0.05, 0.9, 0.05);
    add('b', 'woodD', 0.3, 0.97, 0.56, 0.42, 0.045, 0.045);
    add('b', 'rope', 0.46, 0.7, 0.56, 0.012, 0.28, 0.012);
    const lift = k.sub(0.46, 0.5, 0.56, 'float');
    lift.group.userData.amp = 0.08; lift.group.userData.speed = 0.9;
    lift.add('b', 'wood', 0, 0, 0, 0.16, 0.14, 0.16);
    lift.add('b', 'a', 0, 0.14, 0, 0.165, 0.02, 0.165);
    k.crate(-0.02, 0.1, 0.6, 0.12);
    k.barrel(-0.55, 0.1, 0.56, 0.11);
    k.lantern(-0.68, 0.1, 0.3, 0.4);
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
