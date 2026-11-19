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

// A branch colour at a hue, in the palette's own lightness (same formula as base.css). The plain --c-* line comes first
// as the fallback for browsers without relative colours. hue null = the palette's own colour.
function branchDotStyle(id, hue) {
  const own = `background: var(--c-${id})`;
  return hue === null ? own : `${own}; background: oklch(from var(--c-${id}) l max(c, 0.1) ${hue})`;
}

// A branch colour set option shows seven dots, one per branch, in that set's hues.
function setStrip(setId) {
  const strip = Object.assign(document.createElement("span"), { className: "bc-strip" });
  strip.innerHTML = BRANCH_IDS.map(id => `<i style="${branchDotStyle(id, BRANCH_SETS[setId]?.hues[id] ?? null)}"></i>`).join("");
  return strip;
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
  const swatch = hasSwatch ? [paletteSwatch(option.value), " "] : key === "branchSet" ? [setStrip(option.value), " "] : [];
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

// Featured palettes become preview cards (radio + swatch + name); the rest go in a native <details> fold,
// open by default when the saved palette is one of them so the selection is never hidden.
function paletteCard(key, option, current) {
  const row = choiceRow(key, option, current);
  row.classList.add("palette-card");
  return row;
}

function optionRows(key, options, current) {
  return options.flatMap((option, i) => {
    // A small header wherever the palette group changes (only the dark palettes have groups).
    const startsGroup = option.group && option.group !== options[i - 1]?.group;
    const head = startsGroup ? [Object.assign(document.createElement("p"), { className: "choice-head", textContent: PALETTE_GROUPS[option.group] })] : [];
    return [...head, choiceRow(key, option, current)];
  });
}

function paletteRows(key, options, featured, current) {
  const shown = options.filter(o => featured.includes(o.value));
  const rest = options.filter(o => !featured.includes(o.value));
  const more = document.createElement("details");
  more.className = "palette-more";
  more.open = rest.some(o => o.value === current);
  more.append(Object.assign(document.createElement("summary"), { textContent: "More palettes" }), ...optionRows(key, rest, current));
  return [...shown.map(o => paletteCard(key, o, current)), ...(rest.length ? [more] : [])];
}

// One branch's hue row: "Follow set" (dashed) and the swatch hues. Buttons, not radios, so each is one clear tap;
// aria-pressed marks the picked one. Saving applies at once (applyAppearance), so the dots elsewhere follow.
function hueSwatches(key, id, options, current) {
  const name = BRANCHES.find(b => b.id === id).name;
  const row = Object.assign(document.createElement("div"), { className: "bc-swatches" });
  const buttons = options.map(option => {
    const follows = option.value === "set";
    const button = Object.assign(document.createElement("button"), { type: "button", className: follows ? "bc-swatch bc-follow" : "bc-swatch" });
    button.setAttribute("aria-label", follows ? `${name}: follow set` : `${name}: hue ${option.value}`);
    button.title = option.label;
    button.setAttribute("aria-pressed", String(option.value === current));
    if (follows) button.textContent = option.label; // "Follow set" shown as text on the dashed pill
    else button.style.cssText = branchDotStyle(id, Number(option.value));
    button.addEventListener("click", () => {
      saveSetting(key, option.value);
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    });
    return button;
  });
  row.append(...buttons);
  return row;
}

function choiceGroup(key, { label, options, range, featured }, current) {
  const group = document.createElement("fieldset");
  group.className = "choice";
  group.dataset.key = key; // lets CSS lay out long groups (the palettes) differently
  const legend = document.createElement("legend");
  legend.textContent = label;
  const hueId = BRANCH_IDS.find(id => branchHueKey(id) === key);
  if (hueId) {
    legend.prepend(Object.assign(document.createElement("span"), { className: "bc-dot", style: `background: var(--${hueId})` }));
    group.classList.add("bc-row");
  }
  const rows = hueId ? [hueSwatches(key, hueId, options, current)] : range ? [rangeRow(key, range, current)]
    : key === "branchSet" ? options.map(o => paletteCard(key, o, current))
    : featured ? paletteRows(key, options, featured, current) : optionRows(key, options, current);
  group.append(legend, ...rows);
  return group;
}

// keys: which settings to draw, in order. current: loadSettings().
const groupsFor = (keys, current) => keys.map(key => choiceGroup(key, SETTING_CHOICES[key], current[key]));
