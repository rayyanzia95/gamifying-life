// City layout, Home only: home.js calls cityHomeHtml instead of homeCardHtml, then cityHomeMount. The city has one
// building per branch (js/city-svg.js has the tiers and the flat SVG map). The overall level earns blueprints, spent
// in build mode on projects the user places: bridges, docks, a lookout... (js/city/build/: catalogue, state, models).
// What is built is an event per project ({ activity: "city-build", project, slot, at }), so the town syncs.
// Every browser with WebGL gets the 3D scene (js/city/scene.js); three.js and the building files are only fetched
// then, and only when City is the layout. Wide screens can orbit and it moves; phones and reduced motion get the same
// city held still (drawn on demand). No WebGL or a failed fetch gets the flat SVG, which is also shown while it loads.
// Beside the city: the next prayer and each branch's level and today. Styles in css/layout-city.css.
// Needs hud-home.js (hudPrayers), orrery-home.js (orrIn) and the scoring files loaded before it.

// Pinned with SRI like supabase-js. Local files run in this order (scripts added with async = false keep it).
const CITY_THREE = [
  { src: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    integrity: "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu" },
  { src: "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
    integrity: "sha384-wagZhIFgY4hD+7awjQjR4e2E294y6J2HSnd8eTNc15ZubTeQeVRZwhQJ+W6hnBsf" },
];
const CITY_DISTRICTS = ["money", "health", "deen", "academics", "chores", "personal", "people"];
const CITY_FILES = ["js/city/utils.js", "js/city/props.js", ...CITY_DISTRICTS.map(id => `js/city/buildings/${id}.js`), "js/city/terrain.js",
  "js/city/build/models.js", "js/city/build/scene-kit.js", "js/city/scene.js"];
const CITY_WIDE = "(min-width: 900px)";

let cityLoading = null; // the one fetch of three.js and the city files, shared by every redraw

function cityAddScript({ src, integrity }) {
  return new Promise((done, fail) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (integrity) { script.integrity = integrity; script.crossOrigin = "anonymous"; }
    script.onload = done;
    script.onerror = () => fail(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
}

function cityLoad3d() {
  if (!cityLoading) {
    cityLoading = Promise.all([...CITY_THREE, ...CITY_FILES.map(src => ({ src }))].map(cityAddScript));
    cityLoading.catch(() => { cityLoading = null; }); // try again on the next visit
  }
  return cityLoading;
}

function cityHasWebgl() {
  try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; }
}

// Held still on phones and when motion isn't welcome.
function cityStill() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "none";
  return calm || !matchMedia(CITY_WIDE).matches;
}

function cityNextPrayerHtml(events, today) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const next = hudPrayers(events, today).find(p => p.hour * 60 > nowMinutes);
  if (!next) return `<div class="city-next"><span>Next prayer</span><strong>Fajr tomorrow</strong></div>`;
  const at = Math.round(next.hour * 60);
  const name = next.name[0] + next.name.slice(1).toLowerCase();
  return `<a class="city-next" href="deen.html"><span>Next prayer</span><strong>${name} · ${clock12(at)}</strong>
    <span class="num">in ${orrIn(at - nowMinutes)}</span></a>`;
}

const cityPercent = share => Math.round(Math.min(share, 1) * 100);

// What each building needs: tier from its level, lit from today's share.
function cityItems(branches) {
  return branches.map(b => ({
    id: b.id, name: b.name, href: b.page, level: b.level, tier: cityTier(b.level), lit: Math.min(b.share, 1), c: `var(--${b.id})`,
    label: `${b.name}, level ${b.level}, tier ${cityTier(b.level)} of 6, ${cityPercent(b.share)}% today`,
  }));
}

// ---- The city builder: state, build mode, the sheet ----

let cityBuilding = false; // build mode is on (kept while Home redraws; off again on a fresh page load)
let cityMoving = null;    // the slot of a project being moved, while its new place is picked
let cityNow = null;       // the builder's state at the last draw: { state, running, lit }

// Monuments are earned, not bought: one victory statue per exam boss beaten. A lantern arch needs a finished
// Ramadan, which nothing records yet, so that count stays 0 for now.
function cityEarned(events) {
  const ticked = tickedDeadlines(events);
  return { boss: DEADLINES.filter(d => isBoss(d) && bossState(events, d, ticked).beaten).length, ramadan: 0 };
}

// The station's train runs while the Quran or the dua streak is alive.
function cityStreakAlive(events) {
  return [revisionStreak(events), duaStreak(events)].some(streak => streak.days > 0 && !streak.paused);
}

// Slots a project being moved could go to.
function cityMoveTargets(state) {
  return cityMoveTargetsFor(state, cityMoving);
}

// Build mode on a phone, or with motion off, uses the flat map: its plates can always be tapped, while the still
// 3D view can't be turned to reach a slot hidden behind a cliff.
const cityFlatBuild = () => cityBuilding && cityStill();

function cityBarHtml(state) {
  const waiting = state.unplaced.length;
  return `<div class="city-bar">
    <span class="city-stage-name">${citySummary(state)}${waiting ? ` · ${waiting} to place` : ""}</span>
    <button type="button" class="cb-button${cityBuilding ? " primary" : ""}" id="city-build-toggle" aria-pressed="${cityBuilding}">${cityBuilding ? "Done" : "Build"}</button>
  </div>${cityBuilding ? `<p class="city-build-hint">${cityMoving ? "Pick a glowing place to move it to." : state.free > 0 || waiting ? "Tap a glowing place to build. Tap something you built to move it." : "No blueprints to spend. The next overall level brings one. Tap something you built to move it."}</p>` : ""}`;
}

let cityPending = null; // the items for the 3D stage that cityHomeMount fills in
let cityShown = null; // the items just drawn, 3D or flat, for the level-up build

// The slots to light up: where the project being moved could go, or (in build mode) where something can be
// built now, plus anywhere a build still waiting to be placed would fit. null outside build mode.
function cityLitSlots(state) {
  if (cityMoving) return cityMoveTargets(state);
  if (!cityBuilding) return null;
  const waiting = state.unplaced.map(u => cityProject(u.event.project)).filter(Boolean);
  const forWaiting = CITY_SLOTS.filter(slot => !state.bySlot.has(slot.id) && waiting.some(project => cityFits(project, slot)));
  return [...new Set([...cityBuildableSlots(state), ...forWaiting].map(slot => slot.id))];
}

function cityFlatSvg(items, state, label) {
  const slots = cityLitSlots(state);
  return cityBuildMapSvg(items, state, label, slots ? { slots } : {});
}

// overall: { level, into, cost }. branches: [{ id, name, page, level, into, cost, share }] as for homeCardHtml.
function cityHomeHtml(events, overall, overallXp, branches) {
  const today = todayString();
  const items = cityItems(branches);
  const state = cityState(events, overall.level, { earned: cityEarned(events) });
  if (cityMoving && !state.bySlot.has(cityMoving)) cityMoving = null;
  cityNow = { state, running: cityStreakAlive(events), lit: items.reduce((sum, it) => sum + it.lit, 0) / items.length };
  const live = cityHasWebgl() && !cityFlatBuild();
  cityPending = live ? items : null;
  cityShown = items;
  const label = `Your town, a ${state.stage.name.toLowerCase()}: a building per branch, taller at higher levels, windows lit by today's progress, and ${state.built.length} things built. Overall level ${overall.level}.`;
  const stage = live
    ? `<div class="city-stage is-3d" id="city-stage" role="group" aria-label="${label}">${cityFlatSvg(items, state, label)}</div>`
    : `<div class="city-stage${cityBuilding ? " is-building" : ""}" id="city-flat">${cityFlatSvg(items, state, label)}</div>`;
  const rows = branches.map(b => `<a class="city-row" href="${b.page}" style="--c: var(--${b.id})">
    <i></i><span>${b.name}</span><span class="num">Lv ${b.level} · ${cityPercent(b.share)}% today</span></a>`).join("");
  return `<div class="city">
    <div class="city-main">${cityBarHtml(state)}${stage}</div>
    <aside class="city-side">
      ${cityNextPrayerHtml(events, today)}
      <div class="city-rows">${rows}</div>
      <p class="city-hint">${overallXp} XP in all · overall level ${overall.level} · ${state.earned} blueprint${state.earned === 1 ? "" : "s"} earned, ${state.spent} spent</p>
    </aside>
  </div>`;
}

// What the 3D scene needs from the builder (scene.js drawCity).
function citySceneState() {
  return { ...cityNow, building: cityBuilding, slots: cityLitSlots(cityNow.state), onSlot: cityTapSlot };
}

// After home.js has put the card in the page: bring the 3D scene in, or swap in the SVG if it can't load.
function cityHomeMount() {
  const grown = cityShown ? cityBuildDue(cityShown) : [];
  const stage = document.getElementById("city-stage");
  const items = cityPending;
  if (!stage || !items) { cityBuildPlaySvg(document.querySelector(".city-stage"), grown); return; }
  cityLoad3d().then(() => {
    if (stage.isConnected) CityScene.mount(stage, items, grown, cityStill(), citySceneState());
    else { const now = document.getElementById("city-stage"); if (now) CityScene.mount(now, cityPending, grown, cityStill(), citySceneState()); }
  }).catch(() => {
    stage.classList.remove("is-3d");
    stage.innerHTML = cityFlatSvg(items, cityNow.state, "Your town");
    cityBuildPlaySvg(stage, grown);
  });
}

// ---- Taps: the Build button, a slot, the sheet's buttons ----

// Save a change to the town with an Undo, then redraw Home. change(events, state) returns the new list or null.
function cityCommit(message, change) {
  let done = false;
  const undo = commitWithUndo(events => {
    const next = change(events, cityState(events, cityNow.state.level, cityNow.state.options));
    done = Boolean(next);
    return next ?? events;
  });
  render();
  if (done) showUndo(message, undo, render);
}

function cityTapSlot(slotId) {
  if (!slotId) { if (cityMoving) { cityMoving = null; render(); } return; }
  if (cityMoving) {
    const from = cityMoving;
    cityMoving = null;
    if (slotId !== from && !cityNow.state.bySlot.has(slotId)) {
      return cityCommit(`${cityProject(cityNow.state.bySlot.get(from).project).name} moved`, (events, state) => {
        // the event object in this fresh list is found by id, not by identity
        const entry = state.bySlot.get(from);
        return entry ? cityMove(events, state, from, slotId) : null;
      });
    }
    return render();
  }
  cityOpenSheet(slotId);
}

function citySheet() {
  let sheet = document.getElementById("city-sheet");
  if (!sheet) {
    sheet = Object.assign(document.createElement("dialog"), { id: "city-sheet", className: "ql-sheet city-sheet" });
    sheet.setAttribute("aria-label", "Build");
    sheet.addEventListener("click", event => { if (event.target === sheet) sheet.close(); }); // the dark backdrop
    document.body.append(sheet);
  }
  return sheet;
}

function cityOptionRow(slotId, { project, ok, reason }, onPick) {
  const row = Object.assign(document.createElement("div"), { className: `cb-option${ok ? "" : " is-locked"}`, tabIndex: 0 });
  row.dataset.side = project.side;
  row.dataset.project = project.id;
  row.setAttribute("aria-pressed", "false");
  const pick = () => onPick?.(project.id);
  row.addEventListener("click", event => { if (!event.target.closest("button")) pick(); });
  row.addEventListener("keydown", event => {
    if (event.target !== row || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    pick();
  });
  const cost = project.cost === 0 ? "earned" : project.cost === 1 ? "1 blueprint" : `${project.cost} blueprints`;
  const build = Object.assign(document.createElement("button"), { type: "button", className: "cb-button primary", textContent: "Build", disabled: !ok });
  build.addEventListener("click", () => {
    citySheet().close();
    cityCommit(`${project.name} built`, (events, state) => cityBuild(events, state, project.id, slotId, Date.now(), todayString()));
  });
  row.append(Object.assign(document.createElement("strong"), { textContent: `${project.name} · ${cost}` }), build,
    Object.assign(document.createElement("p"), { textContent: project.blurb }));
  if (!ok) row.append(Object.assign(document.createElement("span"), { className: "cb-why", textContent: reason }));
  return row;
}

// The sheet for one slot: what stands there (move, remove), and what could be built or upgraded.
function cityOpenSheet(slotId) {
  const state = cityNow.state;
  const slot = citySlot(slotId);
  const there = state.bySlot.get(slotId);
  const sheet = citySheet();
  const el = (tag, props, ...kids) => { const node = Object.assign(document.createElement(tag), props); node.append(...kids); return node; };
  const body = el("div", { className: "cb-sheet" });
  const zones = slot.zones.map(z => CITY_ZONE_NAMES[z]).join(" · ");
  body.append(el("h2", {}, there ? cityProject(there.project).name : slot.name), el("p", { className: "cb-where" }, `${slot.name} · ${zones}`));
  if (there) {
    body.append(el("p", {}, cityProject(there.project).blurb));
    if (there.starter) body.append(el("p", { className: "cb-where" }, "Part of the old town: it stays where it is."));
    else {
      const move = el("button", { type: "button", className: "cb-button" }, "Move (free)");
      move.disabled = cityMoveTargetsFor(state, slotId).length === 0;
      move.addEventListener("click", () => { sheet.close(); cityMoving = slotId; cityBuilding = true; render(); });
      const remove = el("button", { type: "button", className: "cb-button" }, "Remove (blueprint back)");
      remove.addEventListener("click", () => {
        sheet.close();
        cityCommit(`${cityProject(there.project).name} removed`, (events, now) => cityRemove(events, now, slotId));
      });
      body.append(el("div", { className: "cb-actions" }, move, remove));
    }
  }
  const menu = cityMenu(state, slotId);
  if (menu.length) {
    const preview = cityPreviewPane(sheet);
    body.append(el("p", { className: "cb-where" }, there ? "Upgrade" : "Build here"), preview.pane,
      ...menu.map(option => cityOptionRow(slotId, option, preview.select)));
    preview.start((menu.find(o => o.ok) ?? menu[0]).project.id);
  }
  const waiting = state.unplaced.filter(u => !state.bySlot.has(slotId) && cityProject(u.event.project) && cityFits(cityProject(u.event.project), slot));
  if (waiting.length) {
    body.append(el("p", { className: "cb-where" }, "Waiting to be placed"));
    waiting.forEach(u => {
      const place = el("button", { type: "button", className: "cb-button" }, `Place ${cityProject(u.event.project).name} here`);
      place.addEventListener("click", () => {
        sheet.close();
        cityCommit(`${cityProject(u.event.project).name} placed`, (events, now) => {
          const event = events.find(e => e.id === u.event.id);
          return event ? cityReplace(events, now, event, slotId) : null;
        });
      });
      body.append(place);
    });
  }
  const close = el("button", { type: "button", className: "cb-button cb-close" }, "Close");
  close.addEventListener("click", () => sheet.close());
  body.append(close);
  sheet.replaceChildren(body);
  if (!sheet.open) sheet.showModal();
}

// The 3D preview above the option cards: an empty box at first (no layout jump), then the model once three.js
// is in. No WebGL or a failed load leaves it as a quiet empty box. select() marks the card and swaps the model.
function cityPreviewPane(sheet) {
  const pane = Object.assign(document.createElement("div"), { className: "cb-preview" });
  let showcase = null, wanted = null;
  const mark = id => pane.parentElement?.querySelectorAll(".cb-option").forEach(card => {
    const on = card.dataset.project === id;
    card.classList.toggle("is-selected", on);
    card.setAttribute("aria-pressed", String(on));
  });
  const select = id => { wanted = id; mark(id); showcase?.show(id); };
  const start = id => {
    select(id);
    if (!cityHasWebgl()) return pane.classList.add("is-empty");
    cityLoad3d().then(() => {
      if (!sheet.open || showcase) return;
      showcase = CityBuildKit.showcase();
      pane.append(showcase.canvas);
      showcase.show(wanted);
    }).catch(() => pane.classList.add("is-empty"));
  };
  return { pane, select, start };
}

function cityMoveTargetsFor(state, slotId) {
  const entry = state.bySlot.get(slotId);
  if (!entry || entry.starter) return [];
  const project = cityProject(entry.project);
  return CITY_SLOTS.filter(slot => !state.bySlot.has(slot.id) && cityFits(project, slot)).map(slot => slot.id);
}

// One listener for the Build button and for the flat map's plates and projects.
document.addEventListener("click", event => {
  if (document.documentElement.dataset.layout !== "city") return;
  if (event.target.closest?.("#city-build-toggle")) {
    cityBuilding = !cityBuilding;
    cityMoving = null;
    return render();
  }
  const target = cityBuilding && event.target.closest?.("#city-flat [data-slot], #city-stage > svg [data-slot]");
  if (target) { event.preventDefault(); cityTapSlot(target.dataset.slot); }
});

// Crossing the wide-screen line (a resized window, a rotated tablet) switches between moving and still.
matchMedia(CITY_WIDE).addEventListener("change", () => {
  if (document.documentElement.dataset.layout === "city" && typeof render === "function") render();
});
