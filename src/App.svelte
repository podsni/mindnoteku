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

  function getToggleIcon(): 'menu' | 'close' {
    return uiStore.sidebarOpen ? 'close' : 'menu'
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

<div class="app" class:sidebar-open={uiStore.sidebarOpen}>
  <Sidebar />

  <button
    class="sidebar-toggle"
    class:sidebar-open={uiStore.sidebarOpen}
    onclick={() => uiStore.toggleSidebar()}
    aria-label={uiStore.sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    aria-expanded={uiStore.sidebarOpen}
    title={uiStore.sidebarOpen ? 'Close sidebar (⌘B)' : 'Open sidebar (⌘B)'}
  >
    <Icon name={getToggleIcon()} size={16} strokeWidth={2} />
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

  {#if uiStore.isMobile && currentRoute.path === '/'}
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

  /* On desktop the sidebar is fixed-positioned and slides via its own
     transform animation (see Sidebar.svelte). It is therefore OUT of
     normal flow, so .main-content must fill the full width of .app.
     We deliberately do NOT use CSS grid here: putting a fixed-position
     element into a grid cell makes the auto-placed siblings jump to a
     new row, which would collapse the main column to zero. Flex + a
     flex:1 main child is the correct, simple layout. */
  .main-content {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    display: flex;
    overflow: hidden;
    /* On desktop, the open sidebar overlays the page from the left.
       Keep the main content clear of the sidebar width + a gutter. */
  }

  @media (min-width: 1025px) {
    .app.sidebar-open .main-content {
      padding-left: var(--sidebar-width);
      transition: padding-left var(--motion-base) var(--ease-out);
    }
    .app:not(.sidebar-open) .main-content {
      padding-left: 0;
      transition: padding-left var(--motion-base) var(--ease-out);
    }
  }

  /* Sidebar toggle — quiet icon button that floats above the page.
     On desktop it nudges to the right of the open sidebar so it doesn't
     overlap the brand mark. On mobile it stays in the top-left corner
     and respects the safe-area inset. Sized to be visually quiet (32px)
     so the title and action buttons own the user's attention; a soft
     hover background appears on tap without competing for chrome. */
  .sidebar-toggle {
    position: fixed;
    top: var(--space-2);
    left: var(--space-2);
    z-index: 40;
    width: 32px;
    height: 32px;
    min-height: 0; /* override the mobile `button { min-height: 44px }`
                      rule that would otherwise double the size on
                      phones and push the toggle into the title row */
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
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
      border-color var(--motion-fast) var(--ease-out),
      transform var(--motion-base) var(--ease-out);
  }

  /* On desktop, slide the toggle out of the way when sidebar is open.
     Match the sidebar's own width + its own translateX animation. */
  @media (min-width: 1025px) {
    .sidebar-toggle.sidebar-open {
      --toggle-x: var(--sidebar-width);
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

  /* When the sidebar is open on mobile, lift the toggle above the
     backdrop so the user can tap it to close the drawer. Backdrop is
     999, sidebar is 1000, so we sit at 1001 — just above the sidebar
     so the toggle remains visible at the top-left corner of the page. */
  @media (max-width: 1024px) {
    .app.sidebar-open .sidebar-toggle {
      z-index: 1001;
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
