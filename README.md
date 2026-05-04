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

## Fixing ECI 403: environment configuration checklist

If you still see `403` from ECI, the app code is running but your host egress path is being blocked/challenged. Configure your environment like this:

1. **Use a server region close to India** (Mumbai/Singapore if available).
2. **Set a static outbound IP** (or NAT gateway) so requests are consistent.
3. **Route upstream calls through your own proxy** and set:
   - `UPSTREAM_PROXY_PREFIX=https://<your-proxy-domain>/fetch?url=`
4. Optional hardening env vars:
   - `FETCH_TIMEOUT_MS=30000`
   - `FETCH_USER_AGENT=Mozilla/5.0 ...`
   - `USE_JINA_FALLBACK=true`
5. Confirm network access from your runtime:

```bash
curl -I 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm'
curl -I 'https://r.jina.ai/http://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S25.htm'
```

If (1) is `403` but (2) is `200`, keep `USE_JINA_FALLBACK=true` (default). If both are `403`, you must use a proxy/VPS relay in front of ECI.

### Where to add env vars

- **Vercel:** Project → Settings → Environment Variables.
- **Netlify:** Site settings → Environment variables.
- **Render:** Service → Environment.
- **Docker:** `docker run -e UPSTREAM_PROXY_PREFIX=... -e FETCH_TIMEOUT_MS=30000 -p 3000:3000 wb-election-live`.
