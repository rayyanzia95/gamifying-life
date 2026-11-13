// Radio groups for settings, shared by settings.html and appearance.html.
// Each setting in SETTING_CHOICES (settings.js) becomes one <fieldset>; picking saves it at once.

// A palette option shows three dots in that palette's own colours: the swatch carries
// data-palette, so the CSS palette rules apply to it alone.
function paletteSwatch(value) {
  const swatch = Object.assign(document.createElement("span"), { className: "swatch" });
  swatch.dataset.palette = value;
  swatch.innerHTML = "<i></i><i></i><i></i>";
  return swatch;
}

function choiceRow(key, option, current) {
  const row = document.createElement("label");
  const radio = Object.assign(document.createElement("input"), {
    type: "radio", name: key, value: option.value, // same name = only one in the group can be picked
    checked: option.value === current, disabled: Boolean(option.soon),
  });
  radio.addEventListener("change", () => saveSetting(key, option.value));
  // Classic has no colours of its own (it follows light/dark), so it gets no swatch.
  const hasSwatch = key.startsWith("palette") && option.value !== "classic";
  const swatch = hasSwatch ? [paletteSwatch(option.value), " "] : [];
  const soon = option.soon ? [Object.assign(document.createElement("span"), { className: "soon", textContent: " · coming next" })] : [];
  row.append(radio, " ", ...swatch, option.label, ...soon);
  return row;
}

// A range setting (the accent hue) is one slider with a dot in the colour it gives. Dragging shows the
// colour at once through --accent-hue on <html>; letting go saves (one synced event, not one per pixel).
function rangeRow(key, { min, max }, current) {
  const row = Object.assign(document.createElement("label"), { className: "range-row" });
  const slider = Object.assign(document.createElement("input"), { type: "range", min, max, value: current });
  const dot = Object.assign(document.createElement("span"), { className: "hue-dot" });
  slider.addEventListener("input", () => document.documentElement.style.setProperty("--accent-hue", slider.value));
  slider.addEventListener("change", () => saveSetting(key, Number(slider.value)));
  row.append(slider, dot);
  return row;
}

function choiceGroup(key, { label, options, range }, current) {
  const group = document.createElement("fieldset");
  group.className = "choice";
  group.dataset.key = key; // lets CSS lay out long groups (the palettes) differently
  const legend = document.createElement("legend");
  legend.textContent = label;
  const rows = range ? [rangeRow(key, range, current)] : options.map(option => choiceRow(key, option, current));
  group.append(legend, ...rows);
  return group;
}

// keys: which settings to draw, in order. current: loadSettings().
const groupsFor = (keys, current) => keys.map(key => choiceGroup(key, SETTING_CHOICES[key], current[key]));
