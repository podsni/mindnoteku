import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'MindNote - Focus Writing App',
        short_name: 'MindNote',
        description: 'Fast, offline-first notes application for focused writing',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Increase maximum file size to cache (default is 2MB, increase to 5MB for Mermaid)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep main bundle lean: heavy/optional subsystems go to their
        // own chunks. The shell + note list + editor + theme load eagerly;
        // markdown preview, mermaid, dropbox sync, image processing,
        // and outline load lazily via dynamic import.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('mermaid')) return 'mermaid'
          if (id.includes('cytoscape')) return 'cytoscape'
          if (id.includes('katex') || id.includes('mathjax') || id.includes('mathjs')) {
            return 'math'
          }
          if (id.includes('idb') || id.includes('fake-indexeddb')) {
            return 'storage'
          }
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
