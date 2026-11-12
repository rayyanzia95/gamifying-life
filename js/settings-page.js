// Draws settings.html: one group of radio buttons per general setting (choice-form.js).
// The look of the app has its own page, appearance.html.

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
  applyAppearance(); // sync may have brought a new look from the other device
  document.getElementById("settings").replaceChildren(...groupsFor(Object.keys(GENERAL_CHOICES), loadSettings()));
}

render();
