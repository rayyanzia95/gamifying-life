// Draws settings.html: one group of radio buttons per entry in SETTING_CHOICES.

function choiceGroup(key, { label, options }, current) {
  const group = document.createElement("fieldset");
  group.className = "choice";

  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend);

  for (const option of options) {
    const row = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = key; // same name = only one in the group can be picked
    radio.value = option.value;
    radio.checked = option.value === current;
    radio.addEventListener("change", () => saveSetting(key, option.value));
    row.append(radio, " ", option.label);
    group.append(row);
  }
  return group;
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
function render() {
  const current = loadSettings();
  document.getElementById("settings").replaceChildren(
    ...Object.entries(SETTING_CHOICES).map(([key, choice]) => choiceGroup(key, choice, current[key]))
  );
}

render();
