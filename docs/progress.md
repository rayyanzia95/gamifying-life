# Progress log

Plan: `docs/round-2-brief.md`. One line per item: code, date, what changed, what's left open.

## Round 1, trust the data

| Item | Date | What changed | Open |
| --- | --- | --- | --- |
| B1 | 2026-11-14 | People, dates, books, budget and savings goal were already synced events; fixed stale "device only" comments and the empty reading-list text. | Confirm on phone + Mac with one account. |
| B3 | 2026-11-14 | Deen prayers, Health diet and Personal journal get ‹ › arrows for yesterday/today; entries for yesterday carry `backfilled: true` and show "logged late"; same XP incl. on-time bonus. | Try on phone; sleep, exercise, Quran, Dua still today-only. |
| B2 | 2026-11-14 | Deen list locks a prayer (dimmed, "opens 3:18 pm") until its window opens, unlocks on the minute; toggleDone and Home quick log refuse early ticks; tahajjud and yesterday never locked. Helpers `prayerOpensAt` / `prayerOpen` in prayer-calc.js. | A Deen tab left open past midnight keeps the old day until reload. |
| B4 | 2026-11-14 | Page-open cascade / scan wipe start only after first paint, skip in a hidden tab, and come off on the last card's animationend or 1.2 s (`pageOpenClass` in anims.js). Cards are fully visible without the class. | Check Money / Chores / Academics on the phone after a cold open. |
