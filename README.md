# West Bengal Bidhan Sabha 2026 Live Dashboard

## Run locally

```bash
npm start
```

Open: `http://localhost:3000`

## Deploy quickly (Render)

1. Push this repo to GitHub.
2. Create a new **Web Service** on Render.
3. Use:
   - **Build Command:** `npm install --production=false || true`
   - **Start Command:** `npm start`
4. Deploy and open your Render URL.

## Deploy with Docker

```bash
docker build -t wb-election-live .
docker run -p 3000:3000 wb-election-live
```

## Notes

- The dashboard attempts live crawl from:
  - ECI result pages
  - ABP Bengali
  - News18 Bengali
- If outbound internet is blocked in your runtime, the API will return an error payload.


## Deploy on Vercel

1. Push repo to GitHub.
2. In Vercel dashboard, click **Add New → Project** and import this repository.
3. Framework preset: **Other**.
4. Keep build command empty (or `npm install`), output directory empty.
5. Deploy.
6. Vercel will use `vercel.json` routes:
   - `/` serves `public/index.html`
   - `/api/live-results` serves serverless crawler from `api/live-results.js`

### Optional CLI deploy

```bash
npm i -g vercel
vercel
vercel --prod
```


## Deploy on Netlify

1. Push this repo to GitHub.
2. In Netlify, click **Add new site → Import an existing project**.
3. Select this repository.
4. Build settings:
   - Build command: *(leave blank)*
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
5. Deploy site.

Netlify routing is preconfigured in `netlify.toml`:
- `/` serves `public/index.html`
- `/api/live-results` maps to `/.netlify/functions/live-results`

### Netlify CLI

```bash
npm i -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```
