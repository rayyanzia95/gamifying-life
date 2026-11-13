// Your preferences, saved on this device and synced as events (storage.js). Loaded in <head> on every page.
// Each setting lists its allowed values; the first one is the default.

const SETTINGS_KEY = "gamifying-life-settings";
const OPENED_KEY = "gamifying-life-opened";

// Settings about where the app opens.
const GENERAL_CHOICES = {
  startPage: {
    label: "Open the app on",
    options: [
      { value: "index.html", label: "Home" },
      { value: "deen.html", label: "Deen" },
    ],
  },
  deenView: {
    label: "Deen opens on",
    options: [
      { value: "prayers", label: "Prayers" },
      { value: "quran", label: "Quran" },
      { value: "dua", label: "Dua" },
    ],
  },
};

// The look of the whole app. Each one ends up as a data-* attribute on <html>
// (applyAppearance below) and css/styles.css restyles everything from that.
// "default" picks the default when it isn't the first option; "soon" = listed but not built yet.
const PALETTES = [
  { value: "classic", label: "Classic", mode: "both" },
  { value: "ice", label: "Ice on graphite", mode: "dark" },
  { value: "amber", label: "Amber terminal", mode: "dark" },
  { value: "teal", label: "Cyan / teal", mode: "dark" },
  { value: "multi", label: "Branch colours on dark", mode: "dark" },
  { value: "neon", label: "Neon arcade", mode: "dark" },
  { value: "hud", label: "Sci-fi HUD", mode: "dark" },
  { value: "candle", label: "Candlelit RPG", mode: "dark" },
  { value: "vapor", label: "Vaporwave", mode: "dark" },
  { value: "jrpg", label: "JRPG blue", mode: "dark" },
  { value: "pixeld", label: "Cozy pixel", mode: "dark" },
  { value: "glassd", label: "Glass (dark)", mode: "dark" },
  { value: "noted", label: "Chalkboard", mode: "dark" },
  { value: "brutd", label: "Console", mode: "dark" },
  { value: "matrix", label: "Matrix", mode: "dark" },
  { value: "void", label: "Void violet", mode: "dark" },
  { value: "solar", label: "Solar flare", mode: "dark" },
  { value: "abyss", label: "Abyss", mode: "dark" },
  { value: "r2-space", label: "Deep space", mode: "dark" },
  { value: "r2-script", label: "Scriptorium", mode: "dark" },
  { value: "r2-forest", label: "Forest & brass", mode: "dark" },
  { value: "r2-dusk", label: "Dusk drive", mode: "dark" },
  { value: "r2-deck", label: "Flight deck", mode: "dark" },
  { value: "r2-arcane", label: "Arcane tide", mode: "dark" },
  { value: "r2-ember", label: "Ember forge", mode: "dark" },
  { value: "r2-obs", label: "Observatory", mode: "dark" },
  { value: "r2-moss", label: "Moss & stone", mode: "dark" },
  { value: "r2-ronin", label: "Ronin", mode: "dark" },
  { value: "r2-lab", label: "Lab bench", mode: "dark" },
  { value: "r2-court", label: "Royal court", mode: "dark" },
  { value: "r2-chart", label: "Chart room", mode: "dark" },
  { value: "r2-signal", label: "Signal", mode: "dark" },
  { value: "paper", label: "Paper terminal", mode: "light" },
  { value: "parch", label: "Parchment", mode: "light" },
  { value: "glass", label: "Glass", mode: "light" },
  { value: "pixell", label: "Cozy pixel", mode: "light" },
  { value: "notel", label: "Notebook", mode: "light" },
  { value: "jrpgl", label: "JRPG menu", mode: "light" },
  { value: "brutl", label: "Brutalist", mode: "light" },
  { value: "arctic", label: "Arctic", mode: "light" },
  { value: "sakura", label: "Sakura", mode: "light" },
];

const palettesFor = mode => PALETTES.filter(p => p.mode === mode || p.mode === "both");

// Sci-fi effects (Appearance → Sci-fi FX). Each is its own setting; three of them also have a quieter
// "Subtle". The defaults are the Recommended preset. fx.js and css/appearance.css do the drawing.
const ON_OFF = [{ value: "off", label: "Off" }, { value: "on", label: "On" }];
const OFF_SUBTLE_FULL = [{ value: "off", label: "Off" }, { value: "subtle", label: "Subtle" }, { value: "on", label: "Full" }];
const FX_CHOICES = {
  fxBoot: { label: "Boot scan when a page opens", options: ON_OFF, default: "on" },
  fxDecode: { label: "Level numbers decode up", options: ON_OFF, default: "on" },
  fxSweep: { label: "Scanning sweep on the Home ring", options: OFF_SUBTLE_FULL, default: "subtle" },
  fxBrackets: { label: "HUD corner brackets on cards", options: ON_OFF, default: "off" },
  fxHolo: { label: "Holographic shimmer on level chips", options: OFF_SUBTLE_FULL, default: "subtle" },
  fxGlitch: { label: "Glitch when you tick", options: ON_OFF, default: "on" },
  fxCore: { label: "Pulsing core on Home", options: OFF_SUBTLE_FULL, default: "subtle" },
  fxBurst: { label: "Level-up line burst", options: ON_OFF, default: "on" },
  fxCursor: { label: "Typing-cursor page titles", options: ON_OFF, default: "off" },
};
const FX_KEYS = Object.keys(FX_CHOICES);

// Round-2 animations (Appearance → Animations and sci-fi FX), each on or off. js/anims.js and css/anims.css
// draw them; the three level-up ones are choices under Level-up effect instead, since only one can play.
const ANIM_CHOICES = {
  animTick: { label: "Tick draws itself, bar springs forward", options: ON_OFF, default: "on" },
  animCount: { label: "XP numbers count up when a page opens", options: ON_OFF, default: "off" },
  animCascade: { label: "Cards rise in one after another", options: ON_OFF, default: "on" },
  animWipe: { label: "Scan wipe when a page opens", options: ON_OFF, default: "off" },
  animStreak: { label: "Streak flame flares and flickers", options: ON_OFF, default: "on" },
  animDay: { label: "Day complete: the seven rings close and glow", options: ON_OFF, default: "on" },
};
const ANIM_KEYS = Object.keys(ANIM_CHOICES);
const EFFECT_CHOICES = { ...ANIM_CHOICES, ...FX_CHOICES };
const EFFECT_KEYS = Object.keys(EFFECT_CHOICES);

// The three preset buttons, for the animations and the FX together. Scanlines are the Background texture setting.
const FX_PRESETS = {
  off: { ...Object.fromEntries(EFFECT_KEYS.map(key => [key, "off"])), texture: "plain" },
  recommended: { ...Object.fromEntries(EFFECT_KEYS.map(key => [key, EFFECT_CHOICES[key].default])), texture: "plain" },
  on: { ...Object.fromEntries(EFFECT_KEYS.map(key => [key, "on"])), texture: "scan" },
};

const APPEARANCE_CHOICES = {
  paletteDark: { label: "Colours in dark mode", options: palettesFor("dark"), default: "multi" },
  paletteLight: { label: "Colours in light mode", options: palettesFor("light") },
  black: {
    label: "Black level (dark mode)",
    options: [
      { value: "palette", label: "Palette's own" },
      { value: "oled", label: "True black (OLED)" },
    ],
  },
  accent: {
    label: "Accent",
    options: [
      { value: "palette", label: "Palette's own" },
      { value: "custom", label: "Custom hue" },
    ],
  },
  // A slider, not a list: any whole number in the range is allowed (loadSettings checks it).
  accentHue: { label: "Accent hue", range: { min: 0, max: 359 }, default: 200 },
  glow: {
    label: "Glow strength",
    default: "1",
    options: [
      { value: "0", label: "None" },
      { value: "1", label: "Soft" },
      { value: "2", label: "Medium" },
      { value: "3", label: "Neon" },
    ],
  },
  ...EFFECT_CHOICES,
  type: {
    label: "Type",
    default: "serif",
    options: [
      { value: "system", label: "System" },
      { value: "mono", label: "Mono" },
      { value: "grotesque", label: "Grotesque" },
      { value: "rounded", label: "Rounded" },
      { value: "serif", label: "Serif display" },
    ],
  },
  bars: {
    label: "Progress bars",
    default: "seg",
    options: [
      { value: "cont", label: "Continuous" },
      { value: "seg", label: "Segmented" },
      { value: "block", label: "Block chars" },
      { value: "orbs", label: "XP orbs" },
    ],
  },
  ticks: {
    label: "Ticks",
    default: "pill",
    options: [
      { value: "checkbox", label: "Checkbox" },
      { value: "term", label: "[x] terminal" },
      { value: "pill", label: "Pill" },
      { value: "stamp", label: "Stamp" },
    ],
  },
  motion: {
    label: "Motion",
    default: "lively",
    options: [
      { value: "none", label: "None" },
      { value: "subtle", label: "Subtle" },
      { value: "lively", label: "Lively" },
    ],
  },
  size: {
    label: "Text size",
    default: "normal",
    options: [
      { value: "small", label: "Small" },
      { value: "normal", label: "Normal" },
      { value: "large", label: "Large" },
    ],
  },
  radius: {
    label: "Corners",
    default: "slight",
    options: [
      { value: "square", label: "Square" },
      { value: "slight", label: "Slight" },
      { value: "round", label: "Round" },
    ],
  },
  density: {
    label: "Density",
    default: "normal",
    options: [
      { value: "compact", label: "Compact" },
      { value: "normal", label: "Normal" },
      { value: "roomy", label: "Roomy" },
    ],
  },
  levelUp: {
    label: "Level-up effect",
    default: "ring",
    options: [
      { value: "none", label: "Just the gold ring" },
      { value: "glow", label: "Glow" },
      { value: "burst", label: "Burst" },
      { value: "banner", label: "Banner" },
      { value: "ring", label: "Popup: ring fills" },
      { value: "hud", label: "Popup: sci-fi HUD" },
      { value: "rpg", label: "Popup: RPG card" },
      { value: "toast", label: "Popup: toast" },
      { value: "ringburst", label: "Ring burst" },
      { value: "lockon", label: "HUD lock-on" },
      { value: "unfurl", label: "Banner unfurl" },
    ],
  },
  texture: {
    label: "Background texture",
    options: [
      { value: "plain", label: "Plain" },
      { value: "dots", label: "Dots" },
      { value: "grid", label: "Grid" },
      { value: "scan", label: "Scanlines" },
    ],
  },
  icons: {
    label: "Icons",
    options: [
      { value: "dots", label: "Colour dots" },
      { value: "line", label: "Outline" },
      { value: "filled", label: "Filled" },
    ],
  },
  tint: {
    label: "Page tint",
    options: [
      { value: "off", label: "Palette accent everywhere" },
      { value: "on", label: "Each page in its branch colour" },
    ],
  },
  centre: {
    label: "Home centrepiece",
    options: [
      { value: "ringweb", label: "Ring + web" },
      { value: "starmap", label: "Star map" },
      { value: "hex", label: "Hex grid" },
      { value: "gauge", label: "Segmented gauge" },
      { value: "sheet", label: "Stat block" },
    ],
  },
  // Each layout is data-layout on <html> plus its own css/layout-<value>.css (and JS where markup changes).
  layout: {
    label: "Layout",
    options: [
      { value: "classic", label: "Classic" },
      { value: "hud", label: "Cockpit HUD" },
      { value: "city", label: "City" },
      { value: "orrery", label: "Orrery" },
      { value: "wheel", label: "Command wheel" },
      { value: "codex", label: "Grimoire ledger" },
    ],
  },
};

// Every setting in one object, so loading, saving and sync treat them all the same way.
const SETTING_CHOICES = { ...GENERAL_CHOICES, ...APPEARANCE_CHOICES };

function storedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

const defaultChoice = choice => choice.default ?? choice.options[0].value;

// A stored value is kept only if the setting still allows it: one of its options (not a "soon" one),
// or a whole number inside its range.
function isAllowed(choice, value) {
  if (choice.range) return Number.isInteger(value) && value >= choice.range.min && value <= choice.range.max;
  return choice.options.some(o => o.value === value && !o.soon);
}

// Every setting, with anything missing or no longer allowed replaced by its default.
function loadSettings() {
  const stored = storedSettings();
  return Object.fromEntries(
    Object.entries(SETTING_CHOICES).map(([key, choice]) =>
      [key, isAllowed(choice, stored[key]) ? stored[key] : defaultChoice(choice)])
  );
}

// changes: { key: value, ... }. Only the ones that really change are saved (and synced).
function saveSettings(changes) {
  const before = loadSettings();
  const changed = Object.entries(changes).filter(([key, value]) => before[key] !== value);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...before, ...Object.fromEntries(changed) }));
  } catch {
    // Private browsing can block storage; the choice lasts until reload.
  }
  changed.forEach(([key, value]) => saveSettingEvent(key, value)); // the synced copies (storage.js)
  applyAppearance();
}

const saveSetting = (key, value) => saveSettings({ [key]: value });

// True only for the first page you open in this tab. sessionStorage is wiped
// when the tab closes, so "Open the app on" applies each time you open the app,
// but not when you tap "← Home" later.
function isFirstPageThisVisit() {
  try {
    const first = !sessionStorage.getItem(OPENED_KEY);
    sessionStorage.setItem(OPENED_KEY, "yes");
    return first;
  } catch {
    return false;
  }
}

const firstPageThisVisit = isFirstPageThisVisit();

// Called from Home's <head>: jump to your chosen start page when the app opens.
function goToStartPage() {
  const page = loadSettings().startPage;
  if (firstPageThisVisit && page !== "index.html") location.replace(page);
}

// ---- Appearance: settings → data-* attributes on <html> ----

// Web fonts per type choice. Only the chosen one is fetched, so unused fonts cost nothing.
const TYPE_FONTS = {
  mono: "JetBrains+Mono:wght@400;700",
  grotesque: "Bricolage+Grotesque:wght@500;700&family=Schibsted+Grotesk:wght@400;600",
  rounded: "M+PLUS+Rounded+1c:wght@500;800&family=Nunito:wght@500;700",
  serif: "Cinzel:wght@500;700&family=EB+Garamond:wght@400;600",
};

function loadTypeFont(type) {
  const old = document.getElementById("type-font");
  if (!TYPE_FONTS[type]) return old?.remove();
  const href = `https://fonts.googleapis.com/css2?family=${TYPE_FONTS[type]}&display=swap`;
  if (old?.getAttribute("href") === href) return;
  const link = Object.assign(document.createElement("link"), { id: "type-font", rel: "stylesheet", href });
  old ? old.replaceWith(link) : document.head.append(link);
}

// Two palette slots: light/dark (the toggle, or the device) decides which one shows.
// currentTheme() is in theme.js, which loads just before this file.
// True black and the custom accent both depend on light/dark, so the mode is folded into the attribute
// here (data-black="oled" only in dark; data-accent="custom-dark" / "custom-light") and the CSS stays plain.
function applyAppearance() {
  const s = loadSettings();
  const dark = currentTheme() === "dark";
  const root = document.documentElement;
  Object.assign(root.dataset, {
    palette: dark ? s.paletteDark : s.paletteLight,
    black: dark ? s.black : "palette",
    accent: s.accent === "custom" ? `custom-${dark ? "dark" : "light"}` : "palette",
    glow: s.glow, type: s.type, bars: s.bars, ticks: s.ticks, motion: s.motion, size: s.size, radius: s.radius,
    density: s.density, levelUp: s.levelUp, texture: s.texture, icons: s.icons, tint: s.tint, layout: s.layout, centre: s.centre,
    ...Object.fromEntries(EFFECT_KEYS.map(key => [key, s[key]])), // fxBoot → data-fx-boot, animTick → data-anim-tick
  });
  root.style.setProperty("--accent-hue", s.accentHue); // a number the CSS turns into an oklch colour
  loadTypeFont(s.type);
}

applyAppearance();

// Re-apply when light/dark flips: the toggle (or sync) changes data-theme on <html>,
// and the device can switch on its own at sunset.
new MutationObserver(applyAppearance).observe(document.documentElement, { attributeFilter: ["data-theme"] });
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyAppearance);
