// Home only: loads just the files of the layout in use (Appearance → Layout), so the other layouts cost nothing.
// Loaded in <head> right after settings.js (loadSettings gives the saved layout, an unknown one reading as classic).
// The CSS is written into the head here, so it blocks the first paint like a normal <link>. The scripts must come after
// the shared ones, so index.html calls loadHomeLayout() just before home.js. Both use document.write on purpose: the
// parser then runs the files in order and finishes them before home.js and DOMContentLoaded, exactly like plain tags
// (a script appended later would let the page-open animations run on an empty card).
// If a file fails to load, this visit falls back to the Classic card instead of a blank page.
// Shared by every layout, so still static in index.html: hud-home.js (hudPrayers, also used by the Today list),
// sun.js, prayer-calc.js, centrepieces.js.

// Files per layout, in load order. Classic has none; the Wheel borrows the Orrery's next-prayer markup and styles.
const HOME_LAYOUT_FILES = {
  hud: { css: ["css/layout-hud.css"], js: [] },
  orrery: { css: ["css/layout-orrery.css"], js: ["js/orrery.js", "js/orrery-home.js"] },
  city: {
    css: ["css/layout-city.css", "css/city-build.css"],
    js: ["js/city-build.js", "js/city-svg.js", "js/city/build/catalogue.js", "js/city/build/state.js", "js/city/build/svg.js",
      "js/orrery-home.js", "js/city-home.js"],
  },
  wheel: { css: ["css/layout-orrery.css", "css/layout-wheel.css"], js: ["js/command-wheel.js", "js/orrery-home.js", "js/wheel-home.js"] },
  codex: { css: ["css/layout-codex.css"], js: ["js/codex.js"] },
};

// The "City →" pill opens index.html?view=city: this visit shows the City layout, the saved layout stays as it is.
// applyAppearance (settings.js) reads homeLayoutPeek so a light/dark toggle keeps the city.
const homeLayoutPeek = new URLSearchParams(location.search).get("view") === "city" ? "city" : "";
const homeLayoutName = homeLayoutPeek || loadSettings().layout;
const homeLayoutFiles = HOME_LAYOUT_FILES[homeLayoutName] ?? { css: [], js: [] };
document.documentElement.dataset.layout = homeLayoutName;

// Another device changed the layout (a sync pull): the files loaded here are the wrong ones, so the page reloads
// (redrawPage in sync.js checks this). A city peek ignores the saved layout, so it never goes stale.
const homeLayoutStale = () => !homeLayoutPeek && loadSettings().layout !== homeLayoutName;

// The city pill in the header: "← Back" (first) while peeking, hidden when City is already the layout.
document.addEventListener("DOMContentLoaded", () => {
  const pill = document.getElementById("city-peek");
  if (!pill) return;
  if (homeLayoutPeek) {
    pill.textContent = "← Back";
    pill.href = "index.html";
    pill.parentElement.querySelector(".planner-link")?.before(pill);
  } else if (homeLayoutName === "city") {
    pill.hidden = true;
  }
});

document.write(homeLayoutFiles.css.map(href => `<link rel="stylesheet" href="${href}">`).join(""));

// A script that fails to load switches this visit to Classic (home.js then draws the plain card).
const homeLayoutFailed = () => { document.documentElement.dataset.layout = "classic"; };

function loadHomeLayout() {
  document.write(homeLayoutFiles.js.map(src => `<script src="${src}" onerror="homeLayoutFailed()"></script>`).join(""));
}
