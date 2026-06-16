# MindNote

A fast, offline-first note-taking app. Markdown editor, full-text
search, IndexedDB storage, optional Dropbox sync, PWA installable on
desktop and mobile.

## Stack

- Svelte 5 with the runes API
- Vite 7
- TypeScript strict mode
- Dexie.js over IndexedDB
- Vite PWA with Workbox
- Mermaid, KaTeX, Cytoscape for inline diagrams

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # type check
pnpm build        # production build to dist/
pnpm preview      # serve dist/ locally
```

Node 18+ and pnpm 10 are required.

## Features

- Client-side routing with no page reloads
- Debounced auto-save (500ms)
- Full-text search across all notes
- Light, dark, and system-follow themes
- PWA: installable, offline-capable, runs in airplane mode
- Manual backup and restore to a Dropbox app folder

## Configuration

Copy `.env.example` to `.env.local` and fill in any values you need.
Only `VITE_DROPBOX_APP_KEY` is currently read at build time. See
[`Docs/dropbox-setup.md`](./Docs/dropbox-setup.md).

## Project structure

```
src/
├── lib/
│   ├── db.ts                  # IndexedDB via Dexie
│   ├── store.svelte.ts        # Svelte 5 runes state
│   ├── router.ts              # Hash-based router
│   ├── dropbox.ts             # Dropbox service
│   ├── DropboxSync.svelte     # Dropbox UI
│   ├── Editor.svelte          # Markdown editor
│   ├── MarkdownPreview.svelte # Rendered preview
│   ├── Sidebar.svelte         # Note list
│   ├── Home.svelte            # Welcome screen
│   ├── Settings.svelte        # Settings panel
│   ├── ThemeSelector.svelte   # Theme switcher
│   ├── FontSelector.svelte    # Font picker
│   ├── MermaidViewer.svelte   # Mermaid renderer
│   └── Icons.svelte           # Inline SVG icons
├── App.svelte                 # Root component + routing
├── main.ts                    # Entry point
└── app.css                    # Global styles + design tokens
```

## Documentation

| Guide | Purpose |
| --- | --- |
| [`Docs/dropbox-setup.md`](./Docs/dropbox-setup.md) | Create a Dropbox app, configure credentials, sign in |
| [`Docs/deploy.md`](./Docs/deploy.md) | Deploy to Vercel with proper headers and cache |
| [`Docs/archive/`](./Docs/archive/) | Historical setup guides and status reports |

## Why not SvelteKit?

MindNote is a client-side SPA. The whole app loads once, after which
navigation is instant. A SvelteKit-style server runtime would add
deployment complexity (functions, edge runtime, build adapters) for no
benefit on a static notes app. If you want SSR or multi-page routing,
SvelteKit is the right call — but it would change the architecture
materially, not just the build command.

## Design decisions

- **Local first.** Notes live in IndexedDB. The app is fully usable
  offline. Cloud sync is a manual backup operation, not a live
  replication.
- **Single backup file.** `mindnote_backup.json` is overwritten on
  each upload. There is no history. If you want history, keep the
  file in a versioned system like a Dropbox-tracked folder, or
  implement backup rotation in `dropbox.ts`.
- **No tracking, no analytics, no telemetry.** The app makes no
  network calls except to Dropbox when you sign in.

## License

Personal project. No license declared.
