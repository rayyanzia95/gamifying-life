#!/usr/bin/env node
// Contrast gate for the Appearance palettes. Not loaded by the site; run it after changing a palette:
//   node tools/contrast-check.js          (table of every palette, exits 1 if any fails)
//   node tools/contrast-check.js --fails  (only the palettes that fail)
// It reads each palette block in the CSS, works out WCAG contrast ratios (the same maths browsers and
// accessibility checkers use) and checks them against the rules below.
const fs = require("fs");
const path = require("path");

const CSS = path.join(__dirname, "..", "css");
const FILES = ["palettes.css", "palettes-dark.css", "appearance.css"];
const BRANCHES = ["deen", "health", "academics", "money", "people", "personal", "chores"];
const TEXT_MIN = 4.5; // body text (WCAG AA)
const UI_MIN = 3; // large text, icons, bars, rings (WCAG AA non-text)

// ---- WCAG relative luminance and contrast ratio ----
const channel = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map(x => x + x).join("") : h;
  const [r, g, b] = [0, 2, 4].map(i => channel(parseInt(full.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---- read the palettes ----
const declarations = body => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map(m => [m[1], m[2]]));

function readPalettes() {
  const palettes = [];
  for (const file of FILES) {
    const src = fs.readFileSync(path.join(CSS, file), "utf8");
    for (const m of src.matchAll(/:is\(:root, \*\)\[data-palette="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
      palettes.push({ id: m[1], vars: declarations(m[2]) });
    }
  }
  // Classic lives in base.css: the light :root block and the dark [data-theme="dark"] block.
  const base = fs.readFileSync(path.join(CSS, "base.css"), "utf8");
  const light = /^:root \{([^}]*)\}/m.exec(base);
  const dark = /^:root\[data-theme="dark"\] \{([^}]*)\}/m.exec(base);
  if (light) palettes.push({ id: "classic (light)", vars: declarations(light[1]) });
  if (dark) palettes.push({ id: "classic (dark)", vars: declarations(dark[1]) });
  return palettes;
}

// ---- the rules ----
const SCHEMA = ["bg", "surface", "surface-2", "border", "text", "text-2", "text-3", "accent", "on-accent", ...BRANCHES.map(b => "c-" + b)];
const NEED = { text: TEXT_MIN, "text-2": TEXT_MIN, "text-3": TEXT_MIN, accent: UI_MIN, "on-acc": TEXT_MIN, branch: UI_MIN, chip: TEXT_MIN };

function check({ vars }) {
  const v = name => vars["--" + name];
  const missing = SCHEMA.filter(name => !v(name));
  if (missing.length) return { missing };
  const onCards = fg => Math.min(contrast(fg, v("surface")), contrast(fg, v("bg")));
  const results = {
    text: onCards(v("text")),
    "text-2": onCards(v("text-2")),
    "text-3": onCards(v("text-3")),
    accent: contrast(v("accent"), v("bg")),
    "on-acc": contrast(v("on-accent"), v("accent")),
    branch: Math.min(...BRANCHES.map(b => onCards(v("c-" + b)))),
    chip: Math.min(...BRANCHES.map(b => contrast(v("on-accent"), v("c-" + b)))), // level chips: on-accent text on a branch colour
  };
  return { results, failed: Object.keys(NEED).filter(k => results[k] < NEED[k]) };
}

// ---- branch recolour check: every offered hue on every palette ----
// Mirrors the CSS in base.css: oklch(from var(--c-x) l max(c, CHROMA_FLOOR) h-replaced). Out-of-gamut colours lose
// chroma until they fit (what browsers do), so lightness is kept and the contrast stays what the palette set.
const CHROMA_FLOOR = 0.1;
// The hue lists live in js/settings.js (between the "branch colours" markers); read them from there so they can't drift.
const settingsSrc = fs.readFileSync(path.join(__dirname, "..", "js", "settings.js"), "utf8");
const branchBlock = settingsSrc.slice(settingsSrc.indexOf("// ---- branch colours ----"), settingsSrc.indexOf("// ---- end branch colours ----"));
const { BRANCH_SWATCH_HUES: SWATCH_HUES, BRANCH_SETS } = require("vm").runInNewContext(branchBlock.split("const branchHueKey")[0] + "({ BRANCH_SWATCH_HUES, BRANCH_SETS })");
const toLinear = hex => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map(x => x + x).join("") : h;
  return [0, 2, 4].map(i => channel(parseInt(full.slice(i, i + 2), 16) / 255));
};
function hexToOklch(hex) {
  const [r, g, b] = toLinear(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}
function oklchToLinear({ L, C, H }) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = rgb => rgb.every(x => x >= -0.0005 && x <= 1.0005);
const encode = c => { const x = Math.min(1, Math.max(0, c)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; };
function recolour(hex, hue) {
  const { L, C } = hexToOklch(hex);
  let lo = 0, hi = Math.max(C, CHROMA_FLOOR);
  if (!inGamut(oklchToLinear({ L, C: hi, H: hue }))) {
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ L, C: mid, H: hue }))) lo = mid; else hi = mid;
    }
    hi = lo;
  }
  const rgb = oklchToLinear({ L, C: hi, H: hue }).map(encode);
  return "#" + rgb.map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
function checkRecolours(palette) {
  const v = name => palette.vars["--" + name];
  const bad = [];
  for (const b of BRANCHES) {
    const hues = [...new Set([...SWATCH_HUES, ...Object.values(BRANCH_SETS).map(set => set.hues[b])])];
    for (const hue of hues) {
      const colour = recolour(v("c-" + b), hue);
      const ui = Math.min(contrast(colour, v("surface")), contrast(colour, v("bg")));
      const chip = contrast(v("on-accent"), colour);
      if (ui < UI_MIN || chip < TEXT_MIN) bad.push(`${b}@${hue} (ui ${ui.toFixed(2)}, chip ${chip.toFixed(2)})`);
    }
  }
  return bad;
}

// ---- table ----
const COLUMNS = Object.keys(NEED);
const onlyFails = process.argv.includes("--fails");
const rows = readPalettes().map(p => ({ id: p.id, ...check(p) }));
console.log("palette".padEnd(18) + COLUMNS.map(c => c.padStart(8)).join("") + "  result");
let failures = 0;
for (const row of rows) {
  const bad = Boolean(row.missing || row.failed.length);
  if (bad) failures += 1;
  if (onlyFails && !bad) continue;
  if (row.missing) {
    console.log(row.id.padEnd(18) + `  missing: ${row.missing.join(", ")}`);
    continue;
  }
  const cells = COLUMNS.map(c => (row.results[c].toFixed(2) + (row.failed.includes(c) ? "!" : " ")).padStart(8)).join("");
  console.log(row.id.padEnd(18) + cells + (row.failed.length ? "  FAIL" : "  pass"));
}
console.log(`\n${rows.length - failures}/${rows.length} pass. Needs: text, text-2, text-3 >= ${TEXT_MIN} on bg and surface;`
  + ` accent >= ${UI_MIN} on bg; on-accent >= ${TEXT_MIN} on accent; each branch >= ${UI_MIN} on bg and surface;`
  + ` chip (on-accent text on each branch) >= ${TEXT_MIN}.`);
let recolourFails = 0;
for (const p of readPalettes()) {
  const bad = p.vars["--c-deen"] ? checkRecolours(p) : [];
  if (bad.length) { recolourFails += bad.length; console.log(`recolour FAIL ${p.id}: ${bad.join(", ")}`); }
}
console.log(`Branch recolours (${SWATCH_HUES.length} swatch hues + set hues, chroma floor ${CHROMA_FLOOR}): ${recolourFails ? recolourFails + " failing" : "all pass"}.`);
process.exit(failures || recolourFails ? 1 : 0);
