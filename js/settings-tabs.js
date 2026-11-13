// Tabs for Settings and Appearance: General · Appearance · Sync · Backup.
// Wide screens: a tab bar under the title. Phones (< 700px): the same links as a list of rows; a row opens one section
// with a "← Settings" link back to the list. Appearance is its own page, so its tab is a link; the others are panels on
// settings.html chosen by the URL hash (so settings.html#sync, used by the sync banner, still works).
const SETTINGS_TABS = [
  { id: "general", label: "General", hint: "Start page, Deen view" },
  { id: "appearance", label: "Appearance", hint: "Colours, type, layout", href: "appearance.html" },
  { id: "sync", label: "Sync", hint: "Your other devices" },
  { id: "backup", label: "Backup", hint: "Download your events" },
];

function setupSettingsTabs() {
  const onAppearance = !document.querySelector("[data-panel]");
  const phone = matchMedia("(max-width: 699px)");
  const back = document.querySelector(".back");
  const homeBack = { href: back.getAttribute("href"), text: back.textContent };
  const nav = Object.assign(document.createElement("nav"), { className: "set-tabs", ariaLabel: "Settings sections" });
  nav.innerHTML = SETTINGS_TABS.map(tab =>
    `<a href="${tab.href ?? `#${tab.id}`}" data-tab="${tab.id}"><span>${tab.label}</span><small>${tab.hint}</small></a>`).join("");
  document.querySelector("h1").after(nav);

  const show = () => {
    const hash = location.hash.slice(1);
    const known = SETTINGS_TABS.some(tab => tab.id === hash && !tab.href);
    // Phone with no section chosen: just the list. Otherwise the chosen section (General by default).
    const active = onAppearance ? "appearance" : known ? hash : phone.matches ? "" : "general";
    document.body.dataset.tab = active;
    nav.dataset.current = active;
    nav.querySelectorAll("a").forEach(link => link.toggleAttribute("aria-current", link.dataset.tab === active));
    const inSection = !onAppearance && phone.matches && active !== "";
    back.setAttribute("href", inSection ? "#" : homeBack.href);
    back.textContent = inSection ? "← Settings" : homeBack.text;
  };
  addEventListener("hashchange", show);
  phone.addEventListener("change", show);
  show();
}

setupSettingsTabs();
