// Your preferences, saved on this device. Loaded in <head> on every page.
// Each setting lists its allowed values; the first one is the default.

const SETTINGS_KEY = "gamifying-life-settings";
const OPENED_KEY = "gamifying-life-opened";

const SETTING_CHOICES = {
  startPage: {
    label: "Open the app on",
    options: [
      { value: "index.html", label: "Home" },
      { value: "deen.html", label: "Deen" },
    ],
  },
  deenView: {
    label: "Deen opens on",
    options: [
      { value: "prayers", label: "Prayers" },
      { value: "quran", label: "Quran" },
      { value: "dua", label: "Dua" },
    ],
  },
};

function storedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

// Every setting, with anything missing or no longer allowed replaced by its default.
function loadSettings() {
  const stored = storedSettings();
  return Object.fromEntries(
    Object.entries(SETTING_CHOICES).map(([key, { options }]) => {
      const allowed = options.some(o => o.value === stored[key]);
      return [key, allowed ? stored[key] : options[0].value];
    })
  );
}

function saveSetting(key, value) {
  const next = { ...loadSettings(), [key]: value };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Private browsing can block storage; the choice lasts until reload.
  }
}

// True only for the first page you open in this tab. sessionStorage is wiped
// when the tab closes, so "Open the app on" applies each time you open the app,
// but not when you tap "← Home" later.
function isFirstPageThisVisit() {
  try {
    const first = !sessionStorage.getItem(OPENED_KEY);
    sessionStorage.setItem(OPENED_KEY, "yes");
    return first;
  } catch {
    return false;
  }
}

const firstPageThisVisit = isFirstPageThisVisit();

// Called from Home's <head>: jump to your chosen start page when the app opens.
function goToStartPage() {
  const page = loadSettings().startPage;
  if (firstPageThisVisit && page !== "index.html") location.replace(page);
}
