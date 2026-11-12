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
  { value: "paper", label: "Paper terminal", mode: "light" },
  { value: "parch", label: "Parchment", mode: "light" },
  { value: "glass", label: "Glass", mode: "light" },
];

const palettesFor = mode => PALETTES.filter(p => p.mode === mode || p.mode === "both");

const APPEARANCE_CHOICES = {
  paletteDark: { label: "Colours in dark mode", options: palettesFor("dark"), default: "ice" },
  paletteLight: { label: "Colours in light mode", options: palettesFor("light") },
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
      { value: "starmap", label: "Star map", soon: true },
      { value: "hex", label: "Hex grid", soon: true },
      { value: "gauge", label: "Segmented gauge", soon: true },
      { value: "sheet", label: "Stat block", soon: true },
    ],
  },
  layout: {
    label: "Layout",
    options: [
      { value: "card", label: "Card + sidebar" },
      { value: "sheet", label: "Character sheet", soon: true },
      { value: "dashboard", label: "Dashboard / HUD grid", soon: true },
      { value: "terminal", label: "Terminal panes", soon: true },
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

// Every setting, with anything missing or no longer allowed replaced by its default.
function loadSettings() {
  const stored = storedSettings();
  return Object.fromEntries(
    Object.entries(SETTING_CHOICES).map(([key, choice]) => {
      const allowed = choice.options.some(o => o.value === stored[key] && !o.soon);
      return [key, allowed ? stored[key] : defaultChoice(choice)];
    })
  );
}

function saveSetting(key, value) {
  const next = { ...loadSettings(), [key]: value };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Private browsing can block storage; the choice lasts until reload.
  }
  saveSettingEvent(key, value); // the synced copy (storage.js)
  applyAppearance();
}

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
function applyAppearance() {
  const s = loadSettings();
  const palette = currentTheme() === "dark" ? s.paletteDark : s.paletteLight;
  Object.assign(document.documentElement.dataset, {
    palette, type: s.type, bars: s.bars, ticks: s.ticks, motion: s.motion, size: s.size, radius: s.radius,
    density: s.density, levelUp: s.levelUp, texture: s.texture, icons: s.icons, tint: s.tint,
  });
  loadTypeFont(s.type);
}

applyAppearance();

// Re-apply when light/dark flips: the toggle (or sync) changes data-theme on <html>,
// and the device can switch on its own at sunset.
new MutationObserver(applyAppearance).observe(document.documentElement, { attributeFilter: ["data-theme"] });
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyAppearance);
