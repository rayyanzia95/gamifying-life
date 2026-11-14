// Sync's pure logic: comparing events, applying rows fetched from the cloud, and merging
// duplicates. No network and no localStorage here, so every function is easy to test.
// Loads before sync.js.

// The event without its id: that's the row's `data` column (the id has its own column).
function eventData({ id, ...data }) {
  return data;
}

// JSON with the keys sorted. Postgres stores JSON keys in its own order, so plain
// JSON.stringify would call {date, activity} and {activity, date} different.
function canonical(data) {
  return JSON.stringify(data, Object.keys(data).sort());
}

// Apply fetched rows to this device's events. `synced` is what the cloud had as far as this
// device knew ({ id: canonical JSON }). A local change that hasn't been sent yet wins over the
// cloud: it goes up next and overwrites it. Returns new lists; nothing is changed in place.
function applyRows(events, synced, rows) {
  const byId = new Map(events.map(e => [e.id, e]));
  const nextSynced = { ...synced };
  for (const row of rows) {
    const local = byId.get(row.id);
    const localUnsent = local
      ? synced[row.id] !== undefined && synced[row.id] !== canonical(eventData(local)) // edited here, not sent
      : synced[row.id] !== undefined;                                                  // removed here, not sent
    if (localUnsent) continue;
    if (row.deleted) {
      byId.delete(row.id);
      delete nextSynced[row.id];
    } else {
      byId.set(row.id, { ...row.data, id: row.id });
      nextSynced[row.id] = canonical(row.data);
    }
  }
  return { events: [...byId.values()], synced: nextSynced };
}

// ---- Duplicates: the same thing logged on both devices before they synced ----

// Kinds the app keeps one of per day. Chores, study blocks, exercise and spends really can
// repeat, so they're never merged.
const ONE_PER_DAY = ["sleep", "diet", "quran", "dua-after-prayers", "dua", "no-spend", "journal"];

function duplicateKey(e) {
  if (e.prayer) return `${e.date}|prayer|${e.prayer}|${e.set}`;
  if (e.activity === "adhkar") return `${e.date}|adhkar|${e.time}`;
  if (e.activity === "deadline") return `deadline|${e.deadline}`; // one tick per deadline, any day
  if (e.activity === "read") return `${e.date}|read|${e.book}`;                   // one page per book per day
  if (e.activity === "contact") return `${e.date}|contact|${e.name}|${e.kind}`;   // alone/friends/session can repeat
  if (e.activity === "rest") return `${e.date}|rest|${e.streak}`;
  if (e.activity === "wished") return `wished|${e.label}|${e.on}`;                // one tick per date per year
  if (e.activity === "perk-claimed") return `perk-claimed|${e.perk}`;
  if (e.activity === "person") return `person|${e.name}`;
  if (e.activity === "setting") return `setting|${e.key}`;                        // latest wins, see mergeGroup
  if (ONE_PER_DAY.includes(e.activity)) return `${e.date}|${e.activity}`;
  return null;
}

const isUnset = value => value === undefined || value === null || value === false;

// Field by field, so nothing logged is lost: set beats unset (a tick beats no tick), the bigger
// number wins (juz, glasses), otherwise b's value. Both devices merge the same way, so they agree.
function mergeTwo(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Object.fromEntries([...keys].map(key => {
    const [va, vb] = [a[key], b[key]];
    if (isUnset(va)) return [key, vb];
    if (isUnset(vb)) return [key, va];
    if (typeof va === "number" && typeof vb === "number") return [key, Math.max(va, vb)];
    return [key, vb];
  }));
}

// A setting is one value, not a pile of fields: the copy chosen last (biggest `at`) wins whole.
// Everything else merges field by field.
function mergeGroup(sorted) {
  if (sorted[0].activity !== "setting") return sorted.reduce(mergeTwo);
  return sorted.reduce((latest, e) => ((e.at ?? 0) >= (latest.at ?? 0) ? e : latest));
}

// Each group of duplicates becomes one event that keeps the smallest id (the same on every
// device). The other copies disappear, so sync sends them up as tombstones.
function mergeDuplicates(events) {
  const groups = new Map();
  for (const e of events) {
    const key = duplicateKey(e);
    if (key) groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const merged = new Map(); // id of the survivor → merged event
  const dropped = new Set();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((x, y) => (x.id < y.id ? -1 : 1));
    const survivor = { ...mergeGroup(sorted), id: sorted[0].id };
    merged.set(survivor.id, survivor);
    sorted.slice(1).forEach(e => dropped.add(e.id));
  }
  return events.filter(e => !dropped.has(e.id)).map(e => merged.get(e.id) ?? e);
}

// ---- Settings and theme as events ----
// { date, activity: "setting", key: "startPage" | "deenView" | "theme", value, at: ms }, one per key.
// localStorage keeps a fast copy for <head> (theme.js / settings.js); events are the synced truth.

// { key: value } of every setting event.
function settingValues(events) {
  return Object.fromEntries(events.filter(e => e.activity === "setting").map(e => [e.key, e.value]));
}

// Settings chosen on this device before they were events become events (at: 0, so any real
// choice made anywhere beats them). `local` is { key: value } from the device's own copy.
function withSettingSeeds(events, local, date) {
  const have = settingValues(events);
  const seeds = Object.entries(local)
    .filter(([key]) => have[key] === undefined)
    .map(([key, value]) => ({ date, activity: "setting", key, value, at: 0 }));
  return seeds.length > 0 ? [...events, ...seeds] : events;
}

// ---- Whose data is on this device? ----
// `owner` is { id, email } of the account this device's data belongs to (null if never recorded).
// "adopt": first sign-in ever, the local data becomes this account's. "proceed": same account.
// "reset": different account but nothing local worth keeping, so just drop the old bookkeeping.
// "ask": different account AND local data exists: never sync until the user chooses.
function decideOwner(owner, userId, hasLocalData) {
  if (!owner) return "adopt";
  if (owner.id === userId) return "proceed";
  return hasLocalData ? "ask" : "reset";
}
