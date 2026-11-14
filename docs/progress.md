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
