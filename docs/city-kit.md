# City builder kit

Everything behind the choice-based city (Round 6 of the brief): what can be built, where, the rules, the 3D
models, the flat drawings, tests, and a preview page to try it all without touching real data.

## Try it first

From the repo folder:

    python3 -m http.server 8000

Then open `http://localhost:8000/city-preview.html`. (It needs to be online once to fetch three.js.)

- **Town (3D):** tap a glowing slot, pick a project, watch it appear. Tap a project to move or remove it.
- **Town (flat):** the same town as the SVG city phones get.
- **Model gallery:** every model on a turntable, including the three "later" ones.
- The sliders set the overall level (one blueprint per level) and the branch buildings' tier.
- The preview keeps its builds under its own storage key, so it never touches your real events.

Run the tests with `node tests/city-state.test.js` (22 checks).

## The files

| File | What it is | Needs |
| --- | --- | --- |
| `js/city/build/catalogue.js` | 19 projects, 29 slots, the starter builds, roads, stage names | nothing |
| `js/city/build/state.js` | `cityState(events, level)` and the build / move / remove writers | catalogue |
| `js/city/build/models.js` | `CityProjects3D[id](palette, opts)`: a 3D model per project | three.js, `js/city/utils.js`, `props.js` |
| `js/city/build/scene-kit.js` | `CityBuildKit`: stand a model on a slot, sync a scene to the state, roads, slot markers, picking, the tick | all of the above, `js/city-svg.js` |
| `js/city/build/svg.js` | `cityBuildMapSvg()`: the flat town with projects, roads and tappable slots | `js/city-svg.js`, catalogue, state |
| `css/city-build.css` | colours for the flat drawings, slot plates, the build sheet | load after `layout-city.css` |
| `city-preview.html`, `js/city/build/preview.js` | the playground, and a worked example of the whole loop | everything |
| `tests/city-state.test.js` | tests for the catalogue and the state | Node |

## The rules, in one place

- One **blueprint** per overall level gained: none at level 1, the first at level 2 (`cityBlueprintsEarned`). Free blueprints = earned minus spent.
- A **project** costs blueprints (usually 1) and goes in a **slot**. It fits when the slot is big enough and they
  share a **zone**: crossing, riverbank, low ground, knoll, under the cliff, cliff face, high plateau, peak.
- Some projects **need** another first (docks before the riverside market; a terraced street before the lookout
  or the funicular; a market square before the station).
- The two stone bridges and four stairs the town always had are **starters**: free, and they stay put.
- A **footbridge** can be upgraded to a **stone bridge** in the same slot.
- **Monuments** (victory statue, lantern arch) cost nothing and are limited by what was earned.
- **Never punish:** moving and removing are free; removing a prerequisite never knocks anything down; a build
  that can't be placed (slot taken on another device, no blueprint left) waits in `state.unplaced` and is never lost.
- Canal, dam and rail tunnel are modelled but **locked** (`later: true`), because they change the terrain.

## The event

    { date: "2026-11-14", activity: "city-build", project: "docks", slot: "b-quay", at: 1794700000000 }

Saved with `saveEvents` like everything else, so it syncs. `at` is `Date.now()` when it was placed: it orders
builds and settles who keeps a slot when two devices built in the same place (the earlier one). Moving edits the
event's `slot`; removing deletes the event.

## How it is wired into the app

Done on 2026-11-14 (see `docs/progress.md`, Round 6).

- `index.html` loads `catalogue.js`, `state.js` and `svg.js` after `js/city-svg.js`, and `css/city-build.css`.
- `js/city-home.js` computes `cityState(events, overall.level, { earned })` on every draw, shows the summary line
  and the Build button, lazy-loads `models.js` and `scene-kit.js` with the 3D files, and owns build mode: the lit
  slots (`cityLitSlots`), the sheet (`cityOpenSheet`), and saving through `commitWithUndo` (`cityCommit`).
- `js/city/scene.js` takes the state in `mount(..., city)`: `drawCity` calls `CityBuildKit.sync`, swaps the roads
  and markers, and a project added after the first draw rises into place (`startRise`). `frame` calls
  `CityBuildKit.tick`. A tap in build mode goes to `pickSlot`, then `pickProject`.
- `CITY_BRIDGES` and `CITY_STAIRS` in `js/city-svg.js` are empty: the old bridges and stairs are `CITY_STARTERS`.
- The centre building is gone; its pad is the `p-heart` slot.
- On a phone or with motion off, build mode switches the stage to the flat map (`cityFlatBuild`), because the
  still 3D view can't be turned to reach a hidden slot.

Values the app supplies: the overall level (`levelInfo(overallXp, LEVELS.overallMultiplier).level`), monuments
earned (`cityEarned`: beaten bosses; Ramadan is 0 until an event records one), and whether a streak is alive for
the train (`cityStreakAlive`: Quran or Dua).

## Good to know

- **Sizes.** One terrain cell is 2 x 2 scene units. `scene-kit.js` repeats four numbers from `terrain.js`
  (`CELL`, `RISE`, `BANK`, `WATER`) because they are private there. If you change one, change both.
- **High banks.** Docks, the watermill and the beacon take `opts.drop` (how far below the water lies) and reach
  down to it, so they work on the low west quay and the high east bank.
- **The train** shuttles when `opts.running` is true and waits at the platform when false. `sync` rebuilds the
  station when that flips.
- **Picking.** A slot hidden behind a taller one from the current camera angle can't be tapped until you orbit.
  The flat city has no such problem.
- **The flat drawings are simple on purpose**: a few boxes each, in the style of the existing flat buildings.
- **Adding a project:** one entry in `CITY_PROJECTS`, one function in `models.js`, one entry in
  `CITY_SVG_PARTS`. **Adding a slot:** one entry in `CITY_SLOTS`; the test checks it against the real terrain.
- **Other maps later:** a map is `CITY_TERRAIN` plus `CITY_PLOT` plus `CITY_SLOTS`. `cityCheckCatalogue(terrain,
  plots)` validates any combination.

## Not built yet

- The terrain-changing behaviour of the canal, dam and tunnel. Their models exist; the land does not change.
- Boats and trains travelling between places, seasons, and the sky-as-prayer-dial idea.
- A "Ramadan completed" event, which the lantern arch waits on.
- A generic building for user-made branches (that belongs with the product plan's "definitions as data" stage).
