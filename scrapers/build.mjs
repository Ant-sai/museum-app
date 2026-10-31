// Runs every gallery scraper and merges the results into the app's data file.
// Usage: node scrapers/build.mjs   → writes app/public/exhibitions.json
import { readFile, writeFile } from "node:fs/promises";
import * as kukje from "./kukje.mjs";
import * as hyundai from "./hyundai.mjs";
import * as whanki from "./whanki.mjs";
import * as pkm from "./pkm.mjs";

const GALLERIES = [
  { id: "kukje", name: "Kukje Gallery", url: "https://www.kukjegallery.com", scraper: kukje },
  { id: "hyundai", name: "Gallery Hyundai", url: "https://www.galleryhyundai.com", scraper: hyundai },
  { id: "whanki", name: "Whanki Museum", url: "http://whankimuseum.org", scraper: whanki },
  { id: "pkm", name: "PKM Gallery", url: "https://www.pkmgallery.com", scraper: pkm },
];

const OUTPUT = new URL("../app/public/exhibitions.json", import.meta.url);

// Previous data, used as a fallback when a gallery fails (site down, markup change…).
const previous = await readFile(OUTPUT, "utf8").then(JSON.parse).catch(() => ({ exhibitions: [] }));

const exhibitions = [];
let failures = 0;
for (const { id, scraper } of GALLERIES) {
  try {
    const items = await scraper.scrape();
    console.log(`[${id}] ${items.length} exhibitions`);
    exhibitions.push(...items.map((e) => ({ gallery: id, ...e })));
  } catch (err) {
    failures++;
    const kept = previous.exhibitions.filter((e) => e.gallery === id);
    console.error(`[${id}] failed, keeping ${kept.length} previous exhibitions:`, err.message);
    exhibitions.push(...kept);
  }
}
exhibitions.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));

const data = {
  generatedAt: new Date().toISOString(),
  galleries: GALLERIES.map(({ id, name, url }) => ({ id, name, url })),
  exhibitions,
};
await writeFile(OUTPUT, JSON.stringify(data, null, 2) + "\n");
console.log(`→ app/public/exhibitions.json (${exhibitions.length} exhibitions)`);
if (failures === GALLERIES.length) process.exit(1); // everything broke: fail the CI run
