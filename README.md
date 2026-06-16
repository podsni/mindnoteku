# MindNote

> Fast, offline-first Markdown notes. Single-page app, zero server, full keyboard, installable on every device.

MindNote is a focused writing environment for Markdown. Notes live in your browser (IndexedDB), the app works fully offline after first load, and you can install it as a PWA on desktop and mobile. Cloud sync is **optional** — a manual backup to Dropbox when you want it, never a silent live replication.

**Live demo:** [https://mindnoteku.vercel.app](https://mindnoteku.vercel.app)

---

## Table of contents

- [Why MindNote](#why-mindnote)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Editor tour](#editor-tour)
- [Themes](#themes)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Configuration](#configuration)
- [PWA install](#pwa-install)
- [Build & deploy](#build--deploy)
- [Browser support](#browser-support)
- [Documentation](#documentation)
- [Design decisions](#design-decisions)
- [Performance notes](#performance-notes)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why MindNote

Most note apps are either too heavy (Notion, Obsidian sync), too plain (text files in a folder), or too dependent on an account. MindNote sits in the middle:

- **Single bundle**, no installer. The whole app is a Vite build that runs from any static host.
- **Local-first.** Notes are in IndexedDB. Closing the tab does not lose anything. Clearing site data does — but the manual export/import makes that recoverable.
- **Markdown, not WYSIWYG.** A live preview pane, inline code blocks, Mermaid diagrams, KaTeX math, syntax highlighting.
- **Installable.** Add to home screen on iOS/Android, install as a desktop app on Chrome/Edge. Works in airplane mode.
- **Optional cloud.** Backup and restore to Dropbox when you want. No background sync, no telemetry, no third-party analytics.

---

## Features

### Writing

- **Markdown editor** with live preview pane (toggle or split view)
- **Full Markdown spec:** headings, lists, task lists, blockquotes, tables, footnotes, images, links, code blocks with syntax highlighting
- **Mermaid diagrams** (flowchart, sequence, class, state, ER, Gantt, pie, git, journey) inline
- **KaTeX math** (block and inline) inline
- **Outline sidebar** with H1–H6 navigation; jump-to-section
- **Backlinks** panel — see which notes reference the current note via `[[wikilinks]]`
- **Word count** and live character statistics in the status bar
- **Hideable toolbar** (persisted per device via `localStorage`)
- **Focus mode** for distraction-free writing

### Storage & sync

- **IndexedDB** via Dexie.js — fast, indexed queries, persists across reloads
- **Manual JSON backup** — export all notes as one file, import anywhere
- **Dropbox backup/restore** — OAuth 2.0 implicit flow, single `mindnote_backup.json` in your app folder
- **No background sync.** Backup is explicit. If you delete the file in Dropbox, MindNote does not know and does not care.
- **No telemetry, no analytics, no third-party calls** except Dropbox on auth.

### Search & organization

- **Full-text search** across all notes (Dexie indexed)
- **Pin notes** to keep them on top
- **Sort** by updated time, created time, title, pinned
- **Virtual list** for thousands of notes without jank

### UI

- **11 themes** including 3 glassmorphism variants (Everforest, Tokyo Night, Gruvbox)
- **Per-device font picker** (default serif/mono/sans stacks)
- **Mobile-first responsive** — single-row mobile header (39px), compact toolbar (43px), 9.6% chrome on Pixel 5
- **Touch targets** ≥36px (WCAG 2.5.5)
- **Keyboard-first** — every action has a shortcut
- **Offline indicator** in the status bar
- **Sidebar** with note list, search, and import/export controls

### PWA

- **Installable** on iOS, Android, ChromeOS, macOS, Windows, Linux
- **Service worker** with Workbox precaching (61 entries, 3.8 MB)
- **Offline-capable** — full app shell + assets + Google Fonts after first load
- **Auto-update** registration — new versions activate on next load

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Svelte 5 (runes API) | Smallest runtime, no virtual DOM, first-class TS, `$state` reactivity is excellent for editor state |
| Build | Vite 7 | Fastest dev server, native ES modules, PWA plugin, manual chunking |
| Language | TypeScript (strict) | Catch data-model bugs at build time |
| Storage | Dexie 4 over IndexedDB | Indexed queries, schema migration, promise API |
| Routing | Hash-based custom router | SPA with no server, no SvelteKit runtime |
| Markdown | `marked` 16 + `dompurify` | Spec coverage + XSS sanitization on render |
| Diagrams | `mermaid` 11 | Inline diagrams in any note |
| Math | `katex` 0.16 | Faster than MathJax, smaller bundle |
| Code highlight | `highlight.js` 11 | 200+ languages, themeable |
| List virtualization | `svelte-virtual-list` | Handle 10k+ notes without DOM bloat |
| PWA | `vite-plugin-pwa` + Workbox | Auto-update, runtime caching, manifest generation |
| Styling | Tailwind 4 + custom CSS | Tailwind for utilities, plain CSS for design tokens and theme variants |
| Hosting | Vercel (static) | Free tier, GitHub integration, instant cache invalidation |

### What is deliberately NOT in the stack

- **No SvelteKit.** A server runtime would add deployment complexity (functions, edge runtime, build adapters) for no benefit on a static notes app. See [Why not SvelteKit?](#why-not-sveltekit).
- **No state library beyond Svelte runes.** No Redux, MobX, Zustand. Svelte 5 `$state` and `$derived` cover it.
- **No CSS-in-JS.** Tailwind utilities + a single 1,015-line `app.css` for tokens and themes.
- **No ORM, no backend.** All persistence is local.

---

## Quick start

```bash
# Prerequisites: Node 18+, pnpm 10
pnpm install
pnpm dev          # http://localhost:5173

# Other scripts
pnpm check        # type check (svelte-check + tsc)
pnpm build        # production build to dist/
pnpm preview      # serve dist/ locally on :4173
```

The first `pnpm dev` takes ~2s. Hot module replacement is instant.

### First run

1. Open the app. You'll see a hero with a **+ New note** button.
2. Click it (or press `Ctrl+N`).
3. Start writing Markdown. The preview pane updates as you type.
4. Open the sidebar to see your note in the list.
5. Optional: install as PWA (browser menu → "Install MindNote").

---

## Editor tour

### Header (top bar)

- **Hamburger (left)** — open sidebar (`Ctrl+B` / `Cmd+B`)
- **Title input** — note title, autosaved on blur
- **Action buttons (right):**
  - **Show/Hide tools** — toggle formatting toolbar
  - **Outline** — open outline panel
  - **Split** — split editor + preview side by side
  - **Preview** — preview pane
  - **Pin** — pin note to top of list
  - **Download** — per-note export to `.md` or `.txt`
  - **Delete** — delete note (with confirmation)

### Toolbar

- **B** bold, **I** italic, **S** strikethrough, **`<>`** inline code
- **H▼** heading level (H1–H6)
- **•** bulleted list, **1.** numbered list, **☐** task list
- **🔗** link, **🖼** image, **⊞** table

### Sidebar (left)

- **Search bar** — full-text search across all notes
- **Sort controls** — updated/created/title/pinned
- **Note list** — virtual-scrolled, shows title, preview (first 150 chars), relative timestamp
- **Import / Export** buttons at the bottom — JSON backup
- **Settings** — themes, fonts, Dropbox sync

### Editor area

- **Edit mode** — raw Markdown
- **Preview mode** — rendered HTML (Mermaid, KaTeX, syntax highlight)
- **Split mode** — both, side by side (desktop) or stacked (mobile)

### Status bar (bottom)

- **Left:** word count, character count (with and without spaces)
- **Right:** last updated timestamp
- **Backlinks indicator** — click to see incoming `[[wikilinks]]`

---

## Themes

11 built-in themes, switchable in Settings → Theme. All themes use CSS custom properties defined in `src/app.css`.

| ID | Name | Style |
|---|---|---|
| `dark` | 🌙 Dark | Default. Pure black background, soft white text. |
| `light` | ☀️ Light | Clean white background, dark text. |
| `typewriter` | 📝 Typewriter | Sepia tones, monospace body, paper-like texture. |
| `minimal` | ✨ Minimal | High contrast, generous whitespace. |
| `dark-typewriter` | 🖋️ Dark Typewriter | Dark sepia, monospace body, low-glare for night writing. |
| `green-terminal` | 💚 Green Terminal | Phosphor green on near-black, retro CRT vibe. |
| `amber-noir` | 🔶 Amber Noir | Amber on charcoal, warm noir palette. |
| `indigo-typewriter` | 💜 Indigo Typewriter | Deep indigo background, monospace, focus-friendly. |
| `everforest-transparent` | 🌳 Everforest Glass | Forest green, glassmorphism (backdrop blur). |
| `tokyo-night-transparent` | 🌌 Tokyo Night Glass | Tokyo Night palette, glassmorphism. |
| `gruvbox-transparent` | 🎹 Gruvbox Glass | Gruvbox warm retro palette, glassmorphism. |

Theme switching animates with a 400ms cross-fade (`.theme-changing` class).

---

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New note | `Ctrl+N` / `Cmd+N` |
| Toggle sidebar | `Ctrl+B` / `Cmd+B` |
| Toggle preview | `Ctrl+P` / `Cmd+P` |
| Toggle split view | `Ctrl+Shift+P` / `Cmd+Shift+P` |
| Toggle outline | `Ctrl+O` / `Cmd+O` |
| Toggle toolbar | `Ctrl+T` / `Cmd+T` |
| Bold | `Ctrl+B` / `Cmd+B` (in editor) |
| Italic | `Ctrl+I` / `Cmd+I` |
| Strikethrough | `Ctrl+Shift+X` / `Cmd+Shift+X` |
| Inline code | `Ctrl+`` ` / `Cmd+`` ` |
| Save (autosave) | automatic 500ms after last keystroke |
| Download note | click button — no default shortcut |
| Delete note | click button — no default shortcut |
| Settings | click ⚙ icon — no default shortcut |

`Ctrl` on Windows/Linux, `Cmd` on macOS. Shortcuts that overlap with browser defaults (like `Ctrl+P` for print) are intercepted and prevented.

---

## Project structure

```
mindnote/
├── public/                       # Static assets
│   ├── favicon.svg
│   └── icons/                    # PWA icon set
├── src/
│   ├── lib/
│   │   ├── db.ts                 # Dexie schema, migrations, Note type
│   │   ├── store.svelte.ts       # Reactive notes + UI state (Svelte 5 runes)
│   │   ├── router.ts             # Hash-based SPA router
│   │   ├── dropbox.ts            # Dropbox OAuth + backup service
│   │   ├── editorCommands.ts     # Text manipulation (wrap, prefix, etc.)
│   │   ├── markdown.ts           # marked config, dompurify, custom renderers
│   │   ├── ImageHandler.svelte.ts # Image paste / drag-drop / upload
│   │   ├── touchHandler.svelte.ts # Swipe gestures for sidebar
│   │   ├── App.svelte            # ❌ not here, see src/App.svelte
│   │   ├── Editor.svelte         # Main editor (1400+ lines, toolbar+header+textarea)
│   │   ├── EditorToolbar.svelte  # Formatting toolbar
│   │   ├── MarkdownPreview.svelte# Rendered HTML preview
│   │   ├── OutlineView.svelte    # H1-H6 sidebar
│   │   ├── MermaidViewer.svelte  # Inline diagram renderer
│   │   ├── Sidebar.svelte        # Note list + search + import/export
│   │   ├── Home.svelte           # Welcome / empty state
│   │   ├── Settings.svelte       # Settings panel (theme, font, sync)
│   │   ├── ThemeSelector.svelte  # Theme picker dropdown
│   │   ├── FontSelector.svelte   # Font picker
│   │   ├── ExportImport.svelte   # JSON backup controls
│   │   ├── DropboxSync.svelte    # Dropbox backup/restore UI
│   │   ├── OfflineIndicator.svelte # Online/offline status
│   │   ├── Icons.svelte          # Inline SVG icon set
│   │   └── Counter.svelte        # Legacy demo (unused)
│   ├── App.svelte                # Root component, layout, routing, PWA registration
│   ├── main.ts                   # Entry point
│   ├── app.css                   # Global styles, design tokens, theme definitions
│   ├── svelte-virtual-list.d.ts  # Type shim for virtual list
│   └── vite-env.d.ts             # Vite type references
├── Docs/                         # Detailed documentation
│   ├── deploy.md                 # Vercel deployment guide
│   ├── dropbox-setup.md          # Dropbox app creation
│   └── README.md                 # Docs index
├── vercel.json                   # Vercel config (headers, rewrites, build)
├── vite.config.ts                # Vite config (PWA, manual chunks, plugins)
├── package.json                  # Dependencies + scripts
├── tsconfig.json                 # Base TS config
├── tsconfig.app.json             # App TS config (strict)
├── tsconfig.node.json            # Node-side TS config
├── svelte.config.js              # Svelte preprocessing
├── tailwind.config.js            # Tailwind config (if any)
├── postcss.config.js             # PostCSS for Tailwind
└── README.md                     # You are here
```

---

## Data model

```ts
// src/lib/db.ts
export interface Note {
  id?: number              // Auto-incremented Dexie primary key
  title: string            // User-editable, defaults to "Untitled"
  content: string          // Raw Markdown body
  createdAt: number        // Unix ms
  updatedAt: number        // Unix ms
  pinned: boolean          // Show at top of list
}

export interface NoteMetadata {
  id: number
  title: string
  preview: string          // First 150 chars of content (computed)
  createdAt: number
  updatedAt: number
  pinned: boolean
}
```

### Dexie schema (version 3)

```ts
db.version(3).stores({
  notes: '++id, title, createdAt, updatedAt, pinned, [pinned+updatedAt]'
})
```

Indexes:
- `++id` — primary key
- `title` — for title search
- `createdAt`, `updatedAt` — for sort
- `pinned` — for pinned-only queries
- `[pinned+updatedAt]` — compound index for "pinned first, then most recent"

### Migrations

- **v1 → v2:** add `pinned` field, default `false`
- **v2 → v3:** add compound index `[pinned+updatedAt]`

Migrations are handled in `db.ts` via Dexie's `.upgrade()` callback.

### Reactive state

```ts
// src/lib/store.svelte.ts
class NotesStore {
  notes: Note[] = $state([])
  currentNote: Note | null = $state(null)
  
  async loadNotes() { ... }
  async createNote(): Promise<Note> { ... }
  async updateNote(id: number, patch: Partial<Note>) { ... }
  async deleteNote(id: number) { ... }
  async exportNotes(): Promise<string> { ... }   // JSON
  async importNotes(json: string) { ... }
}

class UIStore {
  theme: ThemeId = $state('dark')
  font: string = $state('system')
  sidebarOpen: boolean = $state(false)
  isMobile: boolean = $state(false)
  // ...
}
```

Both stores are exported as singletons (`notesStore`, `uiStore`).

---

## Configuration

Copy `.env.example` to `.env.local` and fill in any values you need.

### Environment variables

| Var | Required | Purpose |
|---|---|---|
| `VITE_DROPBOX_APP_KEY` | Optional | Dropbox app key for OAuth. If unset, the Dropbox sync option is hidden in Settings. Get one at [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps). See [`Docs/dropbox-setup.md`](./Docs/dropbox-setup.md). |

`VITE_` prefix is required for Vite to expose the variable to client code at build time.

### Build-time vs runtime

All configuration is build-time. MindNote has no runtime config — once deployed, the bundle is fixed. Theme, font, and sync settings are user preferences stored in `localStorage` and IndexedDB on the client.

---

## PWA install

### Desktop (Chrome, Edge, Brave, Arc)

1. Visit the deployed URL.
2. Browser shows an **install** icon in the URL bar (or browser menu → "Install MindNote").
3. Click it. The app opens in its own window, with a real app icon in your dock/taskbar.
4. Launch it offline. Service worker serves the full app shell.

### iOS / iPadOS

1. Open in Safari.
2. Tap the **Share** button → **Add to Home Screen**.
3. The app opens fullscreen, no Safari chrome.

### Android

1. Open in Chrome.
2. Tap the menu (⋮) → **Install app** or **Add to Home Screen**.
3. The app appears in your launcher, runs fullscreen.

### Update flow

`vite-plugin-pwa` registers a service worker with `registerType: 'autoUpdate'`. New versions activate on the next page load. You'll see a "New version available" toast in the status bar; click to reload.

---

## Build & deploy

### Build

```bash
pnpm build
```

Output: `dist/` — static site, no server required.

```
dist/
├── index.html
├── manifest.webmanifest
├── sw.js                       # Service worker (Workbox)
├── workbox-*.js                # Workbox runtime
├── assets/
│   ├── index-[hash].js         # Main bundle (~209 KB / 69 KB gzip)
│   ├── MarkdownPreview-[hash].js  # Lazy-loaded (~1.3 MB / 415 KB gzip)
│   ├── mermaid.core-[hash].js  # Lazy-loaded (~430 KB / 117 KB gzip)
│   └── ...
└── icons/                      # PWA icons
```

Manual chunking keeps the initial bundle small. Mermaid and MarkdownPreview are lazy-loaded.

### Deploy to Vercel

The project ships with a `vercel.json` that configures:

- Static site framework (`vite`)
- `pnpm install --frozen-lockfile` for deterministic builds
- `pnpm run build` for build
- Security headers on every response (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Cache-Control for `/sw.js` (no cache, always fetch latest)
- Rewrite `/dropbox-callback` → `/dropbox-callback.html` for the OAuth implicit flow

**One-time setup:**

1. Push to GitHub.
2. Import the repo in Vercel.
3. Vercel auto-detects Vite, builds, and deploys.
4. (Optional) Add `VITE_DROPBOX_APP_KEY` in Vercel → Settings → Environment Variables.

See [`Docs/deploy.md`](./Docs/deploy.md) for the full guide including Deployment Protection bypass for testing.

### Deploy elsewhere

Any static host works: Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, nginx. The only requirement is serving `index.html` for the root and serving `.webmanifest` / `.js` / `.css` with correct MIME types.

---

## Browser support

| Browser | Version | Notes |
|---|---|---|
| Chrome / Edge | 110+ | Full support, PWA install |
| Firefox | 115+ | Full support, no PWA install on desktop |
| Safari (macOS) | 16+ | Full support, no PWA install |
| Safari (iOS) | 16+ | Full support, "Add to Home Screen" works |
| Chrome (Android) | 110+ | Full support, PWA install |
| Samsung Internet | 22+ | Full support, PWA install |
| Brave | 1.60+ | Full support, PWA install |

Required APIs: IndexedDB, Service Worker, `URL.createObjectURL`, `Clipboard API`, `IntersectionObserver`, `BackdropFilter` (for glassmorphism themes).

---

## Documentation

| Guide | Purpose |
|---|---|
| [`Docs/deploy.md`](./Docs/deploy.md) | Vercel deployment, env vars, security headers, cache rules |
| [`Docs/dropbox-setup.md`](./Docs/dropbox-setup.md) | Create a Dropbox app, configure OAuth, sign in |
| [`Docs/README.md`](./Docs/README.md) | Docs index |

---

## Design decisions

### Local first

Notes live in IndexedDB. The app is fully usable offline. Cloud sync is a manual backup operation, not a live replication. This is intentional:

- **Privacy:** no third party sees your notes in real time.
- **Performance:** no network round-trip on every keystroke.
- **Resilience:** the app works in airplane mode, on a plane, on a train with no signal.

If you delete your local data and your Dropbox backup, your notes are gone. That's the trade-off for sovereignty.

### Single backup file

`mindnote_backup.json` is overwritten on each upload. There is no history in the cloud. If you want history, keep the file in Dropbox's version history (Dropbox Pro and above), or implement backup rotation in `dropbox.ts` (a `mindnote_backup-{date}.json` per backup).

### No tracking, no analytics, no telemetry

The app makes no network calls except to Dropbox when you sign in. No Google Analytics, no Sentry, no Plausible, no nothing. The only outbound request after page load is the Workbox runtime cache checking for `/sw.js` updates.

### Why not SvelteKit?

MindNote is a client-side SPA. The whole app loads once, after which navigation is instant. A SvelteKit-style server runtime would add deployment complexity (functions, edge runtime, build adapters) for no benefit on a static notes app. If you want SSR or multi-page routing, SvelteKit is the right call — but it would change the architecture materially, not just the build command.

### Why Tailwind + custom CSS?

Tailwind handles utilities (spacing, flex, grid). A single 1,015-line `app.css` handles design tokens (`--bg-color`, `--primary-color`, `--card-bg`, ...) and 11 theme variants. This avoids the runtime cost of CSS-in-JS and keeps the theme switching logic in one place.

### Why hash routing?

Hash routing (`/#/note/1`) means the app works on any static host with zero server config. You don't need a `_redirects` file for Netlify, no Vercel rewrites, no nginx try_files. The URL after the `#` is never sent to the server.

---

## Performance notes

### Bundle sizes (gzipped, after Vite splitChunks)

- **Initial JS:** ~69 KB (entry, runtime, store, router, Editor shell)
- **MarkdownPreview:** ~415 KB (lazy on first preview toggle)
- **Mermaid:** ~117 KB (lazy on first diagram)
- **Cytoscape / other diagrams:** ~80–140 KB each (lazy)
- **KaTeX CSS:** ~30 KB
- **highlight.js CSS:** ~3 KB (vs2015 theme)

### Measured chrome (live, 2026-06)

| Device | Viewport | Header | Toolbar | Total chrome | % of viewport |
|---|---|---|---|---|---|
| Pixel 5 | 393×851 | 39px | 43px | 82px | 9.6% |
| iPhone 12 | 390×844 | 39px | 43px | 82px | 9.7% |
| iPhone SE | 375×667 | 39px | 43px | 82px | 12.3% |
| Small Android | 360×800 | 39px | 43px | 82px | 11.1% |
| Tablet | 768×1024 | 80px (2-row) | 44px | 124px | 12.1% |
| Desktop | 1280×800 | 80px | 44px | 124px | 15.5% |

### Editor responsiveness

- **Autosave debounce:** 500ms after last keystroke
- **Preview render:** debounced 200ms during typing, immediate on idle
- **Search:** indexed Dexie query, <50ms for 10k notes
- **Virtual list:** 60fps scroll on 10k notes

### Service worker

- **Precache:** 61 entries, 3.8 MB total (app shell + assets + Google Fonts)
- **Cache strategy:** CacheFirst for Google Fonts (1 year TTL), NetworkFirst with fallback for app shell
- **Maximum file size:** 5 MB (raised from default 2 MB to accommodate Mermaid's 4.3 MB WASM blob)

---

## Roadmap

- [ ] Multi-cursor / collaboration (CRDT via Yjs)
- [ ] Note templates (daily journal, meeting notes, etc.)
- [ ] Tag system (in addition to pinned)
- [ ] Note linking graph visualization
- [ ] Web Clipper browser extension
- [ ] iOS native app (Capacitor)
- [ ] End-to-end encrypted sync (zero-knowledge backup)
- [ ] AI-assisted features (summarize, ask, autocomplete) — opt-in, local model preferred
- [ ] Plugin system (custom renderers, exporters)

Have an idea? Open an issue.

---

## Contributing

This is a personal project. Bug reports and small PRs are welcome. For large changes, open an issue first to discuss.

```bash
# Fork, then:
git clone https://github.com/<you>/mindnote
cd mindnote
pnpm install
pnpm dev
# Make changes
pnpm check
pnpm build   # verify production build still works
```

---

## License

Personal project. No license declared. Treat it as "all rights reserved" until a `LICENSE` file is added.

---

## Credits

Built with:

- [Svelte](https://svelte.dev) — UI framework
- [Vite](https://vitejs.dev) — build tool
- [Dexie](https://dexie.org) — IndexedDB wrapper
- [marked](https://marked.js.org) — Markdown parser
- [Mermaid](https://mermaid.js.org) — diagrams
- [KaTeX](https://katex.org) — math
- [highlight.js](https://highlightjs.org) — syntax highlighting
- [DOMPurify](https://github.com/cure53/DOMPurify) — XSS sanitizer
- [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app) — PWA generator
- [Tailwind CSS](https://tailwindcss.com) — utility CSS
- [Workbox](https://developer.chrome.com/docs/workbox) — service worker toolkit
