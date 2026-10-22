// Récupère les expositions de Kukje Gallery via son API JSON.
// Usage : node kukje.mjs   → écrit expositions.json à côté du script.
import { writeFile } from "node:fs/promises";

const API = "https://www.kukjegallery.com/api/exhibitions";
const ROUTES = ["current", "upcoming", "past"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getPage(route, page) {
  await sleep(1000); // reste poli avec le serveur
  const params = new URLSearchParams({ page, search_year: "all", location: "", a_no_e: "" });
  const res = await fetch(`${API}/${route}?${params}`, {
    headers: { "User-Agent": "GalleryEventsBot/0.1 (agrégateur d'expositions)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${route} page ${page}`);
  return (await res.json()).data;
}

async function getAll(route) {
  const first = await getPage(route, 1);
  const items = [...(first.data ?? [])]; // /upcoming n'a pas de clé "data" quand c'est vide
  for (let p = 2; p <= first.maxpage; p++) items.push(...((await getPage(route, p)).data ?? []));
  return items;
}

// Décodage des entités HTML : numériques, lettres accentuées (&ouml; → ö) et ponctuation courante.
const ACCENTS = { acute: "́", grave: "̀", uml: "̈", circ: "̂", tilde: "̃", cedil: "̧", ring: "̊" };
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…", middot: "·", times: "×" };
const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z])(acute|grave|uml|circ|tilde|cedil|ring);/gi, (_, l, a) => (l + ACCENTS[a]).normalize("NFC"))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m)
    .replace(/[ \t ]+/g, " ");

// "EN<br />\r\nKO" → { nom, nomKo } ; une ligne qui commence par ":" prolonge la précédente.
function splitTitle(raw) {
  const lines = decode(raw).split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);
  const join = (ls) => ls.join(" ").replace(/\s+:/g, ":").trim() || undefined;
  const ko = join(lines.filter((l) => /[가-힣]/.test(l)));
  const en = join(lines.filter((l) => !/[가-힣]/.test(l)));
  return { nom: en ?? ko, nomKo: en ? ko : undefined };
}

// "June 9 – July 19, 2026" ou "August 24, 2026 - October 18, 2026" → dates ISO
function parseDates(raw) {
  const m = raw.match(/([A-Z][a-z]+) (\d{1,2})(?:, (\d{4}))?\s*[–—-]\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})/);
  if (!m) return { dateDebut: undefined, dateFin: undefined };
  const [, m1, d1, y1, m2, d2, y2] = m;
  const iso = (y, mo, d) => `${y}-${String(MONTHS.indexOf(mo) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
  const startYear = y1 ?? (MONTHS.indexOf(m1) > MONTHS.indexOf(m2) ? Number(y2) - 1 : y2);
  return { dateDebut: iso(startYear, m1, d1), dateFin: iso(y2, m2, d2) };
}

// [{areaTitle:"Seoul", areaItems:"K1"}, …] → ["Seoul K1", …]
const places = (areas) => areas.map((a) => [a.areaTitle, a.areaItems].filter(Boolean).join(" "));

const expositions = [];
for (const route of ROUTES) {
  const items = await getAll(route);
  console.error(`[${route}] ${items.length} expositions`);
  for (const item of items) {
    expositions.push({
      statut: route,
      ...splitTitle(item.exhibition),
      ...parseDates(item.date),
      lieux: places(item.areas),
    });
  }
}

const json = JSON.stringify(expositions, null, 2);
await writeFile(new URL("./expositions.json", import.meta.url), json);
console.log(json);
