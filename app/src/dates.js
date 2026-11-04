// All galleries are in Seoul (or follow its calendar), so "today" is Seoul's date.
export const todaySeoul = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

const DAY = 86_400_000;
const toUtc = (iso) => Date.parse(`${iso}T00:00:00Z`);
export const daysBetween = (fromIso, toIso) => Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY);

/**
 * The data file is generated once a day: recompute the status from the dates so an
 * exhibition that opened or closed since then is classified correctly.
 */
export function statusOf(e, today = todaySeoul()) {
  if (e.endDate && e.endDate < today) return "past";
  if (e.startDate) return e.startDate > today ? "upcoming" : "current";
  return e.status;
}

const fmt = (iso, opts) => new Date(toUtc(iso)).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

/** "2026-08-28" + "2026-10-31" → "28 Aug – 31 Oct 2026" */
export function formatRange(start, end) {
  if (!start || !end) return "Dates TBA";
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const from = fmt(start, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return `${from} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function formatCardRange(start, end) {
  if (!start || !end) return "Dates TBA";
  const compact = (iso) => `${iso.slice(0, 4)}.${iso.slice(5, 7)}.${iso.slice(8, 10)}`;
  const finish = start.slice(0, 4) === end.slice(0, 4)
    ? `${end.slice(5, 7)}.${end.slice(8, 10)}`
    : compact(end);
  return `${compact(start)} — ${finish}`;
}

/** Short hint shown on each card: "Last day", "12 days left", "Opens in 3 days"… */
export function countdown(e, today = todaySeoul()) {
  const status = statusOf(e, today);
  if (status === "current" && e.endDate) {
    const left = daysBetween(today, e.endDate);
    if (left === 0) return "Last day";
    return left <= 14 ? `${left} day${left > 1 ? "s" : ""} left` : null;
  }
  if (status === "upcoming" && e.startDate) {
    const until = daysBetween(today, e.startDate);
    return until === 1 ? "Opens tomorrow" : `Opens in ${until} days`;
  }
  return null;
}
