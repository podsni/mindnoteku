<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import Editor from './lib/Editor.svelte'
  import Home from './lib/Home.svelte'
  import OfflineIndicator from './lib/OfflineIndicator.svelte'
  import { notesStore, uiStore } from './lib/store.svelte'
  import { router } from './lib/router'
  import { initTouchHandlers } from './lib/touchHandler.svelte'
  import { registerSW } from 'virtual:pwa-register'
  import Icon from './lib/Icons.svelte'

  let currentRoute = $state<{ path: string; params: Record<string, string> }>({ path: '/', params: {} })

  router.subscribe(route => {
    currentRoute = route
  })

  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      uiStore.toggleSidebar()
    }
  }

  const handleBackdropClick = () => {
    if (uiStore.isMobile) uiStore.closeSidebar()
  }

  const checkMobile = () => {
    uiStore.setMobile(window.innerWidth < 768)
  }

  onMount(() => {
    notesStore.loadNotes()
    checkMobile()
    uiStore.loadTheme()
    uiStore.loadFont()
    uiStore.loadFontSize()

    window.addEventListener('resize', checkMobile)
    window.addEventListener('keydown', handleKeydown)

    const cleanupTouch = initTouchHandlers()

    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New version available. Reload to update?')) {
          updateSW(true)
        }
      },
      onOfflineReady() {
        console.log('App is ready to work offline')
      },
    })

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', handleKeydown)
      cleanupTouch()
    }
  })
</script>

<div class="app" class:sidebar-open={uiStore.sidebarOpen && !uiStore.isMobile}>
  <Sidebar />

  <button
    class="sidebar-toggle"
    class:sidebar-open={uiStore.sidebarOpen && !uiStore.isMobile}
    onclick={() => uiStore.toggleSidebar()}
    aria-label={uiStore.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    aria-expanded={uiStore.sidebarOpen}
    title={uiStore.sidebarOpen ? 'Close sidebar (⌘B)' : 'Open sidebar (⌘B)'}
  >
    <Icon name={uiStore.sidebarOpen ? 'close' : 'menu'} size={18} strokeWidth={2} />
  </button>

  {#if uiStore.sidebarOpen && uiStore.isMobile}
    <div
      class="backdrop"
      onclick={handleBackdropClick}
      onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
      role="button"
      tabindex="-1"
      aria-label="Close sidebar"
    ></div>
  {/if}

  <main class="main-content">
    {#if currentRoute.path === '/'}
      <Home />
    {:else if currentRoute.path === '/note/:id' && currentRoute.params.id}
      <Editor id={currentRoute.params.id} />
    {:else}
      <Home />
    {/if}
  </main>

  <OfflineIndicator />

  {#if uiStore.isMobile}
    <button
      class="fab"
      onclick={async () => {
        const id = await notesStore.createNote('Untitled', '')
        router.navigate(`/note/${id}`)
      }}
      aria-label="Create new note"
    >
      <Icon name="plus" size={24} strokeWidth={2.25} />
    </button>
  {/if}
</div>

<style>
  .app {
    display: flex;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: var(--bg-color);
    color: var(--text-color);
    position: relative;
    transition: background-color var(--motion-base), color var(--motion-base);
  }

  /* Use grid-template-columns on desktop so the sidebar takes layout space
     without animating layout properties. Width animates on the
     `grid-template-columns` shorthand which the browser can promote to
     compositor-only on Chromium/Firefox. */
  @media (min-width: 1025px) {
    .app {
      --app-sidebar-col: 0fr;
      --app-main-col: 1fr;
      display: grid;
      grid-template-columns:
        var(--app-sidebar-col)
        var(--app-main-col);
      transition:
        grid-template-columns var(--motion-base) var(--ease-out),
        background-color var(--motion-base),
        color var(--motion-base);
    }
    .app.sidebar-open {
      --app-sidebar-col: var(--sidebar-width);
      --app-main-col: 1fr;
    }
  }

  .main-content {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow: hidden;
  }

  /* On desktop, the .app becomes a grid container; the sidebar <aside> is
     a direct grid child and the .main-content is the second column.
     Reset the flex layout so the grid layout works. */
  @media (min-width: 1025px) {
    .main-content {
      flex: 0 0 auto;
    }
  }

  /* Mobile / tablet: sidebar overlays, main content stays full-bleed */
  @media (max-width: 1024px) {
    .main-content {
      margin-left: 0 !important;
    }
  }

  /* Sidebar toggle */
  .sidebar-toggle {
    position: fixed;
    top: var(--space-3);
    left: var(--space-3);
    z-index: 40;
    width: 40px;
    height: 40px;
    padding: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-color);
    display: grid;
    place-items: center;
    cursor: pointer;
    /* Compose translate + scale via custom property so both states coexist. */
    --toggle-x: 0;
    --toggle-s: 1;
    transform: translateX(var(--toggle-x)) scale(var(--toggle-s));
    transition:
      background var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out),
      transform var(--motion-base) var(--ease-out);
  }

  /* On desktop, slide the toggle out of the way when sidebar is open */
  @media (min-width: 1025px) {
    .sidebar-toggle.sidebar-open {
      --toggle-x: calc(var(--sidebar-width) - var(--space-3));
    }
  }

  .sidebar-toggle:hover {
    background: var(--hover-bg);
    color: var(--primary-color);
  }

  .sidebar-toggle:active {
    --toggle-s: 0.95;
  }

  /* On mobile, push the toggle a bit further so it doesn't hug the screen edge */
  @media (max-width: 600px) {
    .sidebar-toggle {
      top: max(var(--space-3), env(safe-area-inset-top, 0));
      left: max(var(--space-3), env(safe-area-inset-left, 0));
    }
  }

  /* Backdrop for mobile */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 999;
    animation: fadeIn var(--motion-base) var(--ease-out);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Floating Action Button — quiet primary, no shadow stack, no scale */
  .fab {
    position: fixed;
    right: calc(var(--space-4) + env(safe-area-inset-right, 0));
    bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0));
    min-width: 48px;
    min-height: 48px;
    height: 48px;
    padding: 0 var(--space-4);
    border-radius: var(--radius-pill);
    background: var(--primary-color);
    color: #fff;
    border: 1px solid var(--primary-color);
    cursor: pointer;
    z-index: 998;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: inherit;
    font-size: var(--font-size-base);
    font-weight: 500;
    transition: background var(--motion-fast) var(--ease-out);
  }

  .fab::after {
    content: 'New';
    margin-left: 2px;
  }

  .fab:hover {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .fab:active {
    opacity: 0.85;
  }

  /* Hide the visible "New" label on very small screens; icon alone is fine. */
  @media (max-width: 360px) {
    .fab {
      width: 48px;
      padding: 0;
    }
    .fab::after {
      content: '';
    }
  }

  :global(.app.theme-changing) {
    animation: themeTransition 0.4s ease;
  }

  @keyframes themeTransition {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
</style>
