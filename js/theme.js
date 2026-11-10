// Light/dark theme. Loaded in <head> so the saved choice applies before the page draws.
// No saved choice = follow the device. The button saves the opposite of what you see.

const THEME_KEY = "gamifying-life-theme";

function savedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function currentTheme() {
  const deviceDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return document.documentElement.dataset.theme ?? (deviceDark ? "dark" : "light");
}

function updateButton() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  const next = currentTheme() === "dark" ? "light" : "dark";
  button.textContent = next === "dark" ? "☾" : "☀";
  button.setAttribute("aria-label", `Switch to ${next} mode`);
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private browsing can block storage; the switch still works until reload.
  }
  updateButton();
}

const initialTheme = savedTheme();
if (initialTheme) document.documentElement.dataset.theme = initialTheme;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  updateButton();
});
