// City builder, part 4 of 5: putting projects into the 3D scene. Everything js/city/scene.js needs to draw the
// town from cityState(): where a slot is, how a model stands on it, the roads, the glowing slot markers for build
// mode, and the per-frame tick. Nothing here touches the DOM or the event log.
// Needs three.js, js/city-svg.js (CITY_TERRAIN, CITY_PLOT, CITY_COLS, CITY_ROWS), js/city/utils.js, props.js,
// catalogue.js, state.js and models.js loaded first.

const CityBuildKit = (() => {
  // The same numbers as js/city/terrain.js (they live inside its closure there). Keep the two in step.
  const CELL = 2, RISE = 1.25, BANK = 0.14, WATER = 0.09;
  const topOf = level => (level === 0 ? WATER : level === 1 ? BANK : (level - 1) * RISE);
  const world = (cx, cy) => [(cx - CITY_COLS / 2) * CELL, (cy - CITY_ROWS / 2) * CELL];
  // A model's front is +z. Turning it by this much points the front the way the slot faces.
  const TURN = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
  const SIDE_OF = id => cityProject(id)?.side ?? "shared";
  const paletteFor = id => CITY_PROJECT_PALETTES[SIDE_OF(id)] ?? CITY_PROJECT_PALETTES.shared;

  // Scene position of a slot's middle and the height of its ground.
  function slotSpot(slot) {
    const [x, z] = world(slot.x + slot.w / 2, slot.y + slot.h / 2);
    return { x, z, y: topOf(slot.zones.includes("cliff") ? slot.low : slot.level) };
  }

  // Which way a project faces in a slot. The slot's own face if the footprint fits that way round, else a quarter
  // turn (a 2 x 1 station in a 1 x 2 field).
  function facing(project, slot) {
    const [w, d] = project.size;
    const alongX = slot.face === "n" || slot.face === "s";
    const fits = alongX ? w <= slot.w && d <= slot.h : d <= slot.w && w <= slot.h;
    if (fits) return slot.face;
    return { n: "e", s: "w", e: "s", w: "n" }[slot.face];
  }

  // A bridge is a prop 3 long (stone, deck at 0.62) or 2.8 long (rope, deck at 0.6); stretch it over the gap and
  // lift its deck to the banks. When the two banks differ in height (rope bridge only) it leans to meet both.
  function placeCrossing(group, projectId, slot) {
    const [x, z0] = world(slot.x + 0.5, slot.y), [, z1] = world(slot.x + 0.5, slot.y + slot.h);
    const [north, south] = slot.ends.map(topOf);
    const span = z1 - z0;
    if (projectId === "stonebridge") {
      group.position.set(x, 0, (z0 + z1) / 2);
      group.scale.set(1.4, Math.max(north, south) / 0.62, span / 3);
      return;
    }
    group.position.set(x, 0, (z0 + z1) / 2);
    group.scale.set(1.3, ((north + south) / 2) / 0.6, span / 2.8);
    group.rotation.x = Math.atan2(north - south, span);
  }

  // Stairs, the funicular and the tunnel are built 1 wide, 1 long and 1 tall, climbing toward +z.
  function placeCliff(group, slot) {
    const { x, z, y } = slotSpot(slot);
    group.position.set(x, y, z);
    group.rotation.y = TURN[slot.face];
    group.scale.set(1.7, topOf(slot.high) - topOf(slot.low), CELL);
  }

  // Build a project's model and stand it on its slot. opts are passed to the model (running, ...).
  function make(projectId, slot, opts = {}) {
    const project = cityProject(projectId);
    const drop = Math.max(topOf(slot.level) - WATER, 0.05);
    const group = CityProjects3D[projectId](paletteFor(projectId), { drop, ...opts });
    if (slot.zones.includes("crossing")) placeCrossing(group, projectId, slot);
    else if (slot.zones.includes("cliff")) placeCliff(group, slot);
    else {
      const { x, z, y } = slotSpot(slot);
      group.position.set(x, y + 0.01, z);
      group.rotation.y = TURN[facing(project, slot)];
    }
    group.userData.slot = slot.id;
    group.userData.project = projectId;
    return group;
  }

  // Bring the scene in line with the state, changing only what differs. `placed` is a Map you keep between calls
  // (slot id -> { project, group, running }). Returns { added: [groups], removed: [slot ids] } so the caller can
  // play the build animation on what is new. options.running: whether the station's train runs.
  function sync(scene, state, placed, options = {}) {
    const added = [], removed = [];
    placed.forEach((entry, slotId) => {
      const now = state.bySlot.get(slotId);
      const stale = !now || now.project !== entry.project || (entry.project === "station" && entry.running !== !!options.running);
      if (!stale) return;
      scene.remove(entry.group);
      placed.delete(slotId);
      removed.push(slotId);
    });
    state.built.forEach(b => {
      if (placed.has(b.slot)) return;
      const group = make(b.project, citySlot(b.slot), { running: !!options.running });
      scene.add(group);
      placed.set(b.slot, { project: b.project, group, running: !!options.running });
      added.push(group);
    });
    return { added, removed };
  }

  // The paved paths that should show for this state, as one group (rebuild it whenever the state changes).
  function roads(state) {
    const group = new THREE.Group();
    const palette = CITY_PROJECT_PALETTES.shared;
    cityRoads(state).forEach(road => {
      for (let i = 1; i < road.via.length; i++) {
        const [ax, az] = world(...road.via[i - 1]), [bx, bz] = world(...road.via[i]);
        const len = Math.hypot(bx - ax, bz - az);
        const piece = CityProjects3D.road(palette, Math.round(len * 100) / 100 + 0.3);
        const cell = road.via[i].map(Math.floor);
        piece.position.set((ax + bx) / 2, topOf(cityLevelAt(cell[0], cell[1])) + 0.012, (az + bz) / 2);
        piece.rotation.y = Math.atan2(bx - ax, bz - az);
        group.add(piece);
      }
    });
    group.userData.roads = true;
    return group;
  }

  // Build mode: a soft glowing plate on every slot that can take something. Each carries userData.slot, so a
  // raycast against the returned group's children tells you which slot was tapped.
  // options.slots: light up exactly these slot ids instead (the places a project being moved could go).
  function markers(state, options = {}) {
    const group = new THREE.Group();
    const slots = options.slots ? options.slots.map(citySlot) : cityOpenSlots(state);
    slots.forEach(slot => {
      const upgrade = state.bySlot.has(slot.id);
      const material = new THREE.MeshBasicMaterial({ color: upgrade ? 0x7fe3f2 : options.colour ?? 0xffc233, transparent: true, opacity: 0.6, depthWrite: false });
      const crossing = slot.zones.includes("crossing");
      const plate = new THREE.Mesh(new THREE.BoxGeometry(slot.w * CELL - 0.3, 0.14, slot.h * CELL - 0.3), material);
      const { x, z, y } = slotSpot(slot);
      plate.position.set(x, (crossing ? Math.max(...slot.ends.map(topOf)) : y) + (upgrade ? 1.3 : 0.1), z);
      plate.userData.slot = slot.id;
      plate.userData.marker = true;
      plate.userData.phase = (slot.x * 3 + slot.y * 5) % 6;
      group.add(plate);
    });
    group.userData.markers = true;
    return group;
  }

  // The slot under a pointer. `point` is a THREE.Vector2 in -1..1 screen space; pass the markers group.
  function pickSlot(camera, point, markerGroup) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(point, camera);
    return ray.intersectObjects(markerGroup.children, false)[0]?.object.userData.slot ?? null;
  }

  // The project standing under a pointer (to move or remove it), or null. `placed` is the Map from sync().
  // It tests each project's bounding box, not its triangles: a jetty or a string of lights is mostly air, and a
  // tap anywhere on the project should count.
  function pickProject(camera, point, placed) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(point, camera);
    const hit = new THREE.Vector3();
    let best = null, bestDistance = Infinity;
    placed.forEach((entry, slotId) => {
      entry.box = entry.box ?? new THREE.Box3().setFromObject(entry.group);
      if (!ray.ray.intersectBox(entry.box, hit)) return;
      const distance = hit.distanceTo(ray.ray.origin);
      if (distance < bestDistance) { best = slotId; bestDistance = distance; }
    });
    return best;
  }

  const ease = t => t * t * (3 - 2 * t);

  // Once per frame, in place of CityUtils.tick: it calls that, then moves the shuttles (funicular car, train) and
  // breathes the slot markers. A shuttle travels for `period` seconds, waits `wait`, and comes back.
  function tick(root, time) {
    CityUtils.tick(root, time);
    root.traverse(o => {
      const u = o.userData;
      if (u.anim === "shuttle") {
        const leg = u.period + u.wait;
        const t = (time + (o.id % 7)) % (leg * 2);
        const back = t >= leg;
        const along = ease(Math.min((back ? t - leg : t) / u.period, 1));
        const f = back ? 1 - along : along;
        o.position.set(u.from[0] + (u.to[0] - u.from[0]) * f, u.from[1] + (u.to[1] - u.from[1]) * f, u.from[2] + (u.to[2] - u.from[2]) * f);
      } else if (u.marker) {
        o.material.opacity = 0.55 + 0.25 * Math.sin(time * 2.4 + u.phase);
      }
    });
  }

  // ---- Showcase: one project on a grass tile, for the build sheet's preview pane ----
  // The WebGL renderer is made once and kept (iOS allows few contexts); each showcase() just borrows its canvas.
  let showRenderer = null;
  const SHOW_SIZE = { w: 339, h: 170 };

  function showRig() {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.75));
    const sun = new THREE.DirectionalLight(0xfff3d6, 0.9);
    sun.position.set(6, 10, 5);
    scene.add(sun);
    const tile = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.6), new THREE.MeshStandardMaterial({ color: 0x5d8f3e, flatShading: true }));
    tile.position.y = -0.15;
    scene.add(tile);
    return { scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300) };
  }

  function disposeTree(root) {
    root.traverse(o => {
      o.geometry?.dispose();
      [o.material].flat().forEach(m => m?.dispose());
    });
  }

  // Fit the model as the camera sees it over a whole turn (wide models fill the width, tall ones the height).
  function frameModel(camera, model) {
    const spin = model.rotation.y, boxes = [];
    for (let i = 0; i < 8; i++) {
      model.rotation.y = (i / 8) * Math.PI;
      model.updateMatrixWorld(true);
      boxes.push(new THREE.Box3().setFromObject(model));
    }
    model.rotation.y = spin;
    const midY = (Math.min(...boxes.map(b => b.min.y)) + Math.max(...boxes.map(b => b.max.y))) / 2;
    const target = new THREE.Vector3(model.position.x, midY, model.position.z);
    camera.position.copy(target).add(new THREE.Vector3(14, 12, 14));
    camera.lookAt(target);
    camera.updateMatrixWorld();
    let halfW = 0, halfH = 0;
    boxes.forEach(box => [box.min, box.max].forEach(a => [box.min, box.max].forEach(b => [box.min, box.max].forEach(c => {
      const p = new THREE.Vector3(a.x, b.y, c.z).applyMatrix4(camera.matrixWorldInverse);
      halfW = Math.max(halfW, Math.abs(p.x));
      halfH = Math.max(halfH, Math.abs(p.y));
    }))));
    const aspect = SHOW_SIZE.w / SHOW_SIZE.h, half = Math.max(halfH, halfW / aspect, 0.8) * 1.08;
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    camera.updateProjectionMatrix();
  }

  // Returns { canvas, show(projectId), stop() }. Needs three.js and the model files loaded.
  function showcase() {
    const canvas = document.createElement("canvas");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "none";
    const { scene, camera } = showRig();
    let model = null, frame = 0;
    if (!showRenderer) {
      showRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      showRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      showRenderer.setSize(SHOW_SIZE.w, SHOW_SIZE.h, false);
    }
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const draw = ms => {
      if (!model) return;
      if (!reduced) model.rotation.y = (ms / 1000) * 0.5;
      tick(scene, ms / 1000);
      showRenderer.render(scene, camera);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(showRenderer.domElement, 0, 0, canvas.width, canvas.height);
    };
    const loop = ms => {
      // Stop once the preview is gone (sheet redrawn) or hidden (its dialog closed).
      if (!canvas.isConnected || canvas.closest("dialog:not([open])")) return stop();
      draw(ms);
      frame = requestAnimationFrame(loop);
    };
    const show = projectId => {
      cancelAnimationFrame(frame);
      if (model) { scene.remove(model); disposeTree(model); }
      model = CityProjects3D[projectId](paletteFor(projectId), { drop: 0.05, running: true });
      model.rotation.y = 0.6;
      scene.add(model);
      frameModel(camera, model);
      if (reduced) draw(0);
      else frame = requestAnimationFrame(loop);
    };
    Object.assign(canvas, { width: SHOW_SIZE.w * 2, height: SHOW_SIZE.h * 2 });
    return { canvas, show, stop };
  }

  return { CELL, RISE, topOf, world, slotSpot, facing, paletteFor, make, sync, roads, markers, pickSlot, pickProject, tick, showcase };
})();
