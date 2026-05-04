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
