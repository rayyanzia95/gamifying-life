/* Deen — the masjid above the river: musalla → small masjid → twin minarets → courtyard masjid → grand masjid → the jamia */
window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.deen = function (tier, palette) {
  const group = new THREE.Group();
  const k = window.CityUtils.kit(group, palette, 'deen' + tier);
  const add = k.add;
  const p = 0.8 + tier * 0.1;

  function minaret(x, y, z, h, r, o) {
    o = o || {};
    add('c8', 'wd', x, y, z, r * 1.7, 0.1, r * 1.7);
    add('c8', 'w', x, y, z, r, h, r);
    const bal = o.balconies || [0.7];
    bal.forEach(t => {
      add('flare', 'wd', x, y + h * t, z, r * 2.0, 0.06, r * 2.0);
      add('c8', 'stone', x, y + h * t + 0.06, z, r * 2.1, 0.04, r * 2.1);
    });
    add('c8', 'win', x, y + h, z, r * 0.85, 0.1, r * 0.85);
    add('c8', 'wd', x, y + h + 0.1, z, r * 1.25, 0.025, r * 1.25);
    add('dome', 'm', x, y + h + 0.125, z, r * 1.15, r * 1.5, r * 1.15);
    k.crescent(x, y + h + 0.125 + r * 1.45, z, o.fin || 0.45);
  }
  function dome(x, y, z, d, h, o) {
    o = o || {};
    add('c16', 'w', x, y, z, d * 1.0, o.drum || 0.08, d * 1.0);
    add('c16', 'wd', x, y + (o.drum || 0.08), z, d * 1.06, 0.025, d * 1.06);
    add('dome', 'm', x, y + (o.drum || 0.08) + 0.025, z, d, h, d);
    if (o.fin) k.crescent(x, y + (o.drum || 0.08) + h - 0.01, z, o.fin);
    return y + (o.drum || 0.08) + h;
  }
  function hall(x, y, z, w, h, d) {
    add('b', 'w', x, y, z, w, h, d);
    add('b', 'wd', x, y, z, w + 0.05, 0.07, d + 0.05);
    add('b', 'wd', x, y + h, z, w + 0.07, 0.04, d + 0.07);
    add('b', 'w', x, y + h + 0.04, z, w + 0.02, 0.05, d + 0.02);
    add('b', 'stoneD', x, y + h + 0.04, z, w - 0.08, 0.052, d - 0.08);
    return y + h + 0.04;
  }
  // tall pointed-arch portal standing proud of the front wall
  function iwan(x, y, z, w, h) {
    add('b', 'w', x, y, z, w, h, 0.12);
    add('b', 'wd', x, y + h, z, w + 0.05, 0.04, 0.16);
    add('b', 'm', x, y + 0.02, z + 0.05, w * 0.62, h * 0.62, 0.03);
    add('c16', 'm', x, y + h * 0.64 - w * 0.31, z + 0.05, w * 0.62, 0.03, w * 0.62, Math.PI / 2);
    k.door(x, y, z + 0.065, w * 0.34, h * 0.42, 'f');
    k.lamp(x, y + h * 0.62, z + 0.08, 0.06, { anim: 'float' });
  }
  function fountain(x, y, z, d) {
    add('c8', 'stone', x, y, z, d, 0.08, d, 0, Math.PI / 8);
    add('c8', 'water', x, y + 0.065, z, d * 0.82, 0.03, d * 0.82, 0, Math.PI / 8);
    add('c8', 'stone', x, y, z, d * 0.16, 0.2, d * 0.16);
    add('c8', 'stone', x, y + 0.2, z, d * 0.4, 0.025, d * 0.4);
    const j = add('rock2', 'foam', x, y + 0.23, z, 0.07, 0.07, 0.07);
    j.castShadow = false; j.userData.anim = 'float'; j.userData.amp = 0.015; j.userData.speed = 4;
  }
  function archWindows(x, y, z, len, n, face, w, h) {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n * len - len / 2;
      k.win(x + (face === 'r' ? 0 : t), y, z + (face === 'r' ? t : 0), w, h, face, { arch: true });
    }
  }

  if (tier === 1) {
    k.base(p, { top: 'grass' });
    add('b', 'stone', 0, 0.1, 0, 0.72, 0.07, 0.64);
    add('b', 'stoneD', 0, 0.1, 0.34, 0.3, 0.035, 0.08);
    // qibla wall with mihrab niche
    add('b', 'w', 0, 0.17, -0.26, 0.56, 0.46, 0.1);
    add('b', 'w', 0, 0.63, -0.26, 0.26, 0.1, 0.1);
    add('b', 'wd', 0, 0.17, -0.205, 0.2, 0.3, 0.02);
    add('c16', 'wd', 0, 0.37, -0.205, 0.2, 0.02, 0.2, Math.PI / 2);
    add('dome', 'm', 0, 0.73, -0.26, 0.2, 0.16, 0.12);
    k.crescent(0, 0.87, -0.26, 0.4);
    // prayer rug
    add('b', 'm', 0, 0.17, 0.02, 0.24, 0.012, 0.38);
    add('b', 'a', 0, 0.172, 0.02, 0.17, 0.012, 0.3);
    add('b', 'l', 0, 0.174, -0.06, 0.08, 0.012, 0.1);
    // wudu basin
    add('c8', 'stone', 0.44, 0.1, 0.24, 0.2, 0.12, 0.2);
    add('c8', 'water', 0.44, 0.2, 0.24, 0.15, 0.03, 0.15);
    k.lantern(-0.28, 0.17, 0.22, 0.26);
    k.tree(-0.46, 0.1, -0.2, 0.7, 'cypress');
  } else if (tier === 2) {
    k.base(p, { top: 'stoneD' });
    const top = hall(0.06, 0.1, 0.02, 0.62, 0.44, 0.62);
    dome(0.06, top, 0.02, 0.44, 0.32, { fin: 0.55 });
    minaret(-0.38, 0.1, -0.34, 0.9, 0.14);
    k.door(0.06, 0.1, 0.33, 0.15, 0.28, 'f');
    archWindows(0.37, 0.22, 0.02, 0.5, 2, 'r', 0.09, 0.18);
    [-0.14, 0.26].forEach(x => k.win(x, 0.24, 0.33, 0.07, 0.15, 'f', { arch: true }));
    k.lantern(-0.46, 0.1, 0.42, 0.3);
    k.tree(0.5, 0.1, -0.36, 0.7, 'cypress');
  } else if (tier === 3) {
    k.base(p, { top: 'stoneD' });
    const top = hall(0, 0.1, 0, 0.78, 0.5, 0.74);
    dome(0, top, 0, 0.54, 0.38, { drum: 0.12, fin: 0.6 });
    [-0.42, 0.42].forEach(x => minaret(x, 0.1, -0.4, 1.15, 0.14));
    k.arcade(0, 0.1, 0.42, 0.74, 0.42, 3, 'f', { fill: 'win' });
    add('b', 'w', 0, 0.1, 0.375, 0.78, 0.46, 0.02);
    k.door(0, 0.1, 0.4, 0.14, 0.26, 'f');
    archWindows(0.39, 0.22, 0, 0.6, 3, 'r', 0.08, 0.2);
    k.tree(0.56, 0.1, 0.46, 0.7, 'cypress');
  } else if (tier === 4) {
    k.base(p, { top: 'stoneD' });
    const top = hall(0, 0.1, -0.2, 0.86, 0.56, 0.6);
    dome(0, top, -0.2, 0.52, 0.38, { drum: 0.12, fin: 0.6 });
    [-0.3, 0.3].forEach(x => dome(x, top, 0.0, 0.2, 0.15, { drum: 0.04 }));
    [-0.48, 0.48].forEach(x => minaret(x, 0.1, -0.5, 1.4, 0.14, { balconies: [0.55, 0.82] }));
    iwan(0, 0.1, 0.12, 0.3, 0.7);
    [-0.28, 0.28].forEach(x => k.win(x, 0.24, 0.1, 0.08, 0.2, 'f', { arch: true }));
    archWindows(0.43, 0.24, -0.2, 0.5, 2, 'r', 0.08, 0.2);
    // courtyard with ablution fountain
    add('b', 'stone', 0, 0.1, 0.36, 1.0, 0.02, 0.5);
    [-0.5, 0.5].forEach(x => add('b', 'w', x, 0.1, 0.36, 0.06, 0.18, 0.5));
    [-0.32, 0.32].forEach(x => add('b', 'w', x, 0.1, 0.6, 0.36, 0.18, 0.06));
    [-0.5, 0.5].forEach(x => { add('b', 'w', x, 0.1, 0.6, 0.1, 0.26, 0.1); k.lamp(x, 0.37, 0.6, 0.07); });
    fountain(0, 0.12, 0.38, 0.3);
    [-0.34, 0.34].forEach(x => k.tree(x, 0.12, 0.42, 0.55, 'cypress'));
  } else if (tier === 5) {
    k.base(p, { top: 'stoneD' });
    add('b', 'stone', 0, 0.1, 0, 1.24, 0.07, 1.16);
    k.steps(0, 0.1, 0.58, 0.44, 2, 0.035, 0.06, 'f', 'stone');
    const top = hall(0, 0.17, -0.12, 0.96, 0.6, 0.72);
    dome(0, top, -0.12, 0.66, 0.5, { drum: 0.16, fin: 0.7 });
    k.addC('t05', 'a', 0, top + 0.2, -0.12, 0.69, 0.69, 0.5, Math.PI / 2);
    [[-0.34, -0.36], [0.34, -0.36], [-0.34, 0.1], [0.34, 0.1]].forEach(c => dome(c[0], top, c[1], 0.2, 0.16, { drum: 0.04 }));
    [-0.54, 0.54].forEach(x => minaret(x, 0.17, 0.32, 1.85, 0.15, { balconies: [0.45, 0.76], fin: 0.5 }));
    iwan(0, 0.17, 0.27, 0.36, 0.86);
    [-0.32, 0.32].forEach(x => k.win(x, 0.32, 0.24, 0.09, 0.24, 'f', { arch: true }));
    archWindows(0.48, 0.32, -0.12, 0.62, 3, 'r', 0.08, 0.24);
    fountain(0.36, 0.17, 0.48, 0.2);
    k.tree(-0.36, 0.17, 0.48, 0.6, 'cypress');
    k.lantern(-0.56, 0.17, -0.44, 0.36);
  } else {
    k.base(p, { top: 'stoneD' });
    add('b', 'stoneD', 0, 0.1, 0, 1.4, 0.06, 1.34);
    add('b', 'stone', 0, 0.16, -0.04, 1.28, 0.06, 1.18);
    k.steps(0, 0.1, 0.62, 0.5, 2, 0.06, 0.07, 'f', 'stone');
    const y0 = 0.22;
    const top = hall(0, y0, -0.16, 1.02, 0.68, 0.84);
    // lit arcades on the two visible sides
    k.arcade(0.53, y0, -0.16, 0.8, 0.5, 4, 'r', { fill: 'win' });
    [-0.39, 0.39].forEach(x => k.arcade(x, y0, 0.27, 0.24, 0.5, 1, 'f', { fill: 'win' }));
    // drum with a ring of windows, and the great dome
    add('c16', 'w', 0, top, -0.16, 0.8, 0.2, 0.8);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add('b', 'win', Math.cos(a) * 0.4, top + 0.05, -0.16 + Math.sin(a) * 0.4, 0.07, 0.11, 0.02, 0, -a + Math.PI / 2); }
    add('c16', 'wd', 0, top + 0.2, -0.16, 0.86, 0.03, 0.86);
    add('dome', 'm', 0, top + 0.23, -0.16, 0.8, 0.62, 0.8);
    k.addC('t05', 'a', 0, top + 0.27, -0.16, 0.84, 0.84, 0.5, Math.PI / 2);
    k.crescent(0, top + 0.83, -0.16, 0.9);
    [[-0.38, -0.44], [0.38, -0.44], [-0.38, 0.12], [0.38, 0.12]].forEach(c => dome(c[0], top, c[1], 0.22, 0.18, { drum: 0.05 }));
    // four minarets
    [[-0.58, -0.56], [0.58, -0.56], [-0.58, 0.44], [0.58, 0.44]].forEach(c =>
      minaret(c[0], 0.22, c[1], 2.15, 0.15, { balconies: [0.4, 0.66, 0.86], fin: 0.5 }));
    iwan(0, y0, 0.3, 0.42, 1.0);
    // reflecting pool
    add('b', 'stone', 0.34, 0.16, 0.5, 0.36, 0.085, 0.26);
    add('b', 'water', 0.34, 0.235, 0.5, 0.3, 0.03, 0.2);
    add('b', 'stone', -0.34, 0.16, 0.5, 0.36, 0.085, 0.26);
    add('b', 'water', -0.34, 0.235, 0.5, 0.3, 0.03, 0.2);
    [-0.66, 0.66].forEach(x => k.tree(x, 0.1, 0.0, 0.8, 'cypress'));
  }

  window.CityUtils.finishBuilding(group);
  return group;
};
