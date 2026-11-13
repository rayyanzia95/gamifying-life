// The 3D city for City → Home on wide screens (js/city-home.js loads three.js, then the building files, then this).
// One building per CITY_PLOT cell, an orthographic camera with limited orbit and zoom, today's XP as the glow
// material's brightness (dim 0.15 to full 1.0), small HTML tags over the buildings, 30 fps and paused when the page
// is hidden or the city is off screen. The scene is built once and kept; a redraw of Home only re-attaches it.

const CityScene = (() => {
  const GLOW_MIN = 0.15; // windows of a branch with nothing done today
  const FRAME_MS = 1000 / 30;
  const SCENERY_TIER = 4; // park and pool are always there at this tier
  const PALETTES = {
    money: { main: "#ffd700", accent: "#ff8c00", dark: "#b8860b", light: "#fffacd", glow: "#ffee00" },
    health: { main: "#ff4500", accent: "#ff6347", dark: "#8b0000", light: "#ffe4e1", glow: "#ff7f50" },
    deen: { main: "#2e8b57", accent: "#3cb371", dark: "#006400", light: "#f0fff0", glow: "#00ff7f" },
    academics: { main: "#4169e1", accent: "#1e90ff", dark: "#00008b", light: "#e6e6fa", glow: "#00bfff" },
    chores: { main: "#8b4513", accent: "#cd853f", dark: "#5c4033", light: "#f5deb3", glow: "#ffa500" },
    personal: { main: "#9acd32", accent: "#adff2f", dark: "#556b2f", light: "#f5f5dc", glow: "#adff2f" },
    people: { main: "#db7093", accent: "#ffb6c1", dark: "#c71585", light: "#fff0f5", glow: "#ff69b4" },
    centre: { main: "#9370db", accent: "#8a2be2", dark: "#4b0082", light: "#f8f8ff", glow: "#e0b0ff" },
    park: { main: "#228B22", accent: "#FF69B4", dark: "#556B2F", light: "#D2B48C", glow: "#7CFC00" },
    pool: { main: "#00CED1", accent: "#FF4500", dark: "#008B8B", light: "#E0FFFF", glow: "#00FFFF" },
  };

  let s = null; // everything three.js made, once

  // Any CSS colour (the app's are var()s and colour-mix) to a hex three.js understands, via a 1px canvas.
  function cssColor(expr, host) {
    const probe = document.createElement("i");
    probe.style.color = expr;
    host.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    px.fillStyle = resolved;
    px.fillRect(0, 0, 1, 1);
    const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
    return (r << 16) | (g << 8) | b;
  }

  // Stand a model on its pad (position from CITY_PLOT and the terrain under it, turned a little).
  function place(group, id) {
    const { x, y, z, turn } = CityTerrain.pad(id);
    group.position.set(x, y + 0.05, z);
    group.rotation.y = turn;
  }

  // The glow parts are the ones with an emissive colour; a branch's lit share sets their brightness.
  function collect(group) {
    const glow = [], moving = [];
    group.traverse(o => {
      if (o.userData.anim) moving.push(o);
      if (o.material && o.material.emissive && o.material.emissive.getHex() !== 0) glow.push(o);
    });
    group.userData.glow = glow;
    group.userData.moving = moving;
  }

  const brightness = lit => GLOW_MIN + (1 - GLOW_MIN) * Math.min(Math.max(lit, 0), 1);

  function addDistrict(item) {
    const old = s.districts.get(item.id);
    if (old && old.tier === item.tier) { old.item = item; old.group.userData.base = brightness(item.lit); return; }
    if (old) s.scene.remove(old.group);
    const group = CityBuildings[item.id](item.tier, PALETTES[item.id]);
    place(group, item.id);
    group.userData.id = item.id;
    group.userData.base = brightness(item.lit);
    collect(group);
    group.userData.top = new THREE.Box3().setFromObject(group).max.y;
    s.scene.add(group);
    s.districts.set(item.id, { tier: item.tier, group, item });
  }

  function addScenery() {
    ["park", "pool"].forEach(id => {
      const group = CityBuildings[id](SCENERY_TIER, PALETTES[id]);
      place(group, id);
      group.userData.base = 0.6;
      collect(group);
      s.scene.add(group);
      s.districts.set(id, { tier: SCENERY_TIER, group, item: null });
    });
    // Trees on the ledges and lamps at the bridge ends, at the fixed spots the terrain lists.
    const prop = (kind, { x, y, z }) => {
      const group = CityProps[kind](PALETTES.park);
      group.scale.setScalar(CityUtils.BUILDING_SCALE);
      group.position.set(x, y + 0.05, z);
      group.userData.base = 0.8;
      collect(group);
      s.scene.add(group);
      s.districts.set(`${kind}-${x}-${z}`, { group, item: null });
    };
    const { trees, lamps } = CityTerrain.spots();
    trees.forEach(spot => prop("tree", spot));
    lamps.forEach(spot => prop("lamp", spot));
  }

  // The land's colours from the app's palette, resolved to hex: grass lighter on higher ground, two rock shades.
  function terrainColours(host) {
    const mix = (colour, pct, into) => cssColor(`color-mix(in srgb, ${colour} ${pct}%, ${into})`, host);
    return {
      grass: [42, 30, 20].map(pct => mix("var(--deen)", pct, "var(--city-ground)")),
      rock: [mix("var(--muted)", 55, "var(--surface)"), mix(`color-mix(in srgb, var(--muted) 55%, var(--surface))`, 85, "#000")],
      water: mix("var(--academics)", 55, "var(--surface)"),
      deck: mix("var(--chores)", 35, "var(--surface)"),
      rail: mix("var(--chores)", 70, "#000"),
    };
  }

  function create(host) {
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
    camera.position.set(50, 50, 50);
    camera.lookAt(scene.position);
    const controls = new THREE.OrbitControls(camera, canvas);
    Object.assign(controls, {
      enableDamping: true, enablePan: false, minZoom: 0.8, maxZoom: 2.6,
      minPolarAngle: Math.PI * 0.18, maxPolarAngle: Math.PI * 0.42,
    });
    const ground = cssColor("var(--city-ground)", host);
    const dark = cssColor("var(--bg)", host) < 0x808080;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, dark ? 0.45 : 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, dark ? 0.75 : 0.9);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { top: 32, bottom: -32, left: -32, right: 32, far: 120 });
    scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: ground }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.6; // just under the land's edge
    floor.receiveShadow = true;
    scene.add(floor);
    CityTerrain.build(scene, terrainColours(host));
    s ={ canvas, renderer, scene, camera, controls, districts: new Map(), tags: new Map(), visible: true, last: 0, down: null };
    addScenery();
    watchPointer();
    new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }).observe(canvas);
    new ResizeObserver(fit).observe(canvas);
    requestAnimationFrame(frame);
  }

  // A click on a building (not the end of a drag) opens its page.
  function watchPointer() {
    const ray = new THREE.Raycaster(), point = new THREE.Vector2();
    s.canvas.addEventListener("pointerdown", e => { s.down = [e.clientX, e.clientY]; });
    s.canvas.addEventListener("pointerup", e => {
      if (!s.down || Math.hypot(e.clientX - s.down[0], e.clientY - s.down[1]) > 5) return;
      const box = s.canvas.getBoundingClientRect();
      point.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
      ray.setFromCamera(point, s.camera);
      for (const hit of ray.intersectObjects(s.scene.children, true)) {
        let o = hit.object;
        while (o && !o.userData.id) o = o.parent;
        const entry = o && s.districts.get(o.userData.id);
        if (entry?.item?.href) { location.href = entry.item.href; return; }
      }
    });
  }

  // The camera shows the whole plot whatever the shape of the box: wide boxes show the plot's width, tall ones its height.
  function fit() {
    const w = s.canvas.clientWidth, h = s.canvas.clientHeight;
    if (!w || !h) return;
    s.renderer.setSize(w, h, false);
    const aspect = w / h, half = Math.max(15, 24 / aspect);
    Object.assign(s.camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    s.camera.updateProjectionMatrix();
  }

  function tagFor(item) {
    let tag = s.tags.get(item.id);
    if (!tag) {
      tag = document.createElement("a");
      tag.className = "city-tag";
      s.tags.set(item.id, tag);
    }
    tag.style.setProperty("--c", item.c);
    tag.textContent = `${item.name} · Lv ${item.level}`;
    tag.setAttribute("aria-label", item.label);
    if (item.href) tag.href = item.href; else tag.removeAttribute("href");
    return tag;
  }

  const spot = new THREE.Vector3();
  function placeTags() {
    const w = s.canvas.clientWidth, h = s.canvas.clientHeight;
    s.districts.forEach(({ group, item }) => {
      const tag = item && s.tags.get(item.id);
      if (!tag) return;
      spot.copy(group.position).setY(group.userData.top + 0.4).project(s.camera);
      tag.style.transform = `translate(${((spot.x + 1) / 2) * w}px, ${((1 - spot.y) / 2) * h}px) translate(-50%, -100%)`;
    });
  }

  function frame(time) {
    requestAnimationFrame(frame);
    if (document.hidden || !s.visible || time - s.last < FRAME_MS) return;
    s.last = time;
    const t = time / 1000;
    s.districts.forEach(({ group }) => {
      const base = group.userData.base;
      group.userData.glow.forEach(o => {
        const flicker = o.userData.anim === "flicker" ? 0.12 * Math.sin(t * 8 + group.position.x) : 0;
        o.material.emissiveIntensity = Math.max(0, base + flicker);
      });
      group.userData.moving.forEach(o => {
        if (o.userData.anim === "spin") o.rotation.y = t * 1.5;
        else if (o.userData.anim === "bob") {
          o.userData.baseY ??= o.position.y;
          o.position.y = o.userData.baseY + Math.sin(t * 3) * 0.1;
        }
      });
    });
    s.controls.update();
    s.renderer.render(s.scene, s.camera);
    placeTags();
  }

  // items: [{ id, name, href, level, tier, lit, c, label }]. Safe to call again with fresh numbers.
  function mount(host, items) {
    if (!s) create(host);
    items.forEach(addDistrict);
    host.replaceChildren(s.canvas, ...items.map(tagFor));
    fit();
  }

  return { mount };
})();
