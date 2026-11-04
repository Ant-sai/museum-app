// Fetches current and upcoming PKM Gallery exhibitions.
//
// The site (Collage/Artlogic platform) has no JSON API, so we read the HTML:
// 1. /exhibitions lists exhibitions under <h4>Current</h4> / <h4>Upcoming</h4> headers;
// 2. each detail page has <h1 data-categories="location">artist</h1><h2>title</h2><h3>dates</h3>.
const BASE = "https://www.pkmgallery.com";
const STATUSES = { Current: "current", Upcoming: "upcoming" };
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(path) {
  await sleep(1000); // be polite to the server
  const res = await fetch(new URL(path, BASE), {
    headers: { "User-Agent": "GalleryEventsBot/0.1 (exhibition aggregator)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
  return res.text();
}

const NAMED = { amp: "&", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
const text = (html = "") =>
  html.replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m)
    .replace(/\s+/g, " ").trim();

// "June 10 – July 25, 2026" or "October 22, 2025 – January 3, 2026" → ISO dates
function parseDates(raw) {
  const m = raw.match(/([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?\s*[–—-]\s*(?:([A-Z][a-z]+) )?(\d{1,2}), (\d{4})/);
  if (!m) return { startDate: undefined, endDate: undefined };
  const [, m1, d1, y1, m2 = m1, d2, y2] = m;
  const iso = (y, mo, d) => `${y}-${String(MONTHS.indexOf(mo) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
  const startYear = y1 ?? (MONTHS.indexOf(m1) > MONTHS.indexOf(m2) ? Number(y2) - 1 : y2);
  return { startDate: iso(startYear, m1, d1), endDate: iso(y2, m2, d2) };
}

export async function scrape() {
  // Split /exhibitions by section header and keep links from the Current/Upcoming sections.
  const listing = await getHtml("/exhibitions");
  const sections = listing.split(/<h4>/).slice(1);
  const pending = [];
  for (const section of sections) {
    const status = STATUSES[section.slice(0, section.indexOf("<")).trim()];
    if (!status) continue;
    const body = section.split(/<div class='past'>/)[0]; // the "Past" grid follows directly
    for (const [, href, card] of body.matchAll(/<a href=["'](\/exhibitions\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)) {
      if (!pending.some((p) => p.href === href)) {
        const image = card.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
        pending.push({ status, href, image: image ? new URL(image, BASE).toString() : undefined });
      }
    }
  }

  const exhibitions = [];
  for (const { status, href, image } of pending) {
    const page = await getHtml(href);
    const h1 = page.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
    const h2 = page.match(/<h2>([\s\S]*?)<\/h2>/);
    const h3 = page.match(/<h3>([\s\S]*?)<\/h3>/);
    const location = text(h1?.[1].match(/data-categories="([^"]*)"/)?.[1]);
    // The gallery also lists its yearly programme ("Upcoming Exhibitions in 2026") as an entry.
    if (/^upcoming exhibitions\b/i.test(text(h1?.[2]))) continue;
    exhibitions.push({
      status,
      name: text(h2?.[1]) || text(h1?.[2]), // h1 = artist, h2 = title (missing for some group shows)
      ...parseDates(text(h3?.[1])),
      locations: location ? location.split(/\s*\|\s*/).slice(-1) : [], // "P K M GALLERY | BARTLEBY…" → "BARTLEBY…"
      image,
      url: new URL(href, BASE).toString(),
    });
  }
  return exhibitions;
}
