// Fetches current and upcoming Kukje Gallery exhibitions from its JSON API.
const SITE = "https://www.kukjegallery.com";
const API = `${SITE}/api/exhibitions`;
const ROUTES = ["current", "upcoming"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPage(route, page) {
  await sleep(1000); // be polite to the server
  const params = new URLSearchParams({ page, search_year: "all", location: "", a_no_e: "" });
  const res = await fetch(`${API}/${route}?${params}`, {
    headers: { "User-Agent": "GalleryEventsBot/0.1 (exhibition aggregator)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${route} page ${page}`);
  return (await res.json()).data;
}

async function getAll(route) {
  const first = await getPage(route, 1);
  const items = [...(first.data ?? [])]; // /upcoming has no "data" key when empty
  for (let p = 2; p <= first.maxpage; p++) items.push(...((await getPage(route, p)).data ?? []));
  return items;
}

// HTML entity decoding: numeric, accented letters (&ouml; → ö) and common punctuation.
const ACCENTS = { acute: "́", grave: "̀", uml: "̈", circ: "̂", tilde: "̃", cedil: "̧", ring: "̊" };
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…", middot: "·", times: "×" };
const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z])(acute|grave|uml|circ|tilde|cedil|ring);/gi, (_, l, a) => (l + ACCENTS[a]).normalize("NFC"))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m)
    .replace(/[ \t ]+/g, " ");

// "EN<br />\r\nKO" → { name, nameKo }; a line starting with ":" continues the previous one.
function splitTitle(raw) {
  const lines = decode(raw).split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);
  const join = (ls) => ls.join(" ").replace(/\s+:/g, ":").trim() || undefined;
  const ko = join(lines.filter((l) => /[가-힣]/.test(l)));
  const en = join(lines.filter((l) => !/[가-힣]/.test(l)));
  return { name: en ?? ko, nameKo: en ? ko : undefined };
}

// "June 9 – July 19, 2026" or "August 24, 2026 - October 18, 2026" → ISO dates
function parseDates(raw) {
  const m = raw.match(/([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?\s*[–—-]\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})/);
  if (!m) return { startDate: undefined, endDate: undefined };
  const [, m1, d1, y1, m2, d2, y2] = m;
  const iso = (y, mo, d) => `${y}-${String(MONTHS.indexOf(mo) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
  const startYear = y1 ?? (MONTHS.indexOf(m1) > MONTHS.indexOf(m2) ? Number(y2) - 1 : y2);
  return { startDate: iso(startYear, m1, d1), endDate: iso(y2, m2, d2) };
}

// [{areaTitle:"Seoul", areaItems:"K1"}, …] → ["Seoul K1", …]
const toLocations = (areas) => areas.map((a) => [a.areaTitle, a.areaItems].filter(Boolean).join(" "));

export async function scrape() {
  const exhibitions = [];
  for (const route of ROUTES) {
    for (const item of await getAll(route)) {
      exhibitions.push({
        status: route,
        ...splitTitle(item.exhibition),
        ...parseDates(item.date),
        locations: toLocations(item.areas),
        image: item.image ? new URL(item.image, SITE).toString() : undefined,
        // Some exhibitions have no detail page (url = "javascript:void(0);").
        url: item.url.startsWith("/") ? SITE + item.url : `${SITE}/exhibitions`,
      });
    }
  }
  return exhibitions;
}
