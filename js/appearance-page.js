// Draws appearance.html: the look of the whole app, in grouped cards, with a live preview on top.
// Picking an option saves it (choice-form.js → saveSetting) and applyAppearance restyles <html> at once,
// so the preview needs no redraw of its own.

// Cards on the page, in order: a title and the settings in it (keys of APPEARANCE_CHOICES).
const APPEARANCE_GROUPS = [
  { title: "Layout", keys: ["layout"], note: "Changes how Home and the branch pages are laid out. Works with any palette." },
  { title: "Colours", note: "The light/dark button picks which of the two colour sets shows.",
    keys: ["paletteDark", "paletteLight", "black", "accent", "accentHue", "glow", "tint"] },
  { title: "Type and shape", keys: ["type", "size", "radius", "density"] },
  { title: "Bars, ticks and icons", keys: ["bars", "ticks", "icons"] },
  { title: "Motion", keys: ["motion", "levelUp"] },
  { title: "Animations and sci-fi FX", presets: true, keys: EFFECT_KEYS,
    note: "Scanlines are under Background. All of these stay off with Motion set to None or the device's reduce-motion setting." },
  { title: "Background", keys: ["texture"] },
  { title: "Coming next", keys: ["centre"] },
];

const PRESET_LABELS = { off: "All off", recommended: "Recommended", on: "All on" };

// One button per FX_PRESETS entry (settings.js); each saves every effect at once, then the page redraws.
function presetRow() {
  const row = Object.assign(document.createElement("div"), { className: "fx-presets" });
  const buttons = Object.entries(PRESET_LABELS).map(([preset, textContent]) => {
    const button = Object.assign(document.createElement("button"), { type: "button", className: "filter-button", textContent });
    button.addEventListener("click", () => { saveSettings(FX_PRESETS[preset]); render(); fxPageOpen(); animPageOpen(); });
    return button;
  });
  const replay = Object.assign(document.createElement("button"), { type: "button", className: "filter-button", textContent: "Replay page open" });
  replay.addEventListener("click", () => { fxPageOpen(); animPageOpen(); }); // anims.js
  row.append(...buttons, replay);
  return row;
}

function groupCard({ title, note, keys, presets }, current) {
  const card = Object.assign(document.createElement("section"), { className: "card" });
  const heading = Object.assign(document.createElement("div"), { className: "card-title", textContent: title });
  const form = Object.assign(document.createElement("form"), { className: "appearance-form" });
  form.append(...groupsFor(keys, current));
  const extra = note ? [Object.assign(document.createElement("p"), { className: "muted", textContent: note })] : [];
  card.append(heading, ...(presets ? [presetRow()] : []), form, ...extra);
  return card;
}

// The preview is made of the real shared pieces (chip, bar, tick, icons), so it shows what the pages get.
function appearancePreview() {
  const preview = Object.assign(document.createElement("section"), { className: "card appearance-preview" });
  preview.setAttribute("aria-label", "Preview");
  preview.innerHTML = `
    <div class="preview-icons">${BRANCHES.map(b =>
      `<span style="color: var(--${b.id})" title="${b.name}"><span class="nav-dot" style="background: var(--${b.id})"></span>${iconSvg(b.id)}</span>`).join("")}</div>
    <div class="preview-row">
      <span class="level-chip" id="preview-chip" style="background: var(--deen)">7</span>
      <div class="bar"><div class="bar-fill" style="width: 62%"></div><div class="bonus-fill" style="width: 14%"></div></div>
    </div>`;
  const tick = makeCheckbox("Sample tick", true, () => {});
  const play = Object.assign(document.createElement("button"), { type: "button", className: "filter-button", textContent: "Play level-up" });
  play.addEventListener("click", () => playLevelUp(document.getElementById("preview-chip"), "deen", 8));
  const row = Object.assign(document.createElement("div"), { className: "preview-actions" });
  row.append(tick, play);
  preview.append(row);
  return preview;
}

// sync.js calls render() again when the other device changed a setting.
function render() {
  applyAppearance();
  const current = loadSettings();
  document.getElementById("appearance-groups").replaceChildren(...APPEARANCE_GROUPS.map(g => groupCard(g, current)));
}

document.getElementById("appearance-preview").replaceWith(appearancePreview());
render();
