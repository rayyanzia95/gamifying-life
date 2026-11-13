/* Props — the pieces that turn a row of buildings into a river city.
 *
 * Original five, same names and footprints:
 *   bridge (1.2 x 3, runs along z)   cliffEdge (2 x 2)   stairs (1 x 1, climbs 1.0 toward +z)
 *   park (2 x 2)                     pool (1.5 x 1.5)
 * New:
 *   river (2 x 2 tile, flows along z; optional 2nd argument { banks: 'both' | 'left' | 'right' | 'none' })
 *   waterfall (2 x 2, 2.2 tall)      terrace (2 x 2 x 1.0 cliff block — stack them to make levels)
 *   dock (2 x 2)                     boat      ropeBridge (1 x 3, along z)
 *   lampPost                         trees
 */
window.CityProps = window.CityProps || {};

(function () {
  const U = window.CityUtils;
  function start(palette, seed) {
    const group = new THREE.Group();
    const k = U.kit(group, palette, seed);
    return { group, k, add: k.add };
  }
  function done(group) { U.finishBuilding(group); return group; }

  function rope(k, group, a, b, n, sag) {
    const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]);
    let prev = A.clone();
    for (let i = 1; i <= n; i++) {
      const t = i / n, p = A.clone().lerp(B, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      const seg = new THREE.Mesh(k.geos.b, k.mats.rope);
      seg.position.copy(prev).lerp(p, 0.5);
      seg.scale.set(0.02, 0.02, prev.distanceTo(p));
      seg.lookAt(p);
      seg.castShadow = true;
      group.add(seg);
      prev = p;
    }
  }
  function reeds(k, x, y, z, n) {
    for (let i = 0; i < n; i++) k.add('b', i % 2 ? 'leaf' : 'leafD', x + (k.rand() - 0.5) * 0.14, y, z + (k.rand() - 0.5) * 0.14, 0.018, 0.16 + k.rand() * 0.14, 0.018, (k.rand() - 0.5) * 0.3, 0, (k.rand() - 0.5) * 0.3);
  }
  function lily(k, x, y, z, flower) {
    const g = k.sub(x, y, z, 'float'); g.group.userData.amp = 0.006;
    g.add('c8', 'leaf', 0, 0, 0, 0.14, 0.012, 0.14);
    if (flower) g.add('s8', 'a', 0.02, 0.012, 0, 0.05, 0.04, 0.05);
  }
  function foamPatch(k, x, y, z, s) {
    const f = k.add('rock2', 'foam', x, y, z, s, s * 0.5, s, k.rand() * 3, k.rand() * 3, 0);
    f.castShadow = false; f.userData.anim = 'float'; f.userData.amp = 0.012; f.userData.speed = 2.6;
  }

  window.CityProps.bridge = function (palette) {
    const { group, k, add } = start(palette, 'bridge');
    [-1.36, 1.36].forEach(z => add('b', 'stoneD', 0, 0, z, 1.24, 0.5, 0.28));
    add('b', 'stoneD', 0, 0, 0, 1.24, 0.5, 0.26);
    [-0.66, 0.66].forEach(x => add('c6', 'stoneD', x, 0, 0, 0.3, 0.34, 0.3));
    [-0.68, 0.68].forEach(z => add('arch', 'stone', 0, 0.1, z, 1.12, 0.44, 1.2, 0, Math.PI / 2));
    add('b', 'stone', 0, 0.5, 0, 1.2, 0.12, 3.0);
    add('b', 'stoneD', 0, 0.62, 0, 0.9, 0.012, 3.0);
    [-0.55, 0.55].forEach(x => {
      add('b', 'stone', x, 0.62, 0, 0.1, 0.15, 3.0);
      [-1.44, -0.72, 0, 0.72, 1.44].forEach(z => add('b', 'stoneD', x, 0.62, z, 0.14, 0.21, 0.14));
      [-0.72, 0.72].forEach(z => {
        add('c8', 'iron', x, 0.83, z, 0.03, 0.26, 0.03);
        k.lamp(x, 1.09, z, 0.09);
        add('hip', 'iron', x, 1.17, z, 0.13, 0.05, 0.13);
      });
    });
    return done(group);
  };

  window.CityProps.cliffEdge = function (palette) {
    const { group, k, add } = start(palette, 'cliffEdge');
    const top = k.crag(0, 0, 0, 1.9, 1.45, 1.9, { taper: 0.3, boulders: 7 });
    add('rock', 'rockL', 0.78, 0.3, 0.6, 0.6, 0.4, 0.7, 0.3, 0.5, 0);
    add('b', 'grass', 0.78, 0.66, 0.6, 0.34, 0.03, 0.4, 0, 0.5);
    k.lantern(0.8, 0.69, 0.62, 0.3);
    add('rock', 'rockD', -0.8, 0.5, -0.5, 0.5, 0.5, 0.6, 1, 0.2, 0);
    k.tree(-0.15, top, -0.2, 1.1);
    k.tree(0.3, top, 0.15, 0.7);
    k.bush(-0.4, top + 0.06, 0.3, 0.22);
    add('b', 'water', -0.2, top - 0.02, 0.5, 0.18, 0.03, 0.3);
    k.fall(-0.2, top, 0.72, 0.18, 0.05, 'f');
    return done(group);
  };

  window.CityProps.stairs = function (palette) {
    const { group, k, add } = start(palette, 'stairs');
    for (let i = 0; i < 10; i++) {
      add('b', i % 2 ? 'stone' : 'stoneD', 0, 0, i * 0.1 - 0.45, 0.8, (i + 1) * 0.1, 0.1);
    }
    [-0.46, 0.46].forEach(x => {
      for (let i = 0; i < 5; i++) add('b', i % 2 ? 'rock' : 'rockD', x, 0, i * 0.2 - 0.4, 0.14, (i + 1) * 0.2 - 0.06, 0.2);
      add('b', 'stoneD', x, 0, -0.5, 0.16, 0.3, 0.1);
      k.lamp(x, 0.3, -0.5, 0.09);
    });
    return done(group);
  };

  window.CityProps.park = function (palette) {
    const { group, k, add } = start(palette, 'park');
    add('b', 'rock', 0, 0, 0, 2.0, 0.13, 2.0);
    add('b', 'grass', 0, 0.13, 0, 1.9, 0.06, 1.9);
    add('b', 'sand', -0.1, 0.19, 0, 0.34, 0.012, 1.9);
    add('b', 'sand', 0.4, 0.19, 0.3, 0.9, 0.012, 0.26);
    // pond
    add('c16', 'stoneD', 0.5, 0.19, -0.45, 0.7, 0.04, 0.6);
    add('c16', 'water', 0.5, 0.215, -0.45, 0.58, 0.03, 0.48);
    lily(k, 0.42, 0.25, -0.5, true);
    lily(k, 0.62, 0.25, -0.38, false);
    reeds(k, 0.8, 0.19, -0.6, 5);
    k.tree(0.62, 0.19, 0.68, 1.3);
    k.tree(-0.62, 0.19, -0.5, 1.3, 'round');
    k.tree(-0.7, 0.19, 0.6, 1.0, 'cypress');
    k.tree(-0.5, 0.19, 0.74, 0.8, 'cypress');
    k.lantern(0.14, 0.19, 0.52, 0.5);
    // bench facing the pond
    add('b', 'wood', 0.5, 0.28, 0.08, 0.4, 0.025, 0.12);
    add('b', 'wood', 0.5, 0.33, 0.14, 0.4, 0.1, 0.02);
    [0.33, 0.67].forEach(x => add('b', 'iron', x, 0.19, 0.08, 0.025, 0.09, 0.11));
    [[-0.4, 0.1], [-0.52, -0.02], [-0.36, -0.14], [0.86, 0.1], [0.14, -0.8], [-0.3, 0.5]].forEach((q, i) => {
      add('s8', i % 2 ? 'a' : 'g', q[0], 0.2, q[1], 0.06, 0.06, 0.06);
    });
    k.bush(0.82, 0.24, -0.05, 0.2);
    k.bush(-0.84, 0.24, 0.1, 0.22);
    return done(group);
  };

  window.CityProps.pool = function (palette) {
    const { group, k, add } = start(palette, 'pool');
    add('c8', 'rockD', 0, 0, 0, 1.5, 0.14, 1.5, 0, Math.PI / 8);
    add('c16', 'water', 0, 0.12, 0, 1.18, 0.04, 1.18);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2, s = 0.2 + k.rand() * 0.14;
      add(i % 2 ? 'rock' : 'rock2', ['rock', 'rockL', 'rockD'][i % 3], Math.cos(a) * 0.64, -0.03, Math.sin(a) * 0.64, s, s * 0.8, s, k.rand() * 3, k.rand() * 3, 0);
    }
    const top = k.crag(-0.1, 0, -0.56, 0.6, 0.7, 0.4, { taper: 0.3, boulders: 2, cap: false });
    add('b', 'water', -0.1, top - 0.07, -0.46, 0.2, 0.03, 0.2);
    k.fall(-0.1, top - 0.05, -0.34, 0.2, 0.16, 'f');
    lily(k, 0.3, 0.16, 0.2, true);
    lily(k, 0.12, 0.16, 0.38, false);
    lily(k, -0.34, 0.16, 0.24, true);
    reeds(k, 0.5, 0.1, -0.3, 6);
    k.tree(0.5, 0.05, -0.56, 0.7, 'cypress');
    return done(group);
  };

  window.CityProps.river = function (palette, opts) {
    const { group, k, add } = start(palette, 'river');
    const banks = (opts && opts.banks) || 'both';
    add('b', 'rockD', 0, 0, 0, 2.0, 0.03, 2.0);
    const wet = banks === 'none' ? 2.0 : banks === 'both' ? 1.34 : 1.67;
    const cx = banks === 'left' ? 0.165 : banks === 'right' ? -0.165 : 0;
    const w = add('b', 'water', cx, 0.03, 0, wet, 0.06, 2.0);
    w.userData.anim = 'float'; w.userData.amp = 0.008;
    const sides = banks === 'both' ? [-1, 1] : banks === 'left' ? [-1] : banks === 'right' ? [1] : [];
    sides.forEach(s => {
      add('b', 'rock', s * 0.835, 0, 0, 0.33, 0.13, 2.0);
      add('b', 'grass', s * 0.86, 0.13, 0, 0.28, 0.04, 2.0);
      for (let i = 0; i < 4; i++) {
        const sz = 0.16 + k.rand() * 0.14;
        add('rock', i % 2 ? 'rockL' : 'rockD', s * (0.66 + k.rand() * 0.06), -0.02, -0.85 + i * 0.55 + k.rand() * 0.2, sz, sz * 0.8, sz, k.rand() * 3, k.rand() * 3, 0);
      }
      reeds(k, s * 0.7, 0.08, s * 0.5, 5);
    });
    add('rock', 'rock', 0.2, -0.04, -0.3, 0.26, 0.22, 0.24, 0.4, 1, 0);
    foamPatch(k, 0.2, 0.06, -0.12, 0.2);
    add('rock2', 'rockL', -0.3, -0.03, 0.5, 0.18, 0.16, 0.2, 1, 0.3, 0);
    foamPatch(k, -0.3, 0.06, 0.64, 0.16);
    [[0.0, 0.2], [-0.25, -0.6], [0.35, 0.75]].forEach(q => {
      const s = add('b', 'foam', q[0] + cx, 0.088, q[1], 0.03, 0.006, 0.3); s.castShadow = false;
    });
    return done(group);
  };

  window.CityProps.waterfall = function (palette) {
    const { group, k, add } = start(palette, 'waterfall');
    const top = k.crag(0, 0, -0.42, 2.0, 2.16, 1.1, { taper: 0.1, boulders: 6 });
    add('b', 'rockD', 0, 1.9, 0.06, 0.9, 0.3, 0.2);
    add('b', 'water', 0, top - 0.03, -0.3, 0.7, 0.04, 0.9);
    k.fall(0, top, 0.18, 0.7, 0.1, 'f');
    // plunge pool
    add('c8', 'rockD', 0, 0, 0.5, 1.7, 0.1, 1.0, 0, Math.PI / 8);
    add('c16', 'water', 0, 0.08, 0.5, 1.4, 0.05, 0.8);
    [-0.8, 0.8].forEach((x, i) => add('rock', i ? 'rockL' : 'rock', x, -0.04, 0.6, 0.4, 0.36, 0.4, i, 1, 2));
    add('rock2', 'rock', 0.3, 0.02, 0.86, 0.22, 0.18, 0.22, 1, 2, 0);
    foamPatch(k, -0.2, 0.12, 0.34, 0.26);
    foamPatch(k, 0.22, 0.12, 0.36, 0.22);
    // mist
    [[-0.1, 0.4], [0.2, 0.65], [0, 0.95]].forEach(q => {
      const s = add('rock2', 'foam', q[0], q[1], 0.36, 0.2, 0.14, 0.2, k.rand() * 3, k.rand() * 3, 0);
      s.castShadow = false; s.userData.anim = 'float'; s.userData.amp = 0.05; s.userData.speed = 0.8;
    });
    k.tree(-0.66, top, -0.5, 1.0);
    k.tree(0.7, top, -0.56, 0.8);
    k.bush(0.56, top + 0.06, -0.2, 0.22);
    k.lantern(-0.72, 0.0, 0.92, 0.36);
    return done(group);
  };

  window.CityProps.terrace = function (palette) {
    const { group, k, add } = start(palette, 'terrace');
    add('b', 'rock', 0, 0, 0, 2.0, 0.34, 2.0);
    add('b', 'rockD', 0, 0.34, 0, 1.95, 0.32, 1.95);
    add('b', 'rock', 0, 0.66, 0, 1.98, 0.27, 1.98);
    add('b', 'rockL', 0, 0.93, 0, 2.0, 0.03, 2.0);
    add('b', 'grass', 0, 0.96, 0, 2.0, 0.04, 2.0);
    // strata and buttresses on the two faces you normally see
    [[0.3, 0.2, 1.0, 0.7], [-0.5, 0.5, 1.0, 0.5], [0.6, 0.74, 1.0, 0.44]].forEach(q => add('b', 'rockL', q[0], q[1], q[2], q[3], 0.08, 0.06));
    [[1.0, 0.24, -0.2, 0.6], [1.0, 0.56, 0.4, 0.5], [1.0, 0.78, -0.5, 0.4]].forEach(q => add('b', 'rockL', q[0], q[1], q[2], 0.06, 0.08, q[3]));
    for (let i = 0; i < 5; i++) {
      const s = 0.2 + k.rand() * 0.16, onX = i % 2;
      add('rock', i % 2 ? 'rockD' : 'rockL', onX ? 0.98 : -0.8 + k.rand() * 1.6, -0.04, onX ? -0.8 + k.rand() * 1.6 : 0.98, s, s * 0.8, s, k.rand() * 3, k.rand() * 3, 0);
    }
    add('b', 'leafD', 0.5, 0.7, 1.01, 0.14, 0.3, 0.03);
    add('b', 'leaf', 0.42, 0.78, 1.015, 0.1, 0.22, 0.03);
    add('b', 'leafD', 1.01, 0.72, 0.6, 0.03, 0.28, 0.14);
    return done(group);
  };

  window.CityProps.dock = function (palette) {
    const { group, k, add } = start(palette, 'dock');
    add('b', 'rockD', 0, 0, 0, 2.0, 0.03, 2.0);
    const w = add('b', 'water', 0, 0.03, 0, 2.0, 0.06, 2.0);
    w.userData.anim = 'float'; w.userData.amp = 0.008;
    add('b', 'rock', 0, 0, -0.84, 2.0, 0.16, 0.32);
    add('b', 'grass', 0, 0.16, -0.86, 2.0, 0.04, 0.28);
    k.deck(-0.2, 0.26, 0.05, 0.5, 1.5, 0.03, { posts: 0.14 });
    k.deck(0.2, 0.26, 0.55, 0.42, 0.42, 0.03, { posts: 0.14 });
    k.crate(-0.26, 0.26, -0.3, 0.16);
    k.crate(-0.12, 0.26, -0.42, 0.12, 'a');
    k.barrel(-0.3, 0.26, 0.1, 0.12);
    add('c8', 'rope', 0.22, 0.26, 0.5, 0.14, 0.04, 0.14);
    k.lantern(-0.4, 0.26, 0.74, 0.4);
    k.boat(0.56, 0.07, 0.0, 1.5, Math.PI / 2, { sail: 'm', lamp: true });
    k.boat(-0.74, 0.07, 0.4, 1.1, Math.PI / 2 + 0.2, { cargo: 'a' });
    reeds(k, 0.8, 0.08, -0.62, 6);
    return done(group);
  };

  window.CityProps.boat = function (palette) {
    const { group, k } = start(palette, 'boat');
    k.boat(0, 0.04, 0, 1.8, 0, { sail: 'm', lamp: true });
    return done(group);
  };

  window.CityProps.ropeBridge = function (palette) {
    const { group, k, add } = start(palette, 'ropeBridge');
    const y = 0.6, sag = 0.16, n = 15;
    [-1.4, 1.4].forEach(z => {
      add('b', 'rock', 0, 0, z, 1.0, y, 0.24);
      add('rock', 'rockL', 0.4, -0.04, z, 0.34, 0.3, 0.3, 1, z, 0);
      [-0.36, 0.36].forEach(x => { add('c8', 'woodD', x, y, z, 0.07, 0.5, 0.07); k.lamp(x, y + 0.5, z, 0.08); });
    });
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, z = -1.3 + t * 2.6;
      add('b', i % 2 ? 'wood' : 'woodD', 0, y - 0.02 - Math.sin(t * Math.PI) * sag, z, 0.6, 0.03, 0.13, (k.rand() - 0.5) * 0.06, 0, (k.rand() - 0.5) * 0.04);
    }
    [-0.33, 0.33].forEach(x => {
      rope(k, group, [x, y + 0.42, -1.4], [x, y + 0.42, 1.4], 10, sag);
      rope(k, group, [x, y + 0.0, -1.4], [x, y + 0.0, 1.4], 10, sag);
      for (let i = 1; i < 6; i++) { const t = i / 6; add('b', 'rope', x, y - Math.sin(t * Math.PI) * sag, -1.4 + t * 2.8, 0.015, 0.42, 0.015); }
    });
    return done(group);
  };

  window.CityProps.lampPost = function (palette) {
    const { group, k, add } = start(palette, 'lampPost');
    add('c8', 'stoneD', 0, 0, 0, 0.16, 0.08, 0.16);
    k.lantern(0, 0.08, 0, 0.6);
    return done(group);
  };

  window.CityProps.trees = function (palette) {
    const { group, k, add } = start(palette, 'trees');
    k.tree(0, 0, 0, 1.4);
    k.tree(0.5, 0, 0.3, 1.0);
    k.tree(-0.45, 0, 0.25, 1.1, 'round');
    k.tree(0.1, 0, -0.5, 0.9, 'cypress');
    k.bush(0.25, 0.06, 0.55, 0.24);
    add('rock', 'rock', -0.2, -0.04, 0.6, 0.26, 0.22, 0.26, 1, 2, 0);
    return done(group);
  };
})();
