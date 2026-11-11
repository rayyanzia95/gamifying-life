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

const current = loadSettings();
document.getElementById("settings").replaceChildren(
  ...Object.entries(SETTING_CHOICES).map(([key, choice]) => choiceGroup(key, choice, current[key]))
);
