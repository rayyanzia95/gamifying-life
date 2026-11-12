// Sync with Supabase: signing in, fetching the other device's changes, sending this device's,
// and the status dot beside the light/dark button. The merge rules live in sync-merge.js.
// Loads after the page's own scripts (with `defer`), right after the Supabase library.
// localStorage stays the main copy: every tick saves there first, sync catches up when it can.

const SUPABASE_URL = "https://byrxbtfzcnlbwhdptozg.supabase.co";

// Paste the anon / publishable key between the quotes (Supabase → Project Settings → API).
// It's fine in public code because Row Level Security is on. NEVER the service_role / secret key.
const SUPABASE_ANON_KEY = "sb_publishable_g10yJSSblSRm5F6PSLfDqg_yELaGDqw";

// What the cloud already has, as far as this device knows: { id: JSON of the event }.
const SYNCED_KEY = "gamifying-life-synced";
const SYNC_DELAY_MS = 1500; // wait for a burst of ticks to finish, then send them together
const PUSH_CHUNK = 500;     // rows per request, so a first big upload isn't one huge request
const PULLED_AT_KEY = "gamifying-life-pulled-at"; // server time of the newest row fetched
const PULL_PAGE = 1000;     // Supabase returns at most 1000 rows per request
const PULL_OVERLAP_MS = 60 * 1000;

const SYNC_STATES = {
  synced: "Sync: all sent",
  waiting: "Sync: changes waiting to send",
  off: "Sync: not signed in",
};

// window.supabase is the library from the CDN; it's missing if the CDN couldn't load (offline).
function makeSyncClient() {
  if (!SUPABASE_ANON_KEY || !window.supabase) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const syncClient = makeSyncClient();

// The session is kept in localStorage by the library, so this works offline too.
async function currentEmail() {
  if (!syncClient) return null;
  const { data } = await syncClient.auth.getSession();
  return data.session?.user.email ?? null;
}

// Offline with no library loaded we can't ask it, but its saved session tells us we signed in before.
function hasSavedSession() {
  const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
  return localStorage.getItem(`sb-${ref}-auth-token`) !== null;
}

// ---- Sending changes ----

function loadSynced() {
  try {
    return JSON.parse(localStorage.getItem(SYNCED_KEY)) || {};
  } catch {
    return {};
  }
}

// Rows the cloud doesn't have yet: new or edited events, plus a tombstone for each removed one.
function unsentRows() {
  const events = loadEvents();
  const synced = loadSynced();
  const ids = new Set(events.map(e => e.id));
  const changed = events
    .filter(e => synced[e.id] !== canonical(eventData(e)))
    .map(e => ({ id: e.id, data: eventData(e), deleted: false }));
  const removed = Object.keys(synced)
    .filter(id => !ids.has(id))
    .map(id => ({ id, data: JSON.parse(synced[id]), deleted: true }));
  return [...changed, ...removed];
}

// After the cloud accepted some rows, remember them (and forget the tombstoned ones).
function markSent(rows) {
  const sent = Object.fromEntries(rows.map(r => [r.id, r.deleted ? null : canonical(r.data)]));
  const merged = { ...loadSynced(), ...sent };
  saveSynced(Object.fromEntries(Object.entries(merged).filter(([, json]) => json !== null)));
}

function saveSynced(synced) {
  localStorage.setItem(SYNCED_KEY, JSON.stringify(synced));
}

// ---- Fetching the other device's changes ----

// Every row carries the server's updated_at; asking for "newer than the newest I've seen" keeps
// fetches small. The overlap re-asks for the last minute in case two saves landed at the same
// moment; applying a row twice changes nothing.
async function fetchChangedRows(since) {
  const rows = [];
  for (let from = 0; ; from += PULL_PAGE) {
    let query = syncClient.from("events").select("id, data, deleted, updated_at")
      .order("updated_at").order("id").range(from, from + PULL_PAGE - 1);
    if (since) query = query.gt("updated_at", new Date(Date.parse(since) - PULL_OVERLAP_MS).toISOString());
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < PULL_PAGE) return rows;
  }
}

// Fetch, merge into this device's events and merge duplicates. Returns true if events changed.
// Events are saved BEFORE the snapshot: the other way round, closing the page in between would
// leave rows "known to the cloud" but missing here, and the next send would delete them.
async function pullEvents() {
  const rows = await fetchChangedRows(localStorage.getItem(PULLED_AT_KEY));
  const before = loadEvents();
  const { events, synced } = applyRows(before, loadSynced(), rows);
  const merged = mergeDuplicates(events);
  const changed = canonicalList(merged) !== canonicalList(before);
  if (changed) saveEvents(merged);
  saveSynced(synced);
  if (rows.length > 0) localStorage.setItem(PULLED_AT_KEY, rows[rows.length - 1].updated_at);
  return changed;
}

function canonicalList(events) {
  return events.map(e => canonical(e)).sort().join("\n");
}

// Pages with a render() redraw in place; Home draws once at load, so it reloads instead.
// Settings shows no events, so it only needs the sync card redrawn.
function redrawPage() {
  if (typeof render === "function") return render();
  if (!document.getElementById("sync-body")) location.reload();
}

let lastSyncError = null;
let lastSentAt = null;

// Fetch first, then send: fetching can merge duplicates, and those merges need sending too.
async function syncOnce() {
  if (!syncClient || !navigator.onLine || !(await currentEmail())) return;
  const changed = await pullEvents();
  await sendUnsent();
  if (changed) redrawPage(); // after sending, so Home's reload can't cut a send short
}

async function sendUnsent() {
  const rows = unsentRows();
  for (let i = 0; i < rows.length; i += PUSH_CHUNK) {
    const chunk = rows.slice(i, i + PUSH_CHUNK);
    const { error } = await syncClient.from("events").upsert(chunk); // insert, or update if the id exists
    if (error) {
      lastSyncError = error.message;
      return;
    }
    markSent(chunk);
  }
  lastSyncError = null;
  lastSentAt = new Date();
}

// Only one sync at a time. Anything saved during a sync goes in the next one.
let syncing = null;

function syncEvents() {
  if (syncing) return syncing;
  syncing = syncOnce()
    .catch(error => { lastSyncError = error.message; }) // e.g. the network dropped mid-request
    .finally(() => {
      syncing = null;
      drawSync();
      if (!lastSyncError && unsentRows().length > 0) scheduleSync();
    });
  return syncing;
}

let syncTimer = null;

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncEvents, SYNC_DELAY_MS);
}

// ---- Status dot (every page that has the .corner buttons) ----

function syncState(email) {
  const signedIn = email !== null || (!syncClient && hasSavedSession());
  if (!signedIn) return "off";
  return unsentRows().length > 0 ? "waiting" : "synced";
}

function drawSyncDot(state) {
  const corner = document.querySelector(".corner");
  if (!corner) return;
  const dot = corner.querySelector(".sync-dot") ?? Object.assign(document.createElement("a"), {
    className: "icon-button sync-dot",
    href: "settings.html#sync",
  });
  dot.dataset.state = state;
  dot.title = SYNC_STATES[state];
  dot.setAttribute("aria-label", SYNC_STATES[state]);
  if (!dot.isConnected) corner.prepend(dot);
}

// ---- Sync card (settings.html only) ----

let pendingEmail = null; // set between "Send code" and "Sign in"

function syncText(text) {
  return Object.assign(document.createElement("p"), { className: "muted", textContent: text });
}

function syncButton(text, onclick) {
  return Object.assign(document.createElement("button"), { className: "filter-button", textContent: text, onclick });
}

// One input + one button, like the Money forms. onSubmit gets the trimmed value and
// returns an error message, or nothing when it worked.
function syncForm({ type, placeholder, button, onSubmit, autocomplete }) {
  const form = Object.assign(document.createElement("form"), { className: "money-form" });
  const input = Object.assign(document.createElement("input"), {
    className: "money-input", type, placeholder, required: true, autocomplete,
  });
  input.setAttribute("aria-label", placeholder);
  const submit = Object.assign(document.createElement("button"), { className: "filter-button", textContent: button });
  const error = Object.assign(document.createElement("p"), { className: "money-error", hidden: true });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    submit.disabled = true;
    const message = await onSubmit(input.value.trim());
    submit.disabled = false;
    error.hidden = !message;
    error.textContent = message ?? "";
  });
  form.append(input, submit, error);
  return form;
}

// Supabase emails a 6-digit code. shouldCreateUser: false = only the existing account can sign in.
async function sendCode(email) {
  const { error } = await syncClient.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) return `Couldn't send the code: ${error.message}`;
  pendingEmail = email;
  drawSyncCard();
}

// type "email" accepts both the sign-in code and the first-time "confirm your email" code.
async function checkCode(token) {
  const { error } = await syncClient.auth.verifyOtp({ email: pendingEmail, token, type: "email" });
  if (error) return `That code didn't work: ${error.message}`;
  pendingEmail = null; // onAuthStateChange redraws and sends
}

async function signOut() {
  await syncClient.auth.signOut({ scope: "local" }); // this device only
}

function signedOutParts() {
  if (pendingEmail) {
    return [
      syncText(`Code sent to ${pendingEmail}. Check your email.`),
      syncForm({ type: "text", placeholder: "6-digit code", button: "Sign in", onSubmit: checkCode,
        autocomplete: "one-time-code" }),
      syncButton("Use a different email", () => { pendingEmail = null; drawSyncCard(); }),
    ];
  }
  return [
    syncText("Sign in to share your ticks between your phone and your Mac. Ticks always save on this device first."),
    syncForm({ type: "email", placeholder: "Email", button: "Send code", onSubmit: sendCode, autocomplete: "email" }),
  ];
}

function sendStatusText() {
  const waiting = unsentRows().length;
  if (lastSyncError) return `${waiting} changes waiting to send. Last try failed: ${lastSyncError}`;
  if (waiting > 0) return `${waiting} changes waiting to send${navigator.onLine ? "…" : " (offline)."}`;
  const time = lastSentAt ? ` · last sent ${lastSentAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "";
  return `All changes sent${time}.`;
}

function signedInParts(email) {
  return [syncText(`Signed in as ${email}.`), syncText(sendStatusText()), syncButton("Sign out", signOut)];
}

async function drawSyncCard() {
  const body = document.getElementById("sync-body");
  if (!body) return;
  if (!SUPABASE_ANON_KEY) return body.replaceChildren(syncText("Sync isn't set up yet: the anon key is missing in js/sync.js."));
  if (!syncClient) return body.replaceChildren(syncText("Can't reach the sync service right now. Your ticks are still saved on this device."));
  const email = await currentEmail();
  if (email) {
    delete body.dataset.step; // so signing out draws the email box again
    return body.replaceChildren(...signedInParts(email)); // no text box, safe to redraw
  }
  // Signed out: rebuild only when the step changes (email ↔ code). Every sync cycle calls this,
  // and rebuilding would wipe what's being typed in the box.
  const step = pendingEmail ? `code:${pendingEmail}` : "email";
  if (body.dataset.step === step) return;
  body.dataset.step = step;
  body.replaceChildren(...signedOutParts());
}

// ---- Start ----

async function drawSync() {
  drawSyncDot(syncState(await currentEmail()));
  drawSyncCard();
}

// storage.js announces every save; show gold right away and send shortly after.
window.addEventListener("events-saved", () => {
  drawSync();
  scheduleSync();
});
window.addEventListener("online", syncEvents);
// Coming back to the app (switching tabs, unlocking the phone) is when the other device's ticks matter.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncEvents();
});

// Fires on sign-in and sign-out, so everything redraws and a fresh sign-in sends at once.
// setTimeout: Supabase asks not to call it again from inside its own callback.
syncClient?.auth.onAuthStateChange(() => setTimeout(() => {
  drawSync();
  syncEvents();
}));
drawSync();
syncEvents();
