// city-preview.html: a playground for the city builder kit. It shows the whole loop the app will need:
// read events -> cityState() -> draw (3D or flat) -> tap a slot -> pick a project -> save an event -> redraw.
// It keeps its own events under PREVIEW_KEY and never touches the app's, so you can build and reset freely.
// This file is a worked example to copy from, not part of the app: scene.js and city-home.js stay as they are
// until the kit is wired in (docs/city-kit.md has the steps).

const PREVIEW_KEY = "city-preview-events";
const PREVIEW_BRANCHES = [
  { id: "deen", name: "Deen" }, { id: "chores", name: "Chores" }, { id: "health", name: "Health" }, { id: "academics", name: "Academics" },
  { id: "money", name: "Money" }, { id: "personal", name: "Personal" }, { id: "people", name: "People" },
];
// The same branch palettes as js/city/scene.js (they are private to that file).
const PREVIEW_PALETTES = {
  money: { main: "#ffd700", accent: "#ff8c00", dark: "#b8860b", light: "#fffacd", glow: "#ffee00" },
  health: { main: "#ff4500", accent: "#ff6347", dark: "#8b0000", light: "#ffe4e1", glow: "#ff7f50" },
  deen: { main: "#2e8b57", accent: "#3cb371", dark: "#006400", light: "#f0fff0", glow: "#00ff7f" },
  academics: { main: "#4169e1", accent: "#1e90ff", dark: "#00008b", light: "#e6e6fa", glow: "#00bfff" },
  chores: { main: "#8b4513", accent: "#cd853f", dark: "#5c4033", light: "#f5deb3", glow: "#ffa500" },
  personal: { main: "#9acd32", accent: "#adff2f", dark: "#556b2f", light: "#f5f5dc", glow: "#adff2f" },
  people: { main: "#db7093", accent: "#ffb6c1", dark: "#c71585", light: "#fff0f5", glow: "#ff69b4" },
  park: { main: "#228B22", accent: "#FF69B4", dark: "#556B2F", light: "#D2B48C", glow: "#7CFC00" },
  pool: { main: "#00CED1", accent: "#FF4500", dark: "#008B8B", light: "#E0FFFF", glow: "#00FFFF" },
};

const ui = {
  view: "town", level: 5, tier: 2, building: true, running: true, later: false,
  slot: null,       // the slot whose sheet is open
  moving: null,     // the slot of a project being moved
  model: "docks",   // the gallery's pick
};
let events = loadPreviewEvents();
let state = null;
let three = null;   // everything three.js made, once

function loadPreviewEvents() {
  try { return JSON.parse(localStorage.getItem(PREVIEW_KEY)) || []; } catch { return []; }
}
function savePreviewEvents(next) {
  events = next.map(e => (e.id ? e : { ...e, id: crypto.randomUUID() }));
  try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(events)); } catch { /* private browsing: still works until reload */ }
  refresh();
}
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- the 3D stage

function setupThree(host) {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
  camera.position.set(50, 50, 50);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.set(0, 1.5, 0);
  Object.assign(controls, { enableDamping: true, enablePan: true, minZoom: 0.7, maxZoom: 9, minPolarAngle: Math.PI * 0.12, maxPolarAngle: Math.PI * 0.46 });

  const lit = scene => {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { top: 24, bottom: -24, left: -24, right: 24, far: 120 });
    scene.add(sun);
    return scene;
  };
  const town = lit(new THREE.Scene());
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: 0x2a3038 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  town.add(floor);
  CityTerrain.build(town);
  ["park", "pool"].forEach(id => {
    const prop = CityProps[id](PREVIEW_PALETTES[id]);
    const pad = CityTerrain.pad(id);
    prop.position.set(pad.x, pad.y + 0.02, pad.z);
    prop.rotation.y = pad.turn;
    prop.scale.setScalar(1.8);
    town.add(prop);
  });

  const gallery = lit(new THREE.Scene());
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0x3a414b, flatShading: true }));
  plinth.position.y = -0.15;
  plinth.receiveShadow = true;
  gallery.add(plinth);

  host.prepend(canvas);
  three = { canvas, renderer, camera, controls, town, gallery, placed: new Map(), buildings: new Map(), roads: null, markers: null, model: null, down: null };
  new ResizeObserver(fit).observe(canvas);
  canvas.addEventListener("pointerdown", e => { three.down = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", onStageTap);
  requestAnimationFrame(frame);
}

function fit() {
  const { canvas, renderer, camera } = three;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  const half = ui.view === "gallery" ? 4.2 : Math.max(10, 18 / aspect);
  Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
  camera.updateProjectionMatrix();
}

function frame(time) {
  requestAnimationFrame(frame);
  if (document.hidden || ui.view === "flat") return;
  const t = time / 1000;
  const scene = ui.view === "gallery" ? three.gallery : three.town;
  CityBuildKit.tick(scene, t);
  if (ui.view === "gallery" && three.model) three.model.rotation.y = t * 0.35;
  three.controls.update();
  three.renderer.render(scene, three.camera);
}

// The branch buildings, at the tier the slider says (so you can see the town at different ages).
function drawBuildings() {
  PREVIEW_BRANCHES.forEach(b => {
    const old = three.buildings.get(b.id);
    if (old && old.tier === ui.tier) return;
    if (old) three.town.remove(old.group);
    const group = CityBuildings[b.id](ui.tier, PREVIEW_PALETTES[b.id]);
    const pad = CityTerrain.pad(b.id);
    group.position.set(pad.x, pad.y + 0.02, pad.z);
    group.rotation.y = pad.turn;
    group.scale.setScalar(1.8);
    three.town.add(group);
    three.buildings.set(b.id, { tier: ui.tier, group });
  });
}

function drawTown3d() {
  drawBuildings();
  CityBuildKit.sync(three.town, state, three.placed, { running: ui.running });
  if (three.roads) three.town.remove(three.roads);
  three.roads = CityBuildKit.roads(state);
  three.town.add(three.roads);
  if (three.markers) three.town.remove(three.markers);
  three.markers = ui.building ? CityBuildKit.markers(state, ui.moving ? { slots: moveTargets() } : {}) : null;
  if (three.markers) three.town.add(three.markers);
}

function drawGallery() {
  if (three.model) three.gallery.remove(three.model);
  const project = cityProject(ui.model);
  const palette = CityBuildKit.paletteFor(ui.model);
  const model = CityProjects3D[ui.model](palette, { drop: 0.05, running: ui.running });
  // the 1 x 1 x 1 cliff pieces are shown at the size the scene stretches them to
  if (project.zones.includes("cliff")) model.scale.set(1.7, 1.25, 2);
  if (project.zones.includes("crossing")) model.position.y = 0;
  three.model = model;
  three.gallery.add(model);
}

// ---------------------------------------------------------------- moving a project

// Slots the project being moved could go to.
function moveTargets() {
  if (!ui.moving) return [];
  const project = cityProject(state.bySlot.get(ui.moving).project);
  return CITY_SLOTS.filter(s => !state.bySlot.has(s.id) && cityFits(project, s)).map(s => s.id);
}
// ---------------------------------------------------------------- taps

function onStageTap(e) {
  if (!three.down || Math.hypot(e.clientX - three.down[0], e.clientY - three.down[1]) > 5 || ui.view !== "town") return;
  const box = three.canvas.getBoundingClientRect();
  const point = new THREE.Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
  const slot = three.markers && CityBuildKit.pickSlot(three.camera, point, three.markers);
  tapSlot(slot ?? CityBuildKit.pickProject(three.camera, point, three.placed));
}

function tapSlot(slotId) {
  if (!slotId) { ui.slot = null; ui.moving = null; return refresh(); }
  if (ui.moving && moveTargets().includes(slotId)) {
    const next = cityMove(events, state, ui.moving, slotId);
    ui.moving = null;
    ui.slot = slotId;
    return next ? savePreviewEvents(next) : refresh();
  }
  ui.moving = null;
  ui.slot = slotId;
  refresh();
}

// ---------------------------------------------------------------- the side panel

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

function optionRow({ project, ok, reason }) {
  const row = el("div", { className: `cb-option${ok ? "" : " is-locked"}` });
  row.dataset.side = project.side;
  const cost = project.cost === 0 ? "earned" : project.cost === 1 ? "1 blueprint" : `${project.cost} blueprints`;
  const button = el("button", { className: "cb-button primary", type: "button", textContent: "Build", disabled: !ok });
  button.addEventListener("click", () => {
    const next = cityBuild(events, state, project.id, ui.slot, Date.now(), today());
    if (next) savePreviewEvents(next);
  });
  row.append(el("strong", {}, `${project.name} · ${cost}`), button, el("p", {}, project.blurb));
  if (!ok) row.append(el("span", { className: "cb-why" }, reason));
  return row;
}

function slotSheet() {
  const slot = citySlot(ui.slot);
  const there = state.bySlot.get(ui.slot);
  const sheet = el("section", { className: "cb-sheet card" });
  const zones = slot.zones.map(z => CITY_ZONE_NAMES[z]).join(" · ");
  sheet.append(el("h2", {}, there ? cityProject(there.project).name : slot.name), el("p", { className: "cb-where" }, `${slot.name} · ${zones}`));
  if (there) {
    sheet.append(el("p", {}, cityProject(there.project).blurb));
    if (there.starter) sheet.append(el("p", { className: "cb-where" }, "Part of the old town: it stays where it is."));
    else {
      const move = el("button", { className: "cb-button", type: "button", textContent: ui.moving ? "Pick a glowing slot…" : "Move (free)" });
      move.addEventListener("click", () => { ui.moving = ui.moving ? null : ui.slot; ui.building = true; document.getElementById("cbp-build").checked = true; refresh(); });
      const remove = el("button", { className: "cb-button", type: "button", textContent: "Remove (blueprint back)" });
      remove.addEventListener("click", () => { const next = cityRemove(events, state, ui.slot); ui.slot = null; if (next) savePreviewEvents(next); });
      sheet.append(el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, move, remove));
    }
  }
  const menu = cityMenu(state, ui.slot);
  if (menu.length) sheet.append(el("p", { className: "cb-where" }, there ? "Upgrade" : "Build here"), ...menu.map(optionRow));
  return sheet;
}

function overview() {
  const box = el("section", { className: "cb-sheet card" });
  box.append(el("h2", {}, citySummary(state)),
    el("p", { className: "cb-where" }, `Level ${ui.level}: ${state.earned} earned, ${state.spent} spent. One blueprint per level gained, the first at level 2.`));
  const mine = state.built.filter(b => !b.starter);
  box.append(el("p", {}, mine.length ? "Built:" : ui.building ? "Tap a glowing slot to build." : "Turn on Build mode to place something."));
  if (mine.length) box.append(el("ul", { className: "cbp-list" }, ...mine.map(b => el("li", {}, `${cityProject(b.project).name} at ${citySlot(b.slot).name}`))));
  if (state.unplaced.length) {
    box.append(el("p", {}, "Waiting to be placed (never lost):"),
      el("ul", { className: "cbp-list" }, ...state.unplaced.map(u => el("li", {}, `${cityProject(u.event.project)?.name ?? u.event.project} (${u.reason})`))));
  }
  const left = ["boss", "ramadan"].map(k => state.monumentsLeft(k)).reduce((a, b) => a + b, 0);
  if (left > 0) box.append(el("p", { className: "cb-where" }, `${left} monument${left === 1 ? "" : "s"} earned and not yet placed (the preview pretends 2 bosses and 1 Ramadan).`));
  return box;
}

function galleryPanel() {
  const box = el("section", { className: "cb-sheet card" });
  const project = cityProject(ui.model);
  const buttons = CITY_PROJECTS.map(p => {
    const b = el("button", { className: "cb-button", type: "button", textContent: p.name });
    b.setAttribute("aria-pressed", String(p.id === ui.model));
    b.addEventListener("click", () => { ui.model = p.id; refresh(); });
    return b;
  });
  box.append(el("h2", {}, project.name), el("p", { className: "cb-where" },
    `${project.side} · ${project.size.join(" x ")} cells · ${project.zones.map(z => CITY_ZONE_NAMES[z]).join(", ")}${project.later ? " · later" : ""}`),
    el("p", {}, project.blurb), el("div", { className: "cbp-gallery" }, ...buttons));
  return box;
}

// ---------------------------------------------------------------- redraw

function previewItems() {
  return PREVIEW_BRANCHES.map(b => ({ id: b.id, tier: ui.tier, lit: 0.6, c: `var(--${b.id})`, label: b.name }));
}

function refresh() {
  state = cityState(events, ui.level, { allowLater: ui.later, earned: { boss: 2, ramadan: 1 } });
  if (ui.slot && !citySlot(ui.slot)) ui.slot = null;
  const stage = document.getElementById("cbp-stage");
  stage.querySelector(".city-map")?.remove();
  three.canvas.hidden = ui.view === "flat";
  if (ui.view === "flat") {
    stage.insertAdjacentHTML("beforeend", cityBuildMapSvg(previewItems(), state, "The town", ui.moving ? { slots: moveTargets() } : { build: ui.building }));
    if (ui.slot) stage.querySelector(`.cb-slot[data-slot="${ui.slot}"]`)?.classList.add("is-selected");
  } else if (ui.view === "gallery") drawGallery();
  else drawTown3d();
  fit();
  document.getElementById("cbp-status").textContent = ui.view === "gallery" ? cityProject(ui.model).name : citySummary(state);
  document.getElementById("cbp-hint").textContent = ui.view === "flat" ? "The flat city phones get. Tap a plate to build."
    : ui.view === "gallery" ? "Drag to turn, scroll to zoom." : ui.moving ? "Pick a glowing slot to move it there." : "Drag to orbit, scroll to zoom, right-drag to pan. Tap a glowing slot or a project.";
  const side = document.getElementById("cbp-side");
  side.replaceChildren(...(ui.view === "gallery" ? [galleryPanel()] : [ui.slot ? slotSheet() : "", overview()].filter(Boolean)));
  document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === ui.view)));
}

function setupControls() {
  const bind = (id, key, read) => document.getElementById(id).addEventListener("input", e => {
    ui[key] = read(e.target);
    const out = document.getElementById(`${id}-out`);
    if (out) out.textContent = ui[key];
    refresh();
  });
  bind("cbp-level", "level", t => Number(t.value));
  bind("cbp-tier", "tier", t => Number(t.value));
  bind("cbp-build", "building", t => t.checked);
  bind("cbp-running", "running", t => t.checked);
  bind("cbp-later", "later", t => t.checked);
  document.getElementById("cbp-reset").addEventListener("click", () => { ui.slot = null; ui.moving = null; savePreviewEvents([]); });
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => {
    ui.view = b.dataset.view;
    three.controls.target.set(0, ui.view === "gallery" ? 1 : 1.5, 0);
    three.camera.zoom = 1;
    three.camera.position.set(50, 50, 50);
    refresh();
  }));
  // the flat city: plates and projects are ordinary elements
  document.getElementById("cbp-stage").addEventListener("click", e => {
    const target = e.target.closest?.("[data-slot]");
    if (!target || ui.view !== "flat") return;
    e.preventDefault();
    tapSlot(target.dataset.slot);
  });
}

setupThree(document.getElementById("cbp-stage"));
setupControls();
refresh();
