// Fetches current and upcoming Gallery Hyundai exhibitions from its JSON API.
const SITE = "https://www.galleryhyundai.com";

export async function scrape() {
  // "On view" returns both current AND upcoming exhibitions.
  const res = await fetch(`${SITE}/exhibition/onview/data`, {
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

  return resultList
    .map((e) => {
      const startDate = e.beginDt?.slice(0, 10);
      return {
        status: startDate > today ? "upcoming" : "current",
        name: e.exbiNmKoStripped,
        startDate,
        endDate: e.endDt?.slice(0, 10),
        locations: (e.exbiPlaceList ?? []).map((p) => p.exbiPlaceNm),
        image: e.exbiImage?.trlpth ? new URL(`/public${e.exbiImage.trlpth}`, SITE).toString() : undefined,
        url: `${SITE}/exhibition/view/${e.exbiSn}`,
      };
    })
    .filter((e) => e.endDate >= today); // drop any finished exhibition still listed
}
