# NODDO render worker (generic HTML→PDF)

A generic, app-agnostic HTML→PDF service. It renders ANY fully self-contained HTML
to a PDF with headless Chromium and returns the bytes. It contains **no NODDO /
cotización specifics** — the calling app sends complete HTML (inline CSS, base64
fonts/images) and gets PDF bytes back. Lives off Vercel (no Chromium there) and
deploys to Railway.

- `GET  /health` → `200 "ok"` (unauthenticated)
- `POST /render` → body = HTML (`text/plain`) **or** `{html, format?, landscape?, scale?}` (`application/json`); header `x-render-token` required → `application/pdf`

## Files

- `server.mjs` — the HTTP worker (ESM, zero deps, Node builtins only)
- `package.json` — worker manifest (`type: module`, `start` / `check` / `test` scripts)
- `fonts/` — the 4 NODDO brand fonts baked into the image (Cormorant / Syne / Inter / DM Mono)
- `Dockerfile` — `node:20-slim` + Debian `chromium` + brand fonts
- `.dockerignore` — keeps `test/` and docs out of the image
- `railway.json` — DOCKERFILE builder + `/health` healthcheck
- `test/smoke.mjs` + `test/fixture.html` — local smoke/contract test (`node --test`)

## Environment variables

| Var | Required | Default | Purpose |
| --- | --- | --- | --- |
| `RENDER_SHARED_SECRET` | **yes** | — | Shared secret. Every `/render` request must send it as the `x-render-token` header. The server **refuses to start** if unset. |
| `CHROME_PATH` | on Linux | Windows Edge→Chrome probe | Path to the Chromium/Chrome/Edge binary. The Docker image sets `/usr/bin/chromium`. |
| `PORT` | no | `4042` | Listen port. Railway injects this automatically. |

The PDF render flags `--no-sandbox --disable-dev-shm-usage --headless=new` are
**mandatory** when Chromium runs as root in a container (Railway/Linux) and are
applied unconditionally by the worker.

## Run locally (Windows)

Point `CHROME_PATH` at an installed browser, set a secret, and start:

```powershell
$env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
# or: $env:CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"
$env:RENDER_SHARED_SECRET = "dev-secret"
node server.mjs
```

Health check, then a render:

```powershell
curl http://127.0.0.1:4042/health           # -> ok
curl -X POST http://127.0.0.1:4042/render `
  -H "content-type: text/plain" `
  -H "x-render-token: dev-secret" `
  --data-binary "@test/fixture.html" `
  --output out.pdf                           # -> writes out.pdf
```

## Smoke / contract test

The test boots the server, waits for `/health`, and asserts a non-empty
`application/pdf` comes back for both the `text/plain` and JSON paths, plus the
`401` auth gate. It needs a local Chromium, so set `CHROME_PATH` first:

```powershell
$env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
node --test
```

Expected: all subtests pass (`# pass 6  # fail 0`). On Linux use
`CHROME_PATH=/usr/bin/chromium node --test`.

## Build the image locally

```bash
docker build -t noddo-render-worker .
docker run --rm -e RENDER_SHARED_SECRET=dev-secret -p 4042:4042 noddo-render-worker
```

## Deploy to Railway — GO-LIVE (owner-run, separate from code changes)

> **This is a deploy step, not a code task.** Building and testing the worker
> needs no Railway access; only the live deploy does. The owner runs this (or
> provides a `RAILWAY_API_TOKEN` so it can be run for them). Until
> `COTIZADOR_RENDER_URL` is set in the NODDO Vercel project, the app's quote-PDF
> path stays on its current behavior — deploying the worker is safe and
> independent.

```powershell
$env:RAILWAY_API_TOKEN = "<owner-provided Railway API token>"
railway link                                  # link this dir to the Railway project
railway up --detach                           # build remotely + deploy this Dockerfile
railway variables --set RENDER_SHARED_SECRET=<a-strong-random-secret>
railway domain                                # mint a public URL
```

Then in the **NODDO** Vercel project (prod + preview) set:

- `COTIZADOR_RENDER_URL = https://<the-railway-domain>`
- `RENDER_SHARED_SECRET = <the same strong secret>`

and redeploy. The app sends `x-render-token: $RENDER_SHARED_SECRET` on every
`POST /render`. Rotate the secret by updating both sides.
