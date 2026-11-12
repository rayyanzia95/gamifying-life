// Sync with Supabase: signing in, sending this device's changes to the cloud, and the status dot
// beside the light/dark button. Fetching the other device's changes comes in the next step.
// Loads after the page's own scripts (with `defer`), right after the Supabase library.

const SUPABASE_URL = "https://byrxbtfzcnlbwhdptozg.supabase.co";

// Paste the anon / publishable key between the quotes (Supabase → Project Settings → API).
// It's fine in public code because Row Level Security is on. NEVER the service_role / secret key.
const SUPABASE_ANON_KEY = "sb_publishable_g10yJSSblSRm5F6PSLfDqg_yELaGDqw";

// What the cloud already has, as far as this device knows: { id: JSON of the event }.
const SYNCED_KEY = "gamifying-life-synced";
const PUSH_DELAY_MS = 1500; // wait for a burst of ticks to finish, then send them together
const PUSH_CHUNK = 500;     // rows per request, so a first big upload isn't one huge request

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

// The event without its id: that's the row's `data` column (the id has its own column).
function eventData({ id, ...data }) {
  return data;
}

// Rows the cloud doesn't have yet: new or edited events, plus a tombstone for each removed one.
function unsentRows() {
  const events = loadEvents();
  const synced = loadSynced();
  const ids = new Set(events.map(e => e.id));
  const changed = events
    .filter(e => synced[e.id] !== JSON.stringify(eventData(e)))
    .map(e => ({ id: e.id, data: eventData(e), deleted: false }));
  const removed = Object.keys(synced)
    .filter(id => !ids.has(id))
    .map(id => ({ id, data: JSON.parse(synced[id]), deleted: true }));
  return [...changed, ...removed];
}

// After the cloud accepted some rows, remember them (and forget the tombstoned ones).
function markSent(rows) {
  const sent = Object.fromEntries(rows.map(r => [r.id, r.deleted ? null : JSON.stringify(r.data)]));
  const merged = { ...loadSynced(), ...sent };
  const next = Object.fromEntries(Object.entries(merged).filter(([, json]) => json !== null));
  localStorage.setItem(SYNCED_KEY, JSON.stringify(next));
}

let lastSyncError = null;
let lastSentAt = null;

async function sendUnsent() {
  if (!syncClient || !navigator.onLine || !(await currentEmail())) return;
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

// Only one send at a time. Anything saved during a send goes in the next one.
let pushing = null;

function pushEvents() {
  if (pushing) return pushing;
  pushing = sendUnsent()
    .catch(error => { lastSyncError = error.message; }) // e.g. the network dropped mid-request
    .finally(() => {
      pushing = null;
      drawSync();
      if (!lastSyncError && unsentRows().length > 0) schedulePush();
    });
  return pushing;
}

let pushTimer = null;

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushEvents, PUSH_DELAY_MS);
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
  body.replaceChildren(...(email ? signedInParts(email) : signedOutParts()));
}

// ---- Start ----

async function drawSync() {
  drawSyncDot(syncState(await currentEmail()));
  drawSyncCard();
}

// storage.js announces every save; show gold right away and send shortly after.
window.addEventListener("events-saved", () => {
  drawSync();
  schedulePush();
});
window.addEventListener("online", pushEvents);

// Fires on sign-in and sign-out, so everything redraws and a fresh sign-in sends at once.
// setTimeout: Supabase asks not to call it again from inside its own callback.
syncClient?.auth.onAuthStateChange(() => setTimeout(() => {
  drawSync();
  pushEvents();
}));
drawSync();
pushEvents();
