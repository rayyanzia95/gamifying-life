# City builder kit

Everything needed for the choice-based city (Round 6 of the brief): what can be built, where, the rules, the 3D
models, the flat drawings, tests, and a preview page to try it all. **Every file here is new. Nothing in the app
is changed**, so dropping this in can't break what is already there.

## Try it first

From the repo folder:

    python3 -m http.server 8000

Then open `http://localhost:8000/city-preview.html`. (It needs to be online once to fetch three.js.)

- **Town (3D):** tap a glowing slot, pick a project, watch it appear. Tap a project to move or remove it.
- **Town (flat):** the same town as the SVG city phones get.
- **Model gallery:** every model on a turntable, including the three "later" ones.
- The sliders set the overall level (one blueprint per level) and the branch buildings' tier.
- The preview keeps its builds under its own storage key, so it never touches your real events.

Run the tests with `node tests/city-state.test.js` (21 checks).

## The files

| File | What it is | Needs |
| --- | --- | --- |
| `js/city/build/catalogue.js` | 19 projects, 28 slots, the starter builds, roads, stage names | nothing |
| `js/city/build/state.js` | `cityState(events, level)` and the build / move / remove writers | catalogue |
| `js/city/build/models.js` | `CityProjects3D[id](palette, opts)`: a 3D model per project | three.js, `js/city/utils.js`, `props.js` |
| `js/city/build/scene-kit.js` | `CityBuildKit`: stand a model on a slot, sync a scene to the state, roads, slot markers, picking, the tick | all of the above, `js/city-svg.js` |
| `js/city/build/svg.js` | `cityBuildMapSvg()`: the flat town with projects, roads and tappable slots | `js/city-svg.js`, catalogue, state |
| `css/city-build.css` | colours for the flat drawings, slot plates, the build sheet | load after `layout-city.css` |
| `city-preview.html`, `js/city/build/preview.js` | the playground, and a worked example of the whole loop | everything |
| `tests/city-state.test.js` | tests for the catalogue and the state | Node |

## The rules, in one place

- One **blueprint** per overall level (`cityBlueprintsEarned`). Free blueprints = earned minus spent.
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

## Wiring it into the app

These are the R6 commits from the brief, with what the kit already covers.

1. **R6-1, R6-2 (done by the kit).** Add the two script tags, `catalogue.js` then `state.js`, after
   `js/city-svg.js` on Home. Add `tests/city-state.test.js`. Nothing visible changes.
2. **R6-3. Starters replace the fixed tables.** `js/city/terrain.js` draws bridges and stairs from
   `CITY_BRIDGES` and `CITY_STAIRS`; `cityMapSvg` does the same. Empty those two arrays (or delete `addBridges`
   and `addStairs`) and draw them from `cityState()` as below. The town should look the same as before.
3. **R6-4. The 3D scene reads the state.** In `js/city/scene.js`:
   - keep `placed = new Map()` beside `s.districts`;
   - in `mount`, call `CityBuildKit.sync(s.scene, state, placed, { running })` and swap in
     `CityBuildKit.roads(state)`;
   - in `frame`, replace `CityUtils.tick(s.scene, t)` with `CityBuildKit.tick(s.scene, t)` (it calls the old one);
   - run `collect(group)` on each group `sync` returns in `added`, so their windows follow the glow rules, and
     optionally `startBuild`-style clipping for the rise animation;
   - add `models.js` and `scene-kit.js` to `CITY_FILES` in `js/city-home.js`, after `props.js`.
4. **R6-5. Build mode in the flat city.** In `js/city-home.js`, call `cityBuildMapSvg(items, state, label,
   { build })` where it calls `cityMapSvg` today. A click on `[data-slot]` opens the sheet. `preview.js` has the
   sheet (`slotSheet`, `optionRow`) to copy; its classes are in `css/city-build.css`.
5. **R6-6. Build mode in 3D.** Add `CityBuildKit.markers(state)` to the scene while building, and in
   `watchPointer` try `CityBuildKit.pickSlot` first, then `CityBuildKit.pickProject`, before the existing
   "open the branch page" behaviour.
6. **R6-7 (done by the kit).** All the models exist, not only the first six.
7. **R6-8 (done by the kit).** `cityRoads(state)`, `CityBuildKit.roads` and the flat version.
8. **R6-9 (done by the kit).** The "earlier build keeps the slot" rule and its test.
9. **R6-10. Retire the centre building.** Drop `centre` from `CITY_DISTRICTS` and `CITY_PLOT`, and show
   `citySummary(state)` ("Village · 2 blueprints") where the centre's tag was. Its pad (cells 5-6, rows 2-3)
   can then become a new 2 x 2 plateau slot in `CITY_SLOTS`.

Two values the app has to supply:

- **The overall level:** `levelInfo(overallXp, LEVELS.overallMultiplier).level`, as `home.js` already computes.
- **Monuments earned:** `{ boss, ramadan }`. For bosses, count the exams whose boss reached 0 HP and were ticked
  (`bossState` in `js/score-academics.js`; `bossBonusXp` already finds them). Ramadan has no "completed" event
  yet, so pass 0 until one exists.
- **Is a streak alive** (for the train): any of the page streaks with `days > 0 && !paused`.

Also: add the new files to `LOCAL_FILES` in `sw.js` and bump `CACHE_VERSION`. Leave `city-preview.html` out of
the service worker list; it is a development page.

## A prompt for Claude Code

    Read docs/city-kit.md and the files in js/city/build/. Open city-preview.html locally to see the kit working.
    Then wire it into the app following "Wiring it into the app", one numbered step per commit, starting at
    step 2 (R6-3). Before each step tell me which existing files you will change and why. Do not edit the files
    in js/city/build/ unless a test fails; if you think one needs changing, tell me first. After each step, tell
    me what to click to check it, run `node tests/city-state.test.js`, and give me the git commands.

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

## Not included

- The in-app wiring itself (steps 2 to 5 and 9 above).
- The terrain-changing behaviour of the canal, dam and tunnel. Their models exist; the land does not change.
- Boats and trains travelling between places, seasons, and the sky-as-prayer-dial idea.
- A generic building for user-made branches (that belongs with the product plan's "definitions as data" stage).
