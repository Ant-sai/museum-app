# museum-app

Current and upcoming exhibitions in Seoul galleries, as a mobile web app (PWA).

```
scrapers/          one script per gallery + build.mjs that merges them
app/               Vue 3 + Vite PWA
  public/exhibitions.json   data file read by the app (generated)
.github/workflows/update.yml   daily scrape, commits the data
```

## Galleries

| Gallery | Source |
|---|---|
| Kukje Gallery | JSON API (`/api/exhibitions/current`, `/upcoming`) |
| Gallery Hyundai | JSON API (`POST /exhibition/onview/data`) |
| Whanki Museum | WordPress REST API + detail pages for dates |
| PKM Gallery | HTML (no API) |

To add a gallery: create `scrapers/<id>.mjs` exporting `scrape()` that returns
`{ status, name, nameKo?, startDate, endDate, locations, url }[]`, then register it in `scrapers/build.mjs`.

## Development

```bash
node scrapers/build.mjs   # refresh app/public/exhibitions.json (Node 18+)
cd app
npm install
npm run dev               # http://localhost:5173
```

If a gallery fails, `build.mjs` keeps its previous exhibitions instead of dropping them.

## Deployment

The app is hosted on Vercel, which rebuilds it on every push to `main`.
The GitHub Action runs every day at 06:00 (Seoul time), or on demand from the Actions tab,
and commits `app/public/exhibitions.json` when exhibitions changed, which triggers a Vercel deploy.

One-time Vercel setup (import the GitHub repo):

| Setting | Value |
|---|---|
| Root Directory | `app` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
