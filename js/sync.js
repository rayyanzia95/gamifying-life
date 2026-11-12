// Sync with Supabase, step 1: signing in, and the status dot beside the light/dark button.
// Sending and fetching events comes in the next steps; for now this only knows "signed in or not".
// Loads after the page's own scripts (with `defer`), right after the Supabase library.

const SUPABASE_URL = "https://byrxbtfzcnlbwhdptozg.supabase.co";

// Paste the anon / publishable key between the quotes (Supabase → Project Settings → API).
// It's fine in public code because Row Level Security is on. NEVER the service_role / secret key.
const SUPABASE_ANON_KEY = "";

const SYNC_STATES = {
  synced: "Sync: signed in",
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

// ---- Status dot (every page that has the .corner buttons) ----

function drawSyncDot(email) {
  const corner = document.querySelector(".corner");
  if (!corner) return;
  const state = email ? "synced" : "off";
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
  pendingEmail = null; // onAuthStateChange redraws
}

async function signOut() {
  await syncClient.auth.signOut({ scope: "local" }); // this device only
}

function syncButton(text, onclick) {
  return Object.assign(document.createElement("button"), { className: "filter-button", textContent: text, onclick });
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

function signedInParts(email) {
  return [syncText(`Signed in as ${email}.`), syncButton("Sign out", signOut)];
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
  drawSyncDot(await currentEmail());
  drawSyncCard();
}

// Fires on sign-in and sign-out, so everything redraws.
// setTimeout: Supabase asks not to call it again from inside its own callback.
syncClient?.auth.onAuthStateChange(() => setTimeout(drawSync));
drawSync();
