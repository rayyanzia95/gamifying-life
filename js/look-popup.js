// Home's "Appearance" pill: a <dialog> to switch layout, palette and light/dark without leaving Home.
// Reuses settings.js (SETTING_CHOICES, saveSettings, applyAppearance), theme.js (toggleTheme) and choice-form.js (paletteSwatch).

const lookDialog = document.createElement("dialog");
lookDialog.className = "look-dialog";
lookDialog.setAttribute("aria-label", "Appearance");

const lookPaletteKey = () => (currentTheme() === "dark" ? "paletteDark" : "paletteLight");

function lookButton(label, pressed, onClick, className) {
  const button = Object.assign(document.createElement("button"), { type: "button", textContent: label, className });
  button.setAttribute("aria-pressed", String(pressed));
  button.addEventListener("click", onClick);
  return button;
}

function lookSection(title, ...children) {
  const section = document.createElement("section");
  section.append(Object.assign(document.createElement("h3"), { textContent: title }), ...children);
  return section;
}

// Layouts are read at load, so a pick is saved and Home reloads without ?view (a city peek).
function pickLayout(value) {
  saveSettings({ layout: value });
  location.href = "index.html";
}

function layoutTiles() {
  const saved = loadSettings().layout;
  const row = Object.assign(document.createElement("div"), { className: "look-tiles" });
  const options = SETTING_CHOICES.layout.options.filter(o => !EXPERIMENTAL_LAYOUTS.includes(o.value));
  row.append(...options.map(o => lookButton(o.label, o.value === saved, () => pickLayout(o.value), "look-tile")));
  return row;
}

function pickPalette(value) {
  saveSettings({ [lookPaletteKey()]: value });
  applyAppearance();
  drawLookPopup();
}

function paletteRow() {
  const key = lookPaletteKey();
  const current = loadSettings()[key];
  const row = Object.assign(document.createElement("div"), { className: "look-palettes" });
  row.append(...SETTING_CHOICES[key].options.map(o => {
    const button = lookButton("", o.value === current, () => pickPalette(o.value), "look-palette");
    button.setAttribute("aria-label", o.label);
    button.title = o.label;
    if (o.value !== "classic") button.append(paletteSwatch(o.value));
    else button.textContent = "Aa";
    return button;
  }));
  return row;
}

function modeSwitch() {
  const dark = currentTheme() === "dark";
  const setMode = wantDark => { if (wantDark !== (currentTheme() === "dark")) { toggleTheme(); drawLookPopup(); } };
  const row = Object.assign(document.createElement("div"), { className: "look-mode" });
  row.append(lookButton("Light", !dark, () => setMode(false)), lookButton("Dark", dark, () => setMode(true)));
  return row;
}

function drawLookPopup() {
  const close = lookButton("×", false, () => lookDialog.close(), "look-close");
  close.removeAttribute("aria-pressed");
  close.setAttribute("aria-label", "Close");
  const more = Object.assign(document.createElement("a"), { href: "appearance.html", textContent: "More settings →", className: "look-more" });
  const head = Object.assign(document.createElement("header"), { className: "look-head" });
  head.append(Object.assign(document.createElement("h2"), { textContent: "Appearance" }), close);
  lookDialog.replaceChildren(head, lookSection("Layout", layoutTiles()), lookSection("Colours", paletteRow()), lookSection("Mode", modeSwitch()), more);
}

function openLookPopup() {
  drawLookPopup();
  lookDialog.showModal();
}

document.addEventListener("DOMContentLoaded", () => {
  const pill = document.getElementById("look-open");
  if (!pill) return;
  document.body.append(lookDialog);
  pill.addEventListener("click", openLookPopup);
  lookDialog.addEventListener("close", () => pill.focus());
  lookDialog.addEventListener("click", e => { if (e.target === lookDialog) lookDialog.close(); }); // backdrop click
});
