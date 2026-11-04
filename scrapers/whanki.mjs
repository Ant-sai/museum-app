// Fetches current and upcoming Whanki Museum exhibitions (WordPress).
//
// The WordPress REST API provides the list, status and location, but not the dates:
// those only appear on each exhibition page (the "전시기간" block).
const WP = "http://whankimuseum.org/wp-json/wp/v2";
// exhibition_category taxonomy terms (English version of the site).
const STATUSES = { 198: "current", 194: "upcoming" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = "json") {
  await sleep(500); // be polite to the server
  const res = await fetch(url, { headers: { "User-Agent": "GalleryEventsBot/0.1 (exhibition aggregator)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return as === "json" ? res.json() : res.text();
}

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&").trim();

// "2026. 07. 24 - 2026. 12. 31" → ISO dates
function parseDates(html) {
  const block = html.split("전시기간")[1] ?? "";
  const m = block.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*[-–~]\s*(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!m) return { startDate: undefined, endDate: undefined };
  const iso = (y, mo, d) => `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return { startDate: iso(m[1], m[2], m[3]), endDate: iso(m[4], m[5], m[6]) };
}

export async function scrape() {
  const fields = "_fields=id,title,link,exhibition_category,exhibition_location,yoast_head_json,_embedded";
  const items = await get(`${WP}/exhibitions?exhibition_category=${Object.keys(STATUSES)}&per_page=100&_embed&${fields}`);

  const locationIds = [...new Set(items.flatMap((e) => e.exhibition_location))];
  const locationNames = locationIds.length
    ? Object.fromEntries((await get(`${WP}/exhibition_location?include=${locationIds}&_fields=id,name`)).map((t) => [t.id, t.name]))
    : {};

  const exhibitions = [];
  for (const e of items) {
    exhibitions.push({
      status: STATUSES[e.exhibition_category.find((c) => STATUSES[c])],
      name: decode(e.title.rendered),
      ...parseDates(await get(e.link, "text")),
      locations: e.exhibition_location.map((id) => decode(locationNames[id] ?? "")).filter(Boolean),
      image: e.yoast_head_json?.og_image?.[0]?.url ?? e._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
      url: e.link,
    });
  }
  return exhibitions;
}
