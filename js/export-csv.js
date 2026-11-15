// Settings → Backup → "Export CSV": one branch's events as a spreadsheet file.
// Pure helpers (tests/export.test.js); settings-page.js does the clicking and downloading.

const CSV_COLUMNS = ["date", "activity", "xp", "details"];

// RFC 4180: wrap a field in quotes when it holds a comma, quote or line break, and double its quotes.
function csvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Header + one line per row ({date, activity, xp, details}), CRLF between lines as the RFC says.
function eventsToCsv(rows) {
  return [CSV_COLUMNS, ...rows.map(r => CSV_COLUMNS.map(c => r[c]))]
    .map(line => line.map(csvField).join(","))
    .join("\r\n");
}

// Everything but date / activity / id, as "key=value; key=value".
function eventDetails(event) {
  const { date, activity, id, ...rest } = event;
  return Object.entries(rest)
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join("; ");
}

// The events scoring.js counts for this branch, oldest first. xp is core + extra from scoreEvent,
// so events that score nothing (a planned tick, a perk) aren't in any branch's file.
function branchCsvRows(events, branchId) {
  return events
    .map(event => ({ event, score: scoreEvent(event, events) }))
    .filter(({ score }) => score && score.branch === branchId)
    .map(({ event, score }) => ({
      date: event.date, activity: event.activity, xp: score.core + score.extra, details: eventDetails(event),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
