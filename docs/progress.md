# Progress log

Plan: `docs/round-2-brief.md`. One line per item: code, date, what changed, what's left open.

## Round 1, trust the data

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| B1 | 2026-11-14 | People, dates, books, budget and savings goal were already synced events; fixed stale "device only" comments and the empty reading-list text. | Confirm on phone + Mac with one account. |
| B3 | 2026-11-14 | Deen prayers, Health diet and Personal journal get ‹ › arrows for yesterday/today; entries for yesterday carry `backfilled: true` and show "logged late"; same XP incl. on-time bonus. | Try on phone; sleep, exercise, Quran, Dua still today-only. |
| B2 | 2026-11-14 | Deen list locks a prayer (dimmed, "opens 3:18 pm") until its window opens, unlocks on the minute; toggleDone refuses early ticks (Deen page only; Home already blocks them); tahajjud and yesterday never locked. Helpers `prayerOpensAt` / `prayerOpen` in prayer-calc.js. | A Deen tab left open past midnight keeps the old day until reload. |
| B8 | 2026-11-14 | Manifest `background_color` #4b3b75 → #1a1a18 (matches `theme_color`), so the install splash no longer flashes purple then dark. | Installed copies update when the browser re-reads the manifest; reinstall to see it now. iOS mostly ignores it. |
| — | 2026-11-14 | Brief corrected: B1 wording only, B2 Deen only, B4 + B5 withdrawn (reverted d122cc9, 8996a82), H2 only after-Isha Fajr is new, L6 optional. |  |
| F4 | 2026-11-14 | Shared `commitWithUndo` (storage.js) + `showUndo` toast (ui.js, CSS in base.css), moved from Home. "… · Undo" for 6 s on Deen prayer tick/untick, Health meal + sleep, Money spend add + remove. Home quick log uses the same pieces. | Chores keeps its inline line; no-spend toggle and other writers have no undo yet. |

## Round 2, simplify Home and phone

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| H1 | 2026-11-14 | Home: "Due today" chips gone; Quick log keeps only + Spend and + Workout; Today list is the one place to tick. Study row opens the course picker (done row still takes one back). | Extra dishes/water past the goal now only on Chores/Health pages. |
| H2 | 2026-11-14 | Home Now strip: once Isha is ticked it switches to "Next: Fajr tomorrow · Opens 6:57 am · in 7 h 7 min" (from tomorrow's prayer times); the rarely-seen "Prayers done for today" line shows the same. Untick Isha via Undo or the Today list. | Isha still shows the tick button until it's prayed. |
| L2, L3, L4, X3 | 2026-11-14 | Phones get a bottom tab bar (Home, Deen, Planner, Health, More = the drawer); ☰ is hidden there. Sidebar: Home, Planner, the 7 branches, Review, Settings. Study guides, Rewards and Appearance are drawer-only rows (reached from Academics, Home and Settings on a wide screen). Nav level numbers hide until a branch passes level 1. Undo toast sits above the bar. | Tabs changed to Deen, Planner, Health on 2026-11-14 (Money moved to More); change `NAV_TABS` in nav.js. |
| H3 | 2026-11-14 | Today list in day order (morning adhkar after Fajr, evening after Asr), evening adhkar dimmed until Asr, a finished group folds to its header (tap to reopen). | Folded state is per page load. |
| L1 | 2026-11-14 | One-column Home (under 1000px, Classic): centrepiece on top (since 2026-11-14, like the other layouts), then Now, Today list, Quick log. | Other layouts: centrepiece, Now, Quick log, Today. |
| L7 | 2026-11-14 | Already in place before this round (44px hit areas in base.css "Polish pass"); nothing changed. |  |
| H5, X2 | 2026-11-14 | Not done: the ring + web card on Home is a design Rayyan picked on 2026-11-12, so it stays until he says otherwise. The balance web now also exists on the weekly review. | Decided 2026-11-14: the ring + web stays on Home. |

## Round 3, look back

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| F9 | 2026-11-14 | Tapping the sync dot shows a line ("Synced 2 min ago", "Offline · 3 changes waiting", "Not signed in · this device only"); a second tap opens Sync settings. Last send time kept in localStorage `gamifying-life-last-sync`. | Check wording with a real signed-in account. |
| F2 | 2026-11-14 | `js/history.js`: every branch page ends with a 12-week grid shaded by that branch's XP, plus active days, this week vs last, best day. `xpByDay(events, from, to)` is shared with the review. | Weekly bonuses are not in the daily squares. |
| D1, D2 | 2026-11-14 | `js/prayer-week.js`: Deen shows the last 7 days of the five prayers (prayed / on time / masjid ring). D2 was mostly built already (Quran card has the countdown and pace); the top Quran bar now carries "N days to Ramadan" too. |  |
| H6 | 2026-11-14 | Home's Now card lists the next two unticked deadlines within 21 days, exams in the exam colour, linking to the Planner. |  |
| F1 | 2026-11-14 | `review.html` + `js/review-page.js` + `css/review.css`: a week at a time (‹ ›; opens on last week on a Sunday): XP by branch against the week before, balance web of days active, the week in numbers, current streaks, next two weeks, one note per week (`{ date: <Sunday>, activity: "review", note }`, no XP), earlier notes. In the nav and Home's header. | Sleep, diet and study streaks live in page files, so only Quran, Dua and Chores streaks show. Money shows days logged and payout XP, never amounts. |

## Round 6, the city builder

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| R6-1, R6-2 | 2026-11-14 | `js/city/build/catalogue.js` (19 projects, 29 slots, starters, roads, stages) and `state.js` (`cityState(events, level)`, build / move / remove). `node tests/city-state.test.js`, 22 checks. | One blueprint per overall level gained; the first comes at level 2 (decided 2026-11-14). |
| R6-7, R6-8 | 2026-11-14 | `models.js` (a 3D model per project), `scene-kit.js` (CityBuildKit), `svg.js` (flat drawings), `css/city-build.css`, `city-preview.html` playground, `docs/city-kit.md`. | Canal, dam and tunnel are modelled but locked (they change terrain). Flat drawings are simple boxes. |
| R6-3 to R6-6, R6-9, R6-10 | 2026-11-14 | City Home reads `cityState`: the two bridges and four stairs are starter projects (`CITY_BRIDGES` / `CITY_STAIRS` are now empty), a Build button turns on build mode (glowing slots, a sheet to build, move, remove, all with Undo), 3D on wide screens and the flat map on phones. The centre tower is gone (`buildings/centre.js` deleted, pad is the "Town heart" slot); the overall level shows as "Village · 2 blueprints". Event: `{ date, activity: "city-build", project, slot, at }`. sw cache v4. | Victory statues count beaten bosses; the lantern arch needs a "Ramadan completed" event that doesn't exist yet. The train runs while the Quran or Dua streak is alive. Not tried on a real phone or GPU. |
| R6 preview | 2026-11-14 | The build sheet shows the chosen blueprint turning in a small 3D window (`CityBuildKit.showcase()`, one shared WebGL renderer); tap a card to swap, Build still builds. Still frame with reduced motion; hidden without WebGL. | Wide models sit smaller than tall ones; the grass tile can clip on tall ones. |

## Round 4, Phase A: Ramadan completed

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| A | 2026-11-14 | `RAMADAN_END` (expected 2027-03-09) in `config.js`; Deen shows a quiet "Ramadan completed" button from Eid through Eid + 6 (`ramadanButtonOpen` in `deen.js`), once per Ramadan (`{ date, activity: "ramadan-complete", year }`, Undo toast, no XP). `ramadansCompleted(events)` in `state.js` counts distinct years and feeds `cityEarned`, so the lantern arch is earnable. Tests in `tests/city-state.test.js`. | Update `RAMADAN_START`/`RAMADAN_END` on sighting. No Hijri label saved (no helper exists). |

## Rewards: example perks

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| Perk starters | 2026-11-14 | `PERK_STARTERS` (five examples) in `config.js`; Rewards shows "Some ideas to start" above Perks only when there is no `perk` and no `perk-starters-done` event (`perkStartersOpen`). Edit text and level, drop rows with ×, then "Keep these" (saves normal perk events + `{ activity: "perk-starters-done" }`, one Undo) or "Start empty" (done event only). No XP, sync needs nothing special. `node tests/rewards.test.js`. | Not looked at in a browser yet. |
