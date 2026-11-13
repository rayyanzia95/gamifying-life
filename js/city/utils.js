/* Cliffside City — shared kit
 *
 * Same contract as before:
 *   CityBuildings[branch](tier, palette) -> THREE.Group   (tier 1..6)
 *   CityProps[name](palette)             -> THREE.Group
 *   palette = { main, accent, dark, light, glow }
 *   Ground is y = 0, front of every building is +z.
 *
 * What changed: every piece now shares one set of river/cliff materials
 * (rock, timber, limestone, water, foliage, warm windows). The branch palette
 * colours the roofs, trims, banners and signature lights, so districts stay
 * readable while the whole city looks like one place.
 *
 * Animation: meshes are tagged with userData.anim. The old three tags
 * ('spin', 'bob', 'flicker') still work in an existing loop. For the gentler
 * new ones ('float', 'sway', 'flow') call CityUtils.tick(scene, time) once
 * per frame instead — it handles all six.
 */
window.CityBuildings = window.CityBuildings || {};
window.CityProps = window.CityProps || {};

window.CityUtils = (function () {
  const NEUTRAL = {
    rock: '#857b6e', rockD: '#62594f', rockL: '#a39988',
    stone: '#f3ead8', stoneD: '#c4b89f',
    wood: '#9a6a44', woodD: '#66442c',
    grass: '#7fae5c', leaf: '#4f8f55', leafD: '#356b47',
    sand: '#d9c59a', foam: '#f2fbfb', white: '#f7f3ea',
    rope: '#c9b48a', iron: '#3d3f47',
    water: '#49b0c9', waterD: '#2f8fae', win: '#ffd684',
  };

  let GEOS = null;
  let SHARED = null;

  function norm(g) {
    g.computeBoundingBox();
    const b = g.boundingBox;
    const sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
    g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
    g.scale(1 / sx, 1 / sy, 1 / sz);
    g.computeVertexNormals();
    return g;
  }

  function prism(pts) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return norm(new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }));
  }

  function buildGeos() {
    const domePts = [[0.46, 0], [0.5, 0.12], [0.49, 0.28], [0.42, 0.46], [0.3, 0.62], [0.16, 0.76], [0.05, 0.9], [0, 1]]
      .map(p => new THREE.Vector2(p[0], p[1]));
    return {
      // original set — every piece fits a 1x1x1 box centred on the origin
      b: new THREE.BoxGeometry(1, 1, 1),
      c8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
      c16: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
      p4: new THREE.ConeGeometry(0.5, 1, 4),
      p8: new THREE.ConeGeometry(0.5, 1, 8),
      s8: new THREE.SphereGeometry(0.5, 8, 8),
      s16: new THREE.SphereGeometry(0.5, 16, 16),
      t05: new THREE.TorusGeometry(0.5, 0.05, 8, 32),
      t05w: new THREE.TorusGeometry(0.5, 0.2, 8, 32),
      t15: new THREE.TorusGeometry(0.5, 0.15, 8, 32),
      tArc: new THREE.TorusGeometry(0.5, 0.1, 8, 16, Math.PI * 1.3),
      // new set
      c6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
      taper: new THREE.CylinderGeometry(0.36, 0.5, 1, 8),      // tower that narrows upward
      taper16: new THREE.CylinderGeometry(0.38, 0.5, 1, 16),
      flare: new THREE.CylinderGeometry(0.5, 0.34, 1, 8),      // balcony / corbel that widens upward
      p16: new THREE.ConeGeometry(0.5, 1, 16),
      hip: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4), // pyramid roof, square to the axes
      roof: prism([[-0.5, 0], [0.5, 0], [0, 1]]),              // gable roof, ridge runs along z
      wedge: prism([[-0.5, 0], [0.5, 0], [-0.5, 1]]),          // lean-to / ramp, high side at -x
      dome: norm(new THREE.LatheGeometry(domePts, 14)),        // slightly pointed dome
      hemi: norm(new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2)),
      arch: norm(new THREE.TorusGeometry(0.5, 0.09, 5, 10, Math.PI)), // half ring standing in the xy plane
      rock: new THREE.DodecahedronGeometry(0.5, 0),
      rock2: new THREE.IcosahedronGeometry(0.5, 0),
    };
  }

  function std(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.9, metalness: 0 }, extra || {}));
  }

  function buildShared() {
    const m = {};
    ['rock', 'rockD', 'rockL', 'stone', 'stoneD', 'wood', 'woodD', 'grass', 'leaf', 'leafD', 'sand', 'white', 'rope', 'iron']
      .forEach(k => { m[k] = std(NEUTRAL[k]); });
    m.foam = std(NEUTRAL.foam, { emissive: NEUTRAL.foam, emissiveIntensity: 0.25, transparent: true, opacity: 0.9 });
    m.water = std(NEUTRAL.water, { emissive: NEUTRAL.waterD, emissiveIntensity: 0.35, roughness: 0.25, transparent: true, opacity: 0.86 });
    m.fall = std('#8fd6e6', { emissive: NEUTRAL.water, emissiveIntensity: 0.35, roughness: 0.3, transparent: true, opacity: 0.8 });
    m.win = std(NEUTRAL.win, { emissive: '#ffb84d', emissiveIntensity: 0.75 });
    return m;
  }

  function mix(a, b, t) { return new THREE.Color(a).lerp(new THREE.Color(b), t); }

  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = hash(String(seed));
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const FACE = {
    f: { ry: 0, nx: 0, nz: 1 }, b: { ry: Math.PI, nx: 0, nz: -1 },
    r: { ry: Math.PI / 2, nx: 1, nz: 0 }, l: { ry: -Math.PI / 2, nx: -1, nz: 0 },
  };

  const api = {
    NEUTRAL,

    setup: function (palette) {
      if (!GEOS) GEOS = buildGeos();
      if (!SHARED) SHARED = buildShared();
      const mats = Object.assign({}, SHARED, {
        m: std(palette.main),
        a: std(palette.accent),
        d: std(palette.dark),
        l: std(palette.light),
        g: std(palette.glow, { emissive: palette.glow, emissiveIntensity: 0.6 }),
        // walls: limestone with a hint of the branch colour; trim: darker band
        w: std(mix(NEUTRAL.stone, palette.light, 0.4), { emissive: mix(NEUTRAL.stone, palette.light, 0.4), emissiveIntensity: 0.14 }),
        wd: std(mix(NEUTRAL.stoneD, palette.dark, 0.3)),
        // translucent branch glass (domes, beams)
        glass: std(palette.glow, { emissive: palette.glow, emissiveIntensity: 0.5, transparent: true, opacity: 0.4 }),
        beam: std(palette.glow, { emissive: palette.glow, emissiveIntensity: 0.9, transparent: true, opacity: 0.16, depthWrite: false }),
      });
      return { mats, geos: GEOS };
    },

    // add(type, mat, x, yBottom, z, sx, sy, sz, rx, ry, rz)
    createAdder: function (group, geos, mats) {
      return (type, mat, x, y, z, sx, sy, sz = sx, rx = 0, ry = 0, rz = 0) => {
        const mesh = new THREE.Mesh(geos[type], mats[mat]);
        mesh.position.set(x, y + sy / 2, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(rx, ry, rz);
        const see = mats[mat].transparent;
        mesh.castShadow = !see;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      };
    },

    /* Set to false before building if you want every part left as its own mesh. */
    MERGE: true,

    /* Called at the end of every building and prop. Fuses all the still parts
       that share a material into one mesh, so a building costs roughly a dozen
       draw calls instead of a few hundred. Moving parts are left alone. */
    finishBuilding: function (group) {
      if (!api.MERGE) return group;
      group.updateMatrixWorld(true);
      const buckets = new Map();
      const moving = (o) => { for (let n = o; n && n !== group; n = n.parent) if (n.userData.anim) return true; return false; };
      group.traverse(function (o) {
        if (!o.isMesh || moving(o)) return;
        if (!buckets.has(o.material)) buckets.set(o.material, []);
        buckets.get(o.material).push(o);
      });
      buckets.forEach(function (list, mat) {
        if (list.length < 2) return;
        let count = 0;
        const parts = list.map(function (m) {
          const src = m.geometry;
          if (!src.userData.flat) src.userData.flat = src.index ? src.toNonIndexed() : src;
          count += src.userData.flat.attributes.position.count;
          return src.userData.flat;
        });
        const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
        const v = new THREE.Vector3(), nm = new THREE.Matrix3();
        let o = 0;
        list.forEach(function (m, i) {
          const P = parts[i].attributes.position, N = parts[i].attributes.normal;
          nm.getNormalMatrix(m.matrixWorld);
          for (let j = 0; j < P.count; j++, o += 3) {
            v.fromBufferAttribute(P, j).applyMatrix4(m.matrixWorld);
            pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
            v.fromBufferAttribute(N, j).applyMatrix3(nm).normalize();
            nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
          }
          m.parent.remove(m);
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        const merged = new THREE.Mesh(g, mat);
        merged.castShadow = !mat.transparent;
        merged.receiveShadow = true;
        group.add(merged);
      });
      return group;
    },

    /* One call per frame. Handles the legacy tags and the new ones. */
    tick: function (root, time) {
      root.traverse(function (o) {
        const u = o.userData;
        if (!u.anim) return;
        const ph = u.phase !== undefined ? u.phase : (o.id * 1.618) % 6.283;
        switch (u.anim) {
          case 'spin':
            o.rotation.y = time * (u.speed !== undefined ? u.speed : 1);
            break;
          case 'bob':
            if (u.baseY === undefined) u.baseY = o.position.y;
            o.position.y = u.baseY + Math.sin(time * (u.speed || 3)) * (u.amp || 0.1);
            break;
          case 'float':
            if (u.baseY === undefined) u.baseY = o.position.y;
            o.position.y = u.baseY + Math.sin(time * (u.speed || 1.4) + ph) * (u.amp || 0.03);
            if (u.rock) o.rotation.z = Math.sin(time * 0.9 + ph) * u.rock;
            break;
          case 'sway':
            o.rotation.z = (u.baseRz || 0) + Math.sin(time * (u.speed || 1.6) + ph) * (u.amp || 0.12);
            break;
          case 'flow': {
            const t = (time * (u.speed || 0.6) + ph) % 1;
            o.position.y = u.y0 + (u.y1 - u.y0) * t;
            break;
          }
          case 'flicker':
            if (o.material && o.material.emissiveIntensity !== undefined) {
              o.material.emissiveIntensity = 0.62 + Math.sin(time * 5.1 + ph) * 0.12 + Math.sin(time * 12.7 + ph * 2) * 0.07;
            }
            break;
        }
      });
    },

    /* Builder kit: the low-level adder plus the shared river/cliff vocabulary. */
    kit: function (group, palette, seed) {
      const { mats, geos } = api.setup(palette);
      const add = api.createAdder(group, geos, mats);
      const rand = rng(seed || 'x');
      const k = { add, mats, geos, rand, group };

      // centred variant: y is the middle, not the bottom
      k.addC = (type, mat, x, y, z, sx, sy, sz = sx, rx = 0, ry = 0, rz = 0) =>
        add(type, mat, x, y - sy / 2, z, sx, sy, sz, rx, ry, rz);

      // child group with its own adder (for moving parts)
      k.sub = function (x, y, z, anim, parent) {
        const g = new THREE.Group();
        g.position.set(x, y, z);
        if (anim) g.userData.anim = anim;
        (parent || group).add(g);
        const a = api.createAdder(g, geos, mats);
        return { group: g, add: a, addC: (t, m, px, py, pz, sx, sy, sz = sx, rx = 0, ry = 0, rz = 0) => a(t, m, px, py - sy / 2, pz, sx, sy, sz, rx, ry, rz) };
      };

      // rock outcrop every building stands on. Top surface is y = 0.1, as before.
      k.base = function (size, o) {
        o = o || {};
        const top = o.top || 'grass';
        add('c8', 'rockD', 0, 0, 0, size * 1.42, 0.05, size * 1.42, 0, Math.PI / 8);
        add('c8', 'rock', 0, 0.03, 0, size * 1.3, 0.045, size * 1.3, 0, Math.PI / 8);
        add('c8', top, 0, 0.06, 0, size * 1.18, 0.04, size * 1.18, 0, Math.PI / 8);
        const n = o.rocks !== undefined ? o.rocks : 6;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + rand() * 0.7;
          if (o.clearFront !== false && Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)) - Math.PI / 2) < 0.5) continue;
          const r = size * (0.6 + rand() * 0.1);
          const s = 0.14 + rand() * 0.16;
          add(rand() > 0.5 ? 'rock' : 'rock2', ['rock', 'rockD', 'rockL'][i % 3],
            Math.cos(ang) * r, -s * 0.28, Math.sin(ang) * r, s, s * (0.7 + rand() * 0.5), s * (0.8 + rand() * 0.4),
            rand() * 3, rand() * 3, rand() * 3);
        }
        const tufts = o.tufts !== undefined ? o.tufts : 3;
        for (let i = 0; i < tufts; i++) {
          const ang = rand() * Math.PI * 2, r = size * (0.5 + rand() * 0.08);
          add('p4', 'leaf', Math.cos(ang) * r, 0.09, Math.sin(ang) * r, 0.07, 0.1 + rand() * 0.06, 0.07, 0, rand() * 3);
        }
      };

      // rough cliff mass: stacked, offset rock slabs with boulders at the foot
      k.crag = function (x, y, z, w, h, d, o) {
        o = o || {};
        const layers = Math.max(2, Math.round(h / 0.28));
        const lh = h / layers;
        for (let i = 0; i < layers; i++) {
          const t = i / layers;
          const sh = 1 - t * (o.taper !== undefined ? o.taper : 0.28);
          const ox = (rand() - 0.5) * w * 0.12, oz = (rand() - 0.5) * d * 0.12;
          add('c8', ['rock', 'rockD', 'rock', 'rockL'][i % 4], x + ox, y + i * lh, z + oz,
            w * sh * 1.08, lh * 1.04, d * sh * 1.08, 0, Math.PI / 8 + (rand() - 0.5) * 0.5);
        }
        const nb = o.boulders !== undefined ? o.boulders : 4;
        for (let i = 0; i < nb; i++) {
          const ang = rand() * Math.PI * 2, s = Math.min(w, d) * (0.22 + rand() * 0.16);
          add('rock', i % 2 ? 'rockD' : 'rockL', x + Math.cos(ang) * w * 0.5, y - s * 0.2, z + Math.sin(ang) * d * 0.5,
            s, s * 0.8, s, rand() * 3, rand() * 3, rand() * 3);
        }
        if (o.cap !== false) add('c8', o.cap || 'grass', x, y + h, z, w * (1 - (o.taper !== undefined ? o.taper : 0.28)) * 1.0, 0.04, d * (1 - (o.taper !== undefined ? o.taper : 0.28)) * 1.0, 0, Math.PI / 8);
        return y + h + 0.04;
      };

      // walls + roof in one go. Returns the y of the top of the walls.
      k.house = function (x, y, z, w, h, d, o) {
        o = o || {};
        add('b', o.wall || 'w', x, y, z, w, h, d);
        if (o.plinth !== false) add('b', o.trim || 'wd', x, y, z, w + 0.05, 0.07, d + 0.05);
        const ov = o.overhang !== undefined ? o.overhang : 0.14;
        const rh = o.roofH !== undefined ? o.roofH : Math.min(w, d) * 0.5;
        const rm = o.roofMat || 'm';
        const kind = o.roof || 'gable';
        if (kind === 'gable') {
          if (o.axis === 'x') add('roof', rm, x, y + h, z, d + ov, rh, w + ov, 0, Math.PI / 2);
          else add('roof', rm, x, y + h, z, w + ov, rh, d + ov);
        } else if (kind === 'hip') {
          add('hip', rm, x, y + h, z, w + ov, rh, d + ov);
        } else if (kind === 'flat') {
          add('b', rm, x, y + h, z, w + ov * 0.7, 0.08, d + ov * 0.7);
          add('b', o.trim || 'wd', x, y + h + 0.08, z, w + ov * 0.7 - 0.08, 0.02, d + ov * 0.7 - 0.08);
        }
        return y + h;
      };

      // lit window on a wall face ('f' +z, 'b' -z, 'r' +x, 'l' -x); x,z = point on the wall
      k.win = function (x, y, z, w, h, face, o) {
        const F = FACE[face || 'f'];
        o = o || {};
        add('b', 'wd', x + F.nx * 0.012, y - 0.02, z + F.nz * 0.012, w + 0.05, h + 0.04, 0.03, 0, F.ry);
        add('b', o.mat || 'win', x + F.nx * 0.02, y, z + F.nz * 0.02, w, h, 0.03, 0, F.ry);
        if (o.arch) add('c16', o.mat || 'win', x + F.nx * 0.02, y + h - w / 2, z + F.nz * 0.02, w, 0.03, w, Math.PI / 2, F.ry);
      };

      k.door = function (x, y, z, w, h, face, o) {
        const F = FACE[face || 'f'];
        o = o || {};
        add('b', o.mat || 'woodD', x + F.nx * 0.015, y, z + F.nz * 0.015, w, h, 0.04, 0, F.ry);
        if (o.arch !== false) add('c16', o.mat || 'woodD', x + F.nx * 0.015, y + h - w / 2, z + F.nz * 0.015, w, 0.04, w, Math.PI / 2, F.ry);
        add('s8', 'g', x + F.nx * 0.05 + (F.nz ? w * 0.28 : 0), y + h * 0.45, z + F.nz * 0.05 + (F.nx ? w * 0.28 : 0), 0.035, 0.035, 0.035);
      };

      // glowing light with its own material, so each one flickers on its own
      k.lamp = function (x, y, z, s, o) {
        o = o || {};
        const m = add(o.shape || 's8', o.mat || 'g', x, y, z, s, s, s);
        m.material = m.material.clone();
        m.castShadow = false;
        if (o.anim !== false) m.userData.anim = o.anim || 'flicker';
        return m;
      };

      // lamp post
      k.lantern = function (x, y, z, h, o) {
        o = o || {};
        add('c8', 'iron', x, y, z, 0.035, h, 0.035);
        add('b', 'iron', x, y + h, z, 0.1, 0.02, 0.1);
        k.lamp(x, y + h + 0.02, z, 0.09, o);
        add('hip', 'iron', x, y + h + 0.1, z, 0.13, 0.05, 0.13);
      };

      k.tree = function (x, y, z, s, kind) {
        s = s || 1;
        if (kind === 'round') {
          add('c8', 'woodD', x, y, z, 0.07 * s, 0.3 * s, 0.07 * s);
          add('rock2', 'leaf', x, y + 0.22 * s, z, 0.42 * s, 0.4 * s, 0.42 * s, rand() * 3, rand() * 3, 0);
          add('rock2', 'leafD', x + 0.1 * s, y + 0.4 * s, z - 0.06 * s, 0.28 * s, 0.26 * s, 0.28 * s, rand() * 3, rand() * 3, 0);
        } else if (kind === 'cypress') {
          add('c8', 'woodD', x, y, z, 0.05 * s, 0.12 * s, 0.05 * s);
          add('p8', 'leafD', x, y + 0.08 * s, z, 0.2 * s, 0.75 * s, 0.2 * s);
        } else {
          add('c8', 'woodD', x, y, z, 0.07 * s, 0.22 * s, 0.07 * s);
          add('p8', 'leafD', x, y + 0.16 * s, z, 0.46 * s, 0.42 * s, 0.46 * s);
          add('p8', 'leaf', x, y + 0.4 * s, z, 0.34 * s, 0.36 * s, 0.34 * s);
          add('p8', 'leaf', x, y + 0.62 * s, z, 0.2 * s, 0.28 * s, 0.2 * s);
        }
      };

      k.bush = function (x, y, z, s) {
        add('rock2', rand() > 0.5 ? 'leaf' : 'leafD', x, y - s * 0.25, z, s, s * 0.8, s, rand() * 3, rand() * 3, 0);
      };

      // still water (pool, basin, channel)
      k.pool = function (x, y, z, sx, sz, round) {
        const m = add(round ? 'c16' : 'b', 'water', x, y, z, sx, 0.03, sz);
        m.userData.anim = 'float'; m.userData.amp = 0.006;
        return m;
      };

      // waterfall: sheet of water on a face, dropping from yTop to yBottom, with foam and moving streaks
      k.fall = function (x, yTop, z, w, yBottom, face) {
        const F = FACE[face || 'f'];
        const h = yTop - yBottom;
        add('b', 'fall', x, yBottom, z, w, h, 0.05, 0, F.ry);
        const n = Math.max(2, Math.round(w / 0.09));
        for (let i = 0; i < n; i++) {
          const off = (i + 0.5) / n - 0.5;
          const px = x + (F.nz ? off * w * 0.8 : F.nx * 0.03), pz = z + (F.nx ? off * w * 0.8 : F.nz * 0.03);
          const s = add('b', 'foam', px, yTop, pz, 0.035, Math.min(0.22, h * 0.3), 0.035);
          s.castShadow = false;
          s.userData.anim = 'flow'; s.userData.y0 = yTop - 0.05; s.userData.y1 = yBottom + 0.08;
          s.userData.speed = 0.55 + rand() * 0.3; s.userData.phase = rand();
          s.position.y = yTop - (h * (i + 0.5)) / n;
        }
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * w * 0.3;
          const f = add('rock2', 'foam', x + (F.nz ? off : F.nx * 0.08), yBottom - 0.04, z + (F.nx ? off : F.nz * 0.08), 0.14, 0.1, 0.14, rand() * 3, rand() * 3, 0);
          f.castShadow = false;
          f.userData.anim = 'float'; f.userData.amp = 0.015; f.userData.speed = 3;
        }
      };

      // waterwheel turning about a horizontal axle. axis 'x' = axle along x, 'z' = axle along z
      k.wheel = function (x, y, z, dia, width, axis, o) {
        o = o || {};
        const outer = new THREE.Group();
        outer.position.set(x, y, z);
        if (axis === 'z') outer.rotation.x = Math.PI / 2; else outer.rotation.z = Math.PI / 2;
        group.add(outer);
        const w = k.sub(0, 0, 0, 'spin', outer);
        w.group.userData.speed = o.speed !== undefined ? o.speed : 0.7;
        [-1, 1].forEach(s => w.addC('t05', 'woodD', 0, s * width * 0.5, 0, dia, dia, 1.4, Math.PI / 2));
        for (let i = 0; i < 4; i++) w.addC('b', 'wood', 0, 0, 0, dia * 0.96, width * 0.5, 0.04, 0, (i * Math.PI) / 4);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          w.addC('b', 'wood', Math.cos(a) * dia * 0.47, 0, Math.sin(a) * dia * 0.47, dia * 0.14, width, 0.03, 0, -a);
        }
        w.addC('c8', o.hub || 'a', 0, 0, 0, dia * 0.16, width * 1.5, dia * 0.16);
        return outer;
      };

      // pennant on a pole
      k.flag = function (x, y, z, h, mat) {
        add('c8', 'iron', x, y, z, 0.025, h, 0.025);
        add('s8', 'a', x, y + h, z, 0.05, 0.05, 0.05);
        const f = k.sub(x, y + h - 0.02, z, 'sway');
        f.group.userData.amp = 0.1;
        f.addC('wedge', mat || 'm', 0.11, -0.06, 0, 0.2, 0.13, 0.02, 0, 0, 0);
        return f.group;
      };

      // hanging banner on a wall face
      k.banner = function (x, y, z, w, h, face, mat) {
        const F = FACE[face || 'f'];
        add('b', mat || 'm', x + F.nx * 0.03, y, z + F.nz * 0.03, w, h, 0.02, 0, F.ry);
        add('b', 'a', x + F.nx * 0.035, y + h * 0.4, z + F.nz * 0.035, w * 0.45, w * 0.45, 0.02, 0, F.ry, Math.PI / 4);
        add('b', 'woodD', x + F.nx * 0.03, y + h, z + F.nz * 0.03, w + 0.06, 0.025, 0.035, 0, F.ry);
      };

      // little river boat
      k.boat = function (x, y, z, s, ry, o) {
        o = o || {};
        const b = k.sub(x, y, z, 'float');
        b.group.rotation.y = ry || 0;
        b.group.userData.amp = 0.012; b.group.userData.rock = 0.05;
        b.add('b', 'woodD', 0, 0, 0, 0.42 * s, 0.07 * s, 0.17 * s);
        b.add('b', 'wood', 0, 0.06 * s, 0, 0.46 * s, 0.03 * s, 0.2 * s);
        b.add('wedge', 'woodD', 0.29 * s, 0, 0, 0.16 * s, 0.09 * s, 0.17 * s, Math.PI);
        b.add('wedge', 'woodD', -0.29 * s, 0, 0, 0.16 * s, 0.09 * s, 0.17 * s, 0, 0, Math.PI);
        if (o.sail) {
          b.add('c8', 'woodD', 0, 0.06 * s, 0, 0.02 * s, 0.42 * s, 0.02 * s);
          b.add('wedge', o.sail, 0.09 * s, 0.14 * s, 0, 0.2 * s, 0.3 * s, 0.015 * s);
        } else if (o.cargo) {
          b.add('b', o.cargo, -0.05 * s, 0.09 * s, 0, 0.1 * s, 0.08 * s, 0.1 * s);
          b.add('b', 'wood', 0.08 * s, 0.09 * s, 0, 0.08 * s, 0.06 * s, 0.09 * s);
        }
        if (o.lamp) { b.add('c8', 'iron', 0.2 * s, 0.08 * s, 0, 0.015 * s, 0.14 * s, 0.015 * s); b.add('s8', 'g', 0.2 * s, 0.22 * s, 0, 0.06 * s, 0.06 * s, 0.06 * s); }
        return b.group;
      };

      // timber deck on stilts reaching down to yGround
      k.deck = function (x, y, z, sx, sz, yGround, o) {
        o = o || {};
        add('b', 'wood', x, y - 0.04, z, sx, 0.04, sz);
        const nx = Math.max(2, Math.round(sx / 0.35) + 1), nz = Math.max(2, Math.round(sz / 0.35) + 1);
        for (let i = 0; i < nx; i++) add('b', 'woodD', x - sx / 2 + (i + 0.5) * (sx / nx), y - 0.002, z, 0.012, 0.004, sz);
        const g = yGround !== undefined ? yGround : 0;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
          add('c8', 'woodD', x + c[0] * (sx / 2 - 0.04), g, z + c[1] * (sz / 2 - 0.04), 0.05, y - g + (o.posts || 0), 0.05);
        });
        void nz;
      };

      // simple railing along one edge. dir 'x' or 'z'
      k.rail = function (x, y, z, len, dir, mat) {
        const n = Math.max(2, Math.round(len / 0.22) + 1);
        for (let i = 0; i < n; i++) {
          const t = (i / (n - 1) - 0.5) * len;
          add('b', mat || 'woodD', x + (dir === 'x' ? t : 0), y, z + (dir === 'z' ? t : 0), 0.025, 0.12, 0.025);
        }
        if (dir === 'x') add('b', mat || 'woodD', x, y + 0.11, z, len + 0.03, 0.025, 0.03);
        else add('b', mat || 'woodD', x, y + 0.11, z, 0.03, 0.025, len + 0.03);
      };

      // flight of steps climbing away from the given face direction (walk up toward -normal)
      k.steps = function (x, y, z, w, n, rise, run, face, mat) {
        const F = FACE[face || 'f'];
        for (let i = 0; i < n; i++) {
          const dist = (n - i - 0.5) * run;
          const sx = F.nz ? w : run, sz = F.nz ? run : w;
          add('b', mat || 'stoneD', x + F.nx * dist, y, z + F.nz * dist, sx, (i + 1) * rise, sz);
        }
      };

      // row of small lights on a sagging rope between two points
      k.lights = function (p1, p2, n, sag, o) {
        o = o || {};
        const a = new THREE.Vector3(p1[0], p1[1], p1[2]), b = new THREE.Vector3(p2[0], p2[1], p2[2]);
        let prev = a.clone();
        for (let i = 1; i <= n + 1; i++) {
          const t = i / (n + 1);
          const p = a.clone().lerp(b, t);
          p.y -= Math.sin(t * Math.PI) * (sag !== undefined ? sag : 0.12);
          const seg = new THREE.Mesh(geos.b, mats.iron);
          seg.position.copy(prev).lerp(p, 0.5);
          seg.scale.set(0.012, 0.012, prev.distanceTo(p));
          seg.lookAt(p);
          group.add(seg);
          if (i <= n) {
            const mat = o.mats ? o.mats[i % o.mats.length] : 'g';
            k.lamp(p.x, p.y - 0.06, p.z, o.size || 0.06, { mat });
          }
          prev = p;
        }
      };

      // crescent finial on a short stem
      k.crescent = function (x, y, z, s, mat) {
        add('c8', mat || 'a', x, y, z, 0.03 * s, 0.14 * s, 0.03 * s);
        add('s8', mat || 'a', x, y + 0.1 * s, z, 0.07 * s, 0.07 * s, 0.07 * s);
        add('tArc', mat || 'a', x, y + 0.16 * s, z, 0.2 * s, 0.2 * s, 0.2 * s, 0, 0, Math.PI * 0.85);
      };

      // stack of crates / barrel
      k.crate = function (x, y, z, s, mat) {
        add('b', mat || 'wood', x, y, z, s, s, s, 0, rand() * 0.6);
        add('b', 'woodD', x, y + s, z, s * 1.04, s * 0.06, s * 1.04, 0, 0);
      };
      k.barrel = function (x, y, z, s) {
        add('c8', 'wood', x, y, z, s, s * 1.2, s);
        add('c8', 'iron', x, y + s * 0.25, z, s * 1.05, s * 0.08, s * 1.05);
        add('c8', 'iron', x, y + s * 0.85, z, s * 1.05, s * 0.08, s * 1.05);
      };

      // arcade of arches along x, on a face
      k.arcade = function (x, y, z, len, h, n, face, o) {
        o = o || {};
        const F = FACE[face || 'f'];
        const along = (t) => [x + (F.nz ? t : 0), z + (F.nx ? t : 0)];
        const bay = len / n;
        for (let i = 0; i <= n; i++) {
          const p = along(-len / 2 + i * bay);
          add(o.round ? 'c8' : 'b', o.mat || 'stone', p[0], y, p[1], 0.07, h - bay * 0.3, 0.07);
        }
        for (let i = 0; i < n; i++) {
          const p = along(-len / 2 + (i + 0.5) * bay);
          add('arch', o.mat || 'stone', p[0], y + h - bay * 0.42, p[1], bay, bay * 0.42, 0.07, 0, F.ry);
          if (o.fill) add('b', o.fill, p[0] - F.nx * 0.03, y, p[1] - F.nz * 0.03, bay * 0.7, h - bay * 0.25, 0.02, 0, F.ry);
        }
        const c = along(0);
        add('b', o.mat || 'stone', c[0], y + h, c[1], F.nz ? len + 0.1 : 0.1, 0.06, F.nx ? len + 0.1 : 0.1);
      };

      return k;
    },
  };

  return api;
})();
