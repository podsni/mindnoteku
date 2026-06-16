<script lang="ts">
  import { notesStore, uiStore } from './store.svelte'
  import { router } from './router'

  const handleNewNote = async () => {
    const id = await notesStore.createNote('Untitled', '')
    router.navigate(`/note/${id}`)
    if (uiStore.isMobile) uiStore.closeSidebar()
  }
</script>

<div class="home">
  <div class="hero">
    <h1 class="title">A quiet place to write</h1>
    <p class="subtitle">
      Your notes live on this device. No account, no cloud lock-in. Open a new
      note, search anything you've written, or come back to where you left off.
    </p>

    <div class="actions">
      <button class="btn" onclick={handleNewNote}>New note</button>
      <a class="link" href="#/" aria-label="Browse existing notes">or browse</a>
    </div>
  </div>
</div>

<style>
  .home {
    flex: 1;
    height: 100%;
    display: grid;
    place-items: center;
    padding: var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    background: var(--bg-color);
  }

  .hero {
    width: 100%;
    max-width: 32rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .title {
    font-size: var(--font-size-3xl);
    font-weight: 500;
    line-height: 1.15;
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--text-color);
    text-wrap: balance;
  }

  .subtitle {
    font-size: var(--font-size-base);
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
    max-width: 36rem;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-top: var(--space-2);
  }

  .btn {
    appearance: none;
    border: 1px solid var(--primary-color);
    background: var(--primary-color);
    color: #fff;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: var(--font-size-base);
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    min-height: 40px;
    transition:
      background var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out);
  }

  .btn:hover {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .btn:active {
    transform: translateY(1px);
  }

  .link {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--font-size-base);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    border: 1px solid transparent;
  }

  .link:hover {
    color: var(--text-color);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 600px) {
    .title {
      font-size: var(--font-size-2xl);
    }
  }
</style>
