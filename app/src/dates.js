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

const fmt = (iso, opts) => new Date(toUtc(iso)).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });

/** "2026-08-28" + "2026-10-31" → "28 août – 31 oct. 2026" */
export function formatRange(start, end) {
  if (!start || !end) return "Dates à confirmer";
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const from = fmt(start, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return `${from} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Short hint shown on each card: "Dernier jour", "Encore 12 jours", "Dans 3 jours"… */
export function countdown(e, today = todaySeoul()) {
  const status = statusOf(e, today);
  if (status === "current" && e.endDate) {
    const left = daysBetween(today, e.endDate);
    if (left === 0) return "Dernier jour";
    return left <= 14 ? `Encore ${left} jour${left > 1 ? "s" : ""}` : null;
  }
  if (status === "upcoming" && e.startDate) {
    const until = daysBetween(today, e.startDate);
    return until === 1 ? "Demain" : `Dans ${until} jours`;
  }
  return null;
}
