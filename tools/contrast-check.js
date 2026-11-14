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
process.exit(failures ? 1 : 0);
