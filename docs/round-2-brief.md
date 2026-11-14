# Gamifying Life: Round 2 edit brief

Nov 14, 2026 · @Rayyan

This brief lists every change found in two passes over the live site and the repo, ordered so the app gets simpler before it gets bigger. To start building, use the fuller prompt in the last section, "Continuing in Claude Code"; the short block below is the same rules in brief.

## Prompt to paste

```markdown
You are working in my repo `gamifying-life` (plain HTML/CSS/JS, GitHub Pages, Supabase sync, PWA).
I am giving you an edit brief. Rules for how we work:

1. One item per commit. Before each item, tell me in 2-3 plain sentences what you will change and why.
2. If an item is marked DECIDE, show me a small mock-up or the options and wait. Do not guess and build.
3. Keep events as the source of truth: XP and levels are always computed from events, never stored.
4. Every change must work in the Classic and City layouts, in light and dark, at 375 px wide and on desktop.
   Other layouts: do not break them, but do not extend them either.
5. After each item, tell me what to click to test it. I type the git commands myself.
6. Bump CACHE_VERSION in sw.js whenever a file is added, renamed or deleted.
7. No new libraries without asking me first.

Start with section "Bugs and correctness", item B1.
```

Item codes: **B** bug, **H** home, **L** layout, **T** theme, **D/A/He/M/P/Pe/C** branches, **F** feature, **X** remove. Items marked DECIDE need your answer first.

## Bugs and correctness

Fix these first: four of them can lose or misstate your data.

| # | Problem | Where | Fix |
| --- | --- | --- | --- |
| B1 | ~~People, important dates, the reading list, the weekly budget and the savings goal are saved on one device only.~~ Checked 2026-11-14: they are already events and sync like all others; only the "device only" wording was stale. | `people-page.js`, `personal-page.js`, `config.js` line 144 | Wording fixed. Still to confirm on two real devices. |
| B2 | A prayer can be logged before its time enters. Dhuhr was ticked at 1:19 pm while the page said "opens 1:23 pm". | `deen.js`, `quick-log.js`, `today-items.js` | Disable the chip until the window opens, with the open time shown. Tahajjud keeps its own rule. |
| B3 | Only Money has previous-day arrows. A prayer, meal or journal entry missed last night cannot be logged the next morning. | Deen, Health, Personal pages | Add the same day arrows, limited to yesterday and today. Mark backfilled entries. DECIDE: do backfilled prayers earn the on-time bonus? Suggested: no. |
| B4 | Cards start at opacity 0 and rely on an animation to appear (`anim-rise`, `anim-wipe`). On a slow or backgrounded page they stay faint or blank. Seen on Health, Money, Chores and Academics. | `css/anims.css` lines 6-30, `js/anims.js` | Cards are fully visible by default. Add the cascade class only after first paint, and remove it on `animationend` or after 1.2 s, whichever comes first. |
| B5 | Muted text on the hero panels is close to unreadable: "no budget set", "10 left, last day", boss names, sleep-graph labels. | hero panels on every branch page | Run `tools/contrast-check.js` over the hero panels in every palette. Minimum 4.5:1 for text, 3:1 for graph lines. |
| B6 | Friday Dhuhr is treated as a normal Dhuhr, though the planner already knows about Jumu'ah. | `deen.js`, `config.js` | On Fridays show Jumu'ah in place of Dhuhr: 2 fard, masjid and jama'ah assumed, its own sunnah count. DECIDE the XP. |
| B7 | Level-up celebrations are tracked per device, so each device replays old level-ups. | `level-up.js`, `city-build.js` | Store "last celebrated level" as a synced event. |
| B8 | The install splash is purple (`background_color: #4b3b75`) and then flashes to near-black. | `manifest.webmanifest` | Match it to the dark background `#1a1a18`. |

## Home page

Home shows the same action in three places and the same levels in three places; the goal is one place for each.

- **H1. One checklist.** Dishes, Water and Study blocks appear in "Due today", in Quick log and in the Today list. Keep the Today list as the only place to tick. Remove the "Due today" chips. Quick log keeps only what the list cannot do: Spend, and a free "+ Workout".
- **H2. Now strip.** Keep "Next: Dhuhr, opens 1:23 pm" and make it the top of the page. Add one tap to log the current prayer from it. After Isha, show tomorrow's Fajr time.
- **H3. Time-aware list.** Sort the Today list by time of day and dim what is not yet relevant (evening adhkar in the morning). Collapse finished groups to a single line.
- **H4. Core day.** DECIDE: pick 4 to 6 core items (for example five prayers, one study block, money logged). "Day complete" means the core is done; the other items are bonus. Show "Core 3 of 5" in place of "0 of 16 done".
- **H5. Levels shown once.** The radar, the level-bar list and the sidebar numbers repeat each other. On Home keep the level-bar list, made tappable to open each branch. Move the radar to the weekly review (F1).
- **H6. Deadline strip.** Show the next two deadlines from the planner on Home ("ASTRO quiz in 2 days"). Today it takes a tap on "Planner" to see them.
- **H7. Gentle prompts.** The `people-note` and `level-note` lines exist but are hidden. Use one line at most, for example "Mom is awake for another 2 hours".

## Layout, navigation and phone

The phone is where logging happens, and it is currently the weakest view: one long column with the checklist at the very bottom.

- **L1. Phone order.** At 375 px the order is Now, chips, Quick log, radar, levels, then the Today list after about 2,200 px of scrolling. New order: Now strip, Today list, level bars. Everything else moves off Home.
- **L2. Bottom tab bar on phone.** Replace the hamburger menu with five tabs: Home, Deen, Planner, Money, More. Thumb reach matters for a 3-second log.
- **L3. Shorter sidebar.** Twelve entries today. Fold Study guides into Academics, fold Appearance into Settings (it is already a Settings tab), and put Rewards under the overall level. That leaves Home, seven branches, Planner and Settings.
- **L4. Planner in the sidebar.** The best page in the app has no sidebar entry; it is reached only from the "Planner" pill or through Academics.
- **L5. Shorter branch heroes.** Each branch page opens with a hero about 400 px tall, so the controls start below the fold. Cap heroes near 180 px on desktop and 140 px on phone, or put the controls beside the hero on wide screens.
- **L6. Use the width.** On desktop, Health, Money and Chores place one narrow card on the left and leave the right half empty. Use a two-column grid: log on the left, history on the right.
- **L7. Bigger tap targets.** The minus and plus steppers and the prayer modifier pills are about 24 to 30 px. Raise them to at least 44 px on touch screens.
- **L8. Deen prayer grid.** Six chips in two columns with large gaps. Use one row per prayer: name, time, and the on time, jama'ah, masjid and sunnah controls inline, in day order.
- **L9. Home-screen shortcuts.** Add `shortcuts` to the manifest (Log spend, Deen, Planner) so a long press on the icon jumps straight in.

## Theme and appearance

Appearance holds 6 layouts, about 24 dark palettes, 10 light palettes, 11 level-up effects and 16 or more effect switches; the aim is to keep the fun and drop the upkeep.

- **T1. Two supported layouts.** DECIDE which two you open daily. Suggested: Classic and City. Move Cockpit HUD, Orrery, Command wheel and Grimoire under an "Experimental" heading that new features do not have to support.
- **T2. Load only the active layout.** Home loads 13 stylesheets and about 50 scripts for all six layouts on every visit. Load the CSS and JS of the chosen layout only.
- **T3. Curated palettes.** Keep 6 dark and 3 light as a first screen with swatches, and put the rest behind "More palettes". Show each as a small preview card, not a radio list.
- **T4. Effects as presets.** Keep Off, Recommended and All on. Hide the 16 single switches under "Advanced".
- **T5. One level-up effect.** Pick a favourite and keep one alternative. Remove the other nine.
- **T6. City as the reward.** The Cliffside City is the most distinctive idea in the app, and today it lives in a layout option. DECIDE: make the city a page of its own ("City") where each branch's building grows with its level, reachable from any layout. That makes levels visible without changing how you log.
- **T7. Branch colour discipline.** Use each branch colour for its dot, its bar and its page accent only. Keep red and orange for overdue and due-soon so they always mean urgency.
- **T8. Type scale.** The small-caps serif titles and the system sans body work well together. Fix a scale of four sizes (12, 14, 17, 24) and remove one-off sizes.
- **T9. Light mode pass.** Light mode was not reviewed in this round. Check every branch hero in light mode once the contrast fix (B5) is in.

## Branch by branch

Each branch logs well today; most of these edits add the look-back each one is missing.

| # | Branch | Edit |
| --- | --- | --- |
| D1 | Deen | Show a 7-day strip per prayer (prayed, on time, masjid) under the dial. Today the page shows only today. |
| D2 | Deen | Ramadan countdown on the Quran bar: "86 days, 0 of 30 juz, on pace needs 1 juz every 2.9 days". `RAMADAN_START` already exists in config. |
| D3 | Deen | Qada: DECIDE whether a missed prayer made up later can be logged as "made up" for base XP with no bonus. |
| D4 | Deen | MSA is still not in any branch. DECIDE: a Deen sub-skill "Community" for meetings and reel editing. |
| A1 | Academics | A grade tracker per course: weight, mark, and the current standing. The planner knows every assessment already. |
| A2 | Academics | A study timer: start a 30-minute block, and it logs itself when it ends. Counting blocks by hand invites forgetting. |
| A3 | Academics | Boss fights show "0 / 10 damage". Add what one hit is ("1 study block for PHYS = 1 damage") and a defeated state after the exam date. |
| He1 | Health | Sleep needs two time pickers each morning. Add "same as usual" presets and a one-tap "woke now". |
| He2 | Health | Split Exercise into Gym and Climbing as the handoff planned, with one tap each. The page has a single 0 / 3 counter. |
| He3 | Health | Diet asks Healthy, Okay or Junk for three meals a day, which is nine judgments. DECIDE: reduce to one daily rating, or keep meals and drop the rating to two options. |
| M1 | Money | An optional note on a spend, and edit or delete on each row of the day. |
| M2 | Money | A first-run prompt for the weekly budget. Without it the ring reads "no budget set" and the payout never starts. |
| M3 | Money | A month view by category (Food out, Groceries, Transport, Fun, Other) as five bars. Keep it behind a tap, since the handoff asked for money to stay private in the UI. |
| M4 | Money | A privacy toggle that blurs amounts until tapped, for use in public. |
| P1 | Personal | Therapy appears as "Session this week" with no context. Keep it quiet as planned, but give it a clear tick and no streak. |
| P2 | Personal | Journal: an optional one-line entry ("one thing from today") stored with the tick, so the journal streak has something to read back. |
| P3 | Personal | Books: pages-per-day target per book and an estimated finish date. |
| Pe1 | People | First-run setup: add Mom, siblings, grandparents, uncles and your wife in one screen with a contact rhythm each (weekly, monthly). |
| Pe2 | People | "Best time to call Lahore": show the overlap of your free blocks and their waking hours, using the planner schedule. |
| Pe3 | People | Date reminders 7 days and 1 day ahead, shown on Home. The candle streak stays parked. |
| C1 | Chores | An in-app editor for the chore list and weekly targets. Today a change means editing `config.js` and pushing. |
| C2 | Chores | "Ironing: due" and "Dusting: due" give no reason. Show the rule ("every 2 weeks, last done Oct 31"). |

## New features, in priority order

The app records a lot and shows almost none of it back; F1 to F3 fix that and matter more than anything below them.

1. **F1. Weekly review.** A page that opens on Sunday for the week just ended: XP per branch, the radar, streaks kept and paused, chores done, budget payout, exams ahead, and one free-text line, "what I'll change next week". Keep past reviews as a list.
2. **F2. History per branch.** A 12-week heatmap on each branch page (one square per day, shaded by XP). Chores already has the 8-week star row; give the others the same.
3. **F3. Reminders.** iOS allows web push for home-screen apps from iOS 16.4. DECIDE which reminders you want. Suggested: a prayer nudge 15 minutes before a window closes if it is unlogged, a 9 pm "log today's spend", and the Sunday review. Each one off by default.
4. **F4. Undo everywhere.** Chores and Quick log already show "ticked, Undo" for 6 seconds. Use the same line for prayers, meals, sleep and money.
5. **F5. Config in the app.** Editors for chores (C1), people (Pe1), daily targets (water, study blocks, pages) and the core-day list (H4). Stored as synced events, so the repo holds defaults only.
6. **F6. Term rollover.** Winter 2027 starts in January. Courses and deadlines live in `config-academics.js` and `schedule.js`. Add an import: paste a list of deadlines or a CSV, and the planner fills in.
7. **F7. Ramadan mode.** From 1 Ramadan (expected February 8, 2027): fasting tick, taraweeh, daily juz target, iftar-shifted meals, and sleep scoring that expects a split night.
8. **F8. Perk starters.** The Rewards page opens empty. Offer five example perks to edit, and announce an earned perk on the level-up screen.
9. **F9. Sync status.** The small dot in the top corner has no label. Make it say "Synced 2 min ago", "Offline, 3 changes waiting" or "Signed out" on tap.
10. **F10. First-run setup.** Five screens: sign in, weekly budget, people, core-day items, layout. It also covers B1 and M2.
11. **F11. Export.** Backup exists. Add a CSV export per branch for your own analysis, a good CMPUT exercise.

## Remove or park

Each removal below cuts code you would otherwise have to keep working through every later change.

- **X1.** The "Due today" chips on Home (replaced by H1).
- **X2.** The radar on Home (moves to F1).
- **X3.** Level badges in the sidebar until at least one branch passes level 1; a column of identical 1s says nothing.
- **X4.** Nine of the eleven level-up effects (T5).
- **X5.** Effect switches that exist mainly as demos: glitch on tick, boot scan, typing-cursor titles, scanlines. Keep them only inside "All on".
- **X6.** Water in Quick log and "Due today"; it keeps one home in the Today list and on Health.
- **X7.** The "Creatine" tick unless you use it daily. DECIDE.
- **X8.** Park, do not delete: Orrery 3D tilt, Command wheel, Grimoire ledger. Move them under Experimental (T1) and stop loading them by default (T2).
- **X9.** The README is one line. Replace it with what the app is, a screenshot, and how to run it. This repo is a portfolio piece.

## Interactive and 3D ideas

Pick one signature experience and build it deep, in place of six shallow layouts; the repo already has the raw material in `js/city/` (a Three.js city for wide screens) and `sun.js`.

What makes the Lando Norris site work, per the [Syntax stack breakdown](https://recapio.com/digest/this-website-is-insane-stack-explained-by-syntax) and its [DesignRush entry](https://www.designrush.com/best-designs/websites/lando-norris-website-design): Three.js scenes, depth maps and custom shaders, Rive for small interactive pieces, cursor-reactive overlays, scroll-driven storytelling, and a flat style with no drop shadows or filters so it stays smooth. The ideas below borrow those methods, not its look.

**One rule first: log first, spectacle second.** You open this app many times a day to tick something in three seconds. The checklist must work before any 3D loads, and no animation may delay a tap. Cinematic effects belong where you look, not where you log.

### Three directions for Home (DECIDE one)

| # | Direction | What it is | Effort |
| --- | --- | --- | --- |
| I1 | Living city | The existing 3D city becomes Home on every screen size. Tap a building, the camera flies to it and that branch's log sheet slides up over the scene. | Medium: the scene exists |
| I2 | Skill-tree constellation | A pan-and-zoom star map. Each branch is a constellation, each tracker a star that brightens with XP, and lines light up as sub-skills level. None of the six layouts is an actual skill tree, which was the original idea. | High: new canvas view |
| I3 | Journey path | A winding road where each day is a step and each week a landmark, with exams as boss gates on the road ahead. Scroll back to see your history. | Medium |

### Making the city feel alive (if I1)

- **I4. The sky is the prayer dial.** The sun moves across the scene in real Edmonton time using `sun.js`. Five soft markers on its arc are the prayer windows. Light shifts from dawn blue to noon white to maghrib orange, and the masjid's lamp comes on when a window opens.
- **I5. Buildings react to today.** Windows already light with today's XP. Add: smoke from a chimney when chores are done, boats on the river for each active streak, a flag on the building of your highest branch, scaffolding on a building close to its next tier.
- **I6. Level-up as a short cinematic.** The camera orbits the building once while it rebuilds floor by floor, then the perk card appears. Three seconds, skippable with a tap.
- **I7. Seasons.** Snow from November to March, as in Edmonton. Lanterns across the city during Ramadan.
- **I8. A phone version.** The 3D city is wide-screen only today. On phones: half pixel ratio, baked lighting, 30 frames a second, and rendering paused when nothing moves.

### Interactions that work in any layout

- **I9. Tilt and depth.** The level badge and hero panel tilt slightly with the cursor on desktop and with the phone's gyroscope on mobile (iOS asks permission once). This is the same idea as the depth-map portrait on the Lando site.
- **I10. Light that follows the pointer.** A soft glow in the branch colour tracks the cursor across cards, done with one CSS gradient and two custom properties. No WebGL needed.
- **I11. Page transitions.** With the View Transitions API, a branch's building or dot morphs into that page's header when you navigate. Browsers without it get a normal page load.
- **I12. Ticks with weight.** The tick draws itself, the bar springs, and the XP number rolls up. Optional short sounds, and vibration on Android (iOS Safari does not support the vibration API).
- **I13. Rive for small living icons.** The streak flame, the rest-day token and the boss health bar as Rive state machines: tiny files that react to input.
- **I14. Hold to complete.** For big items (an exam, a finished book), press and hold while a ring fills. It makes large wins feel different from small ticks.

### Where the full cinematic treatment belongs

- **I15. The weekly review as a scroll story.** This is read once a week, so it can be slow and beautiful. Scrolling moves the camera through the city, one full-screen chapter per branch: numbers count up, the radar draws itself, streak boats sail past. End on "what I'll change next week".
- **I16. Year in review.** The same scroll story for a term or a year. People share these, which matters if this becomes a product.
- **I17. The public landing page.** If you sell this, the marketing site is where to go all out: scroll-driven city fly-through, cursor-reactive hero, live demo you can tick. Visitors see it once, so load time matters less than in the app.

### Performance rules for all of the above

- Animate only `transform` and `opacity`. No blur filters or box shadows on moving elements.
- One WebGL canvas per page. Load Three.js only when the scene is about to show.
- Update Three.js from r128 (2021) to a current version, imported as a module.
- Stop rendering when the tab is hidden or the scene has been still for 10 seconds.
- A "Lite" switch and reduced-motion support that fall back to the flat SVG city.
- Budget: Home is tappable within 2 seconds on your phone on mobile data. Test before and after.

Libraries to consider (DECIDE, since the prompt forbids adding any without asking): GSAP with ScrollTrigger for the scroll stories, Lenis for smooth scrolling, Rive for icons. Three.js is already in use.

**How this fits the rest of the brief:** it replaces T1 and T6. Keep Classic as the fast default, make your chosen direction the one "full" layout, and retire the other four. Build it after Round 3, because I15 needs the weekly review to exist.

## The city builder (Round 6)

The overall level grows the whole town through choices you make, with the river and the mountain as the two directions to build toward. This replaces the central building and is the detailed plan for direction I1.

### Design, as agreed

- **Blueprints.** Each overall level earns one blueprint. Blueprints available = overall level minus blueprints spent. Nothing is stored as a total; it is computed from events.
- **Projects.** A blueprint is spent on a project from a menu. Projects have prerequisites, so the menu is a small tech tree.
- **Slots and zones.** The map has fixed slots, each in a zone read from the terrain grid: riverbank (next to `~`), plateau (level 2 or 3, flat), cliff (a step between levels), peak (level 3 edge). A project lists the zones it fits. No free placement.
- **One fixed map for version one.** The river and rock exist from day one as wilderness and the town grows toward them. Buildings never move on their own.
- **Who drives what.** Overall level: blueprints, land and infrastructure. Branch level: that branch's building tier, as today. Achievements: monuments. Today's XP and streaks: lights and movement.
- **No punishment.** Moving or swapping a project is free. A paused streak parks the train at the station; it never removes anything.

### First project list

| Toward the river | Toward the mountain |
| --- | --- |
| Footbridge | Rock stairs |
| Stone bridge (needs Footbridge) | Terraced street (needs Rock stairs) |
| Docks and boats (needs a bridge) | Lookout (needs Terraced street) |
| Watermill | Hilltop garden |
| Riverside market (needs Docks) | Quarry |
| Canal (later: changes terrain) | Funicular (needs Terraced street) |
| Dam and reservoir (later: changes terrain) | Rail tunnel (later: changes terrain) |

Shared: paved main street, market square, railway station. Either-or choices: the Deen landmark on the hilltop or on the riverside; the station on the plateau or by the docks.

### What exists in the repo

- `js/city-svg.js`: the terrain grid `CITY_TERRAIN`, fixed positions in `CITY_PLOT`, `CITY_BRIDGES` and `CITY_STAIRS`, and the flat SVG renderer.
- `js/city/scene.js`, `terrain.js`, `props.js`, `utils.js`: the Three.js city, wide screens only, built once from those constants.
- `js/city/buildings/*.js`: one generator per branch plus `centre.js`, about 160 lines each, six tiers. No model files.

### Commits for the first slice

1. **R6-1. Catalogue and slots.** Add `js/city/projects.js`: the project list (id, name, zones, needs) and a slot list derived from the terrain plus a few hand-placed entries. No visual change.
2. **R6-2. City state from events.** A pure function `cityState(events)` returning what is built where and how many blueprints are free. Unit tests, including overspending.
3. **R6-3. Bridges and stairs become projects.** Seed events so the current two bridges and four stairs still appear. Both renderers read `cityState` and no longer read `CITY_BRIDGES` and `CITY_STAIRS`.
4. **R6-4. Renderers add and remove one object.** Scene objects are keyed by slot id so a build or a move changes one thing, with the existing floor-by-floor build animation.
5. **R6-5. Build mode in the SVG city.** A "Build" button, glowing free slots, a sheet listing the projects that fit, confirm, undo. Works on phones.
6. **R6-6. Build mode in 3D.** The same flow with raycasting to find the tapped slot. Wide screens only for now.
7. **R6-7. Six projects.** Footbridge, Stone bridge, Docks; Rock stairs, Terraced street, Lookout. Each as a 3D generator and an SVG drawing.
8. **R6-8. Roads.** Predefined road segments that appear when the slots at both ends are filled.
9. **R6-9. Sync rule.** If two devices spend the same blueprint, the later build returns to the inventory unplaced. Test it in `tests/`.
10. **R6-10. Retire the centre building.** The overall level shows as the blueprint count and the town's stage name (Hamlet, Village, Town, Rail town, Cliffside city, Capital at levels 1, 3, 5, 7, 10, 15).

Left for later: terrain-changing projects, monuments from achievements, moving trains and boats, seasons, build mode in 3D on phones, more maps, a second settlement.

Depends on: Rounds 1 to 3 finished. A generic building for user-made branches depends on the product plan's "definitions as data" stage.

## Commit order and open decisions

Work in four rounds so the app is usable after each one.

1. **Round 1, trust the data:** B1, B2, B3, B4, B5, B8, F4.
2. **Round 2, simplify Home and phone:** H1, H2, H3, H5, X1 to X3, L1, L2, L3, L4, L7.
3. **Round 3, look back:** F1, F2, D1, D2, F9, H6.
4. **Round 4, trim and grow:** T1 to T5, X4, X5, X8, then C1, Pe1, M1, M2, F5, and the remaining branch items as you want them.

Settle these before the round they belong to:

- [ ] B3: do backfilled prayers earn the on-time bonus?
- [ ] B6: Jumu'ah XP and sunnah count.
- [ ] H4: which 4 to 6 items make a core day?
- [ ] T1: which two layouts stay supported?
- [ ] T6: does the city become its own page?
- [ ] D3: can a made-up (qada) prayer be logged?
- [ ] D4: where does MSA go?
- [ ] He3: one daily diet rating, or per meal?
- [ ] F3: which reminders, and at what times?
- [ ] X7: keep or drop Creatine?

* [ ] Interactive Home: I1 living city, I2 skill-tree constellation, or I3 journey path?
* [ ] Which new libraries are allowed: GSAP, Lenis, Rive?

**Round 5, the signature experience:** the chosen direction (I1, I2 or I3), then I9 to I12, then I15.

**Round 6, the city builder:** R6-1 to R6-10 in order.

- [ ] City: does the very first choice pick the site (valley, coast, mountain foot), or does everyone start on the same map? Suggested for version one: same map.
- [ ] City: which six projects go in the first slice, if not the six listed in R6-7?

## Continuing in Claude Code

Save this brief in the repo as `docs/round-2-brief.md` (export as Markdown), commit it, then open Claude Code in the repo folder and paste the prompt below. It carries over what was decided in chat so nothing has to be explained twice.

```markdown
Read docs/round-2-brief.md in full before doing anything. It is the plan for this repo.

Context you need:
- I'm Rayyan. This is my gamified life planner (plain HTML/CSS/JS, GitHub Pages, Supabase sync, PWA).
  I'm learning as we build: explain the why of each step in plain language, one concept at a time.
- I type every git command myself. Tell me the command and what it does; do not run git for me.
- Events are the source of truth. XP, levels, blueprints and city state are always computed from events.
- Never punish: a miss pauses a streak and nothing is ever taken away.
- The week runs Sunday to Saturday. Time zone is America/Edmonton, UTC-6 all year.

How we work:
1. One brief item per commit, in the order given under "Commit order and open decisions".
2. Before each item: say in 2-3 sentences what you will change, in which files, and why. Wait for my OK.
3. Items marked DECIDE: show me the options or a small mock-up and wait. Do not guess.
4. After each item: tell me exactly what to click to test it on desktop and at 375 px wide,
   then give me the git commands and a commit message that starts with the item code (for example "B1: sync people and dates").
5. Every change must work in the Classic and City layouts, light and dark. Do not extend the other four layouts.
6. Bump CACHE_VERSION in sw.js whenever a file is added, renamed or deleted.
7. No new libraries without asking me.
8. Each round gets its own git branch (round-1, round-2, ...). Remind me to create it and to merge it when the round is done.
9. Keep a running log in docs/progress.md: item code, date, one line on what changed, anything left open.
   At the start of every new session, read docs/round-2-brief.md and docs/progress.md first.
10. If something in the brief turns out to be wrong or already done when you read the code, say so and suggest the fix to the brief.

Already decided (do not ask again):
- The city grows through my choices: blueprints, projects, fixed slots, river side and mountain side (see "The city builder").
- Undo already exists for chores and quick log; extend that same pattern.
- Moving or swapping a city project is always free.

Still open (ask me when we reach them): everything in the checklist at the end of the brief.

Start now: confirm you have read the brief, list the Round 1 items in order with one line each,
ask me the one DECIDE question Round 1 needs (B3), and then begin B1.
```

Tips for the sessions:

- Start a new Claude Code session for each round; long sessions lose track of early details. The progress log is what carries over.
- If a change looks bigger than expected, ask it to split the item into two commits.
- Test on your phone after every deploy, not only in the desktop browser.
- Bring design questions back to this chat; keep Claude Code for building.

Not checked in this review: light mode, the sign-in and sync flow with a real account, and the five non-default layouts beyond the Appearance preview.
