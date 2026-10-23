// Fetches current and upcoming Gallery Hyundai exhibitions from its JSON API.
// Usage: node hyundai.mjs   → writes hyundai.json next to the script.
import { writeFile } from "node:fs/promises";

// "On view" returns both current AND upcoming exhibitions.
const res = await fetch("https://www.galleryhyundai.com/exhibition/onview/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "GalleryEventsBot/0.1 (exhibition aggregator)",
  },
  body: JSON.stringify({ pageIndex: 1, recordCountPerPage: 100 }),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { resultList = [] } = await res.json();

// Today's date in Seoul, as YYYY-MM-DD (en-CA yields that format).
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

const exhibitions = resultList
  .map((e) => {
    const startDate = e.beginDt?.slice(0, 10);
    return {
      status: startDate > today ? "upcoming" : "current",
      name: e.exbiNmKoStripped,
      startDate,
      endDate: e.endDt?.slice(0, 10),
      locations: (e.exbiPlaceList ?? []).map((p) => p.exbiPlaceNm),
    };
  })
  .filter((e) => e.endDate >= today) // drop any finished exhibition still listed
  .sort((a, b) => a.startDate.localeCompare(b.startDate));

const count = (s) => exhibitions.filter((e) => e.status === s).length;
console.error(`[hyundai] ${count("current")} current, ${count("upcoming")} upcoming`);
const json = JSON.stringify(exhibitions, null, 2);
await writeFile(new URL("./hyundai.json", import.meta.url), json);
console.log(json);
