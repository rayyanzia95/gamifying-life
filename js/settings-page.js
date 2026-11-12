// Draws settings.html: one group of radio buttons per setting. General ones go in the
// first card, the look (APPEARANCE_CHOICES) in the Appearance card with a live preview.

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

function choiceGroup(key, { label, options }, current) {
  const group = document.createElement("fieldset");
  group.className = "choice";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend, ...options.map(option => choiceRow(key, option, current)));
  return group;
}

const groupsFor = (choices, current) =>
  Object.entries(choices).map(([key, choice]) => choiceGroup(key, choice, current[key]));

// The preview is made of the real shared controls, so it shows exactly what the pages get.
function appearancePreview() {
  const preview = Object.assign(document.createElement("div"), { className: "appearance-preview" });
  preview.innerHTML = `
    <div class="preview-row">
      <span class="level-chip" style="background: var(--deen)">7</span>
      <div class="bar"><div class="bar-fill" style="width: 62%"></div><div class="bonus-fill" style="width: 14%"></div></div>
    </div>
    <div class="preview-dots">${BRANCHES.map(b => `<span style="background: var(--${b.id})" title="${b.name}"></span>`).join("")}</div>`;
  const tick = makeCheckbox("Sample tick", true, () => {});
  preview.append(tick);
  return preview;
}

// Backup: turn the events into a .json file and click a temporary link to download it.
// A Blob is a chunk of data in memory; createObjectURL gives it a URL the link can point at.
function downloadEvents() {
  const events = loadEvents();
  const file = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `gamifying-life-events-${todayString()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000); // give the download a moment to start
  document.getElementById("backup-note").textContent = `Saved ${events.length} events.`;
}

document.getElementById("backup").addEventListener("click", downloadEvents);

// sync.js calls render() again when the other device changed a setting.
// Picking a look only redraws the radio groups; the preview restyles itself from <html>.
function render() {
  const current = loadSettings();
  applyAppearance(); // sync may have brought a new look from the other device
  document.getElementById("settings").replaceChildren(...groupsFor(GENERAL_CHOICES, current));
  document.getElementById("appearance").replaceChildren(...groupsFor(APPEARANCE_CHOICES, current));
}

document.getElementById("appearance-preview").replaceWith(appearancePreview());

render();
