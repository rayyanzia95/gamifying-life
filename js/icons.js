// Drawn icons for the nav, Home rows and page titles (Appearance → Icons). On every page, before nav.js.
// Each icon is a few SVG paths on a 24×24 grid, sorted by job, so one drawing gives both styles:
//   b = body: outlined, or filled in the Filled style
//   k = cut-out detail: a line in the icon colour, or in the page colour when the body is filled
//   l = line that is always a line
//   f = part that is always filled
// Colour comes from `currentColor`, so an icon takes the colour of the text it sits in.

const ICONS = {
  home: { b: "M4 11 12 4l8 7v9H4z", k: "M10 20v-5h4v5" },
  // Deen: a crescent with a small star beside it, kept plain on purpose (no script or text).
  deen: { b: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z", f: "M17.5 4.5l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" },
  chores: { b: "M8 12.5h8l2 7.5H6z", l: "M12 12.5V3", k: "M10 16v4M14 16v4" }, // a broom
  health: { b: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z", k: "M7.5 12.5h2.2l1.3-2.5 2 4.5 1.3-2h2.2" },
  academics: { b: "M3 5.5c3-1 6.5-.8 9 1.2 2.5-2 6-2.2 9-1.2v13c-3-1-6.5-.8-9 1.2-2.5-2-6-2.2-9-1.2z", k: "M12 6.7v13.2" },
  money: { b: "M4 7.5A1.5 1.5 0 0 1 5.5 6H19v13H5.5A1.5 1.5 0 0 1 4 17.5z", k: "M19 10.5h-3.5a2 2 0 0 0 0 4H19" },
  personal: { b: "M5 19c0-8.3 5.7-14 14-14 0 8.3-5.7 14-14 14z", k: "M5 19 14.5 9.5" },
  people: { b: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z", l: "M15.5 4.6a3.5 3.5 0 0 1 0 6.8M17.8 14.3c2.2.7 3.7 2.8 3.7 5.7" },
  rewards: { b: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" },
  settings: { b: "M11.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM17.5 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z", l: "M4 7h2.5M11.5 7H20M4 17h8.5M17.5 17H20" },
  appearance: { b: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", f: "M12 3v18a9 9 0 0 0 0-18z", k: "M12 3.5v17" }, // light and dark
};

// The <svg> for one icon, or "" if there is none. Hidden from screen readers: the text beside it says the name.
function iconSvg(id) {
  const icon = ICONS[id];
  if (!icon) return "";
  const paths = Object.entries(icon).map(([part, d]) => `<path class="ic-${part}" d="${d}"/>`).join("");
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
}
