# Deploying MindNote to Vercel

This project is a Vite + Svelte 5 SPA with PWA. It deploys to Vercel as a static
site with zero server runtime. The Vercel adapter for SvelteKit is **not** used
because the project does not use SvelteKit.

## One-time setup

```bash
# 1. Install the Vercel CLI (optional — the dashboard works too)
pnpm add -g vercel

# 2. Login
vercel login

# 3. Link the project (run from the repo root)
vercel link
#    Set the project name when prompted, e.g. "mindnoteku"
#    Confirm the existing project that was created from the GitHub import.
```

## Environment variables

MindNote only needs the Dropbox key. Google Drive sync has been removed from
this build.

```bash
vercel env add VITE_DROPBOX_APP_KEY production
# paste the key, then repeat for preview and development
```

The value is bundled at build time (it must be prefixed with `VITE_`). It is
exposed to the browser, so use a Dropbox app that is restricted to your own
account.

## Deploy

### From the CLI

```bash
vercel              # preview deploy
vercel --prod       # production deploy
```

### From the dashboard

1. Import the GitHub repository `podsni/mindnoteku`.
2. Vercel auto-detects the framework as **Vite**.
3. Confirm:
   - **Build command:** `pnpm run build`
   - **Output directory:** `dist`
   - **Install command:** `pnpm install --frozen-lockfile`
4. Add `VITE_DROPBOX_APP_KEY` under **Settings → Environment Variables**.
5. Click **Deploy**.

Subsequent pushes to `main` trigger automatic production deployments.

## How the configuration works

| File | Purpose |
| --- | --- |
| `vercel.json` | Build settings, SPA routing, security and cache headers |
| `.vercelignore` | Excludes `.agents/`, `.env`, dev-only files from the upload |
| `.env.example` | Reference for the Dropbox key |

### `vercel.json` highlights

- `framework: "vite"` makes Vercel run `pnpm run build` and serve `dist/`.
- `rewrites` keeps `/dropbox-callback` mapped to `dropbox-callback.html`
  because clean URLs are enabled.
- `/sw.js` is served with `Cache-Control: no-cache` and
  `Service-Worker-Allowed: /` so the service worker can claim the whole scope.
- `/assets/*` (Vite's hashed bundle output) is served with
  `Cache-Control: public, max-age=31536000, immutable`.
- All other paths use `must-revalidate` so updates are picked up immediately.
- A baseline security header set is applied to every response:
  HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, X-DNS-Prefetch-Control.

## Smoke test after deploy

1. Open the production URL.
2. The app should load in under 1 second on a warm connection.
3. Install as PWA: in Chrome, the address bar shows an install icon.
4. Create a note, reload, confirm the note is still there (IndexedDB).
5. Toggle airplane mode — the app should still load (service worker).
6. If Dropbox is configured, sign in and confirm sync works.

## Troubleshooting

- **Service worker not registering** — clear site data and reload. The
  `Service-Worker-Allowed: /` header must be present; check the response
  headers for `/sw.js` in DevTools → Network.
- **Fonts flash on first load** — the Google Fonts request is preconnect-hinted
  in `index.html`. For zero flash, self-host the families in `assets/fonts/`
  and import them from `app.css`.
- **404 on `/dropbox-callback`** — confirm the rewrite in `vercel.json` and
  that the Dropbox app's redirect URI matches the deployed domain.
- **Old version still showing** — the service worker caches aggressively. Hard
  reload (Cmd/Ctrl+Shift+R) or clear site data.
