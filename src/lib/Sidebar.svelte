<script lang="ts">
  import { onDestroy } from 'svelte'
  import { notesStore, uiStore } from './store.svelte'
  import { router } from './router'
  import VirtualList from 'svelte-virtual-list'
  import Settings from './Settings.svelte'
  import Icon from './Icons.svelte'

  let searchInput = $state('')
  let touchStartX = $state(0)
  let touchCurrentX = $state(0)
  let isDragging = $state(false)
  let listContainer: HTMLDivElement | undefined = $state()
  let scrollFrame = 0

  const VIRTUAL_ITEM_HEIGHT = 96

  const handleSearch = (e: Event) => {
    const target = e.target as HTMLInputElement
    searchInput = target.value
    notesStore.search(searchInput)
  }

  const handleNewNote = async () => {
    const id = await notesStore.createNote('Untitled', '')
    router.navigate(`/note/${id}`)
    if (uiStore.isMobile) uiStore.closeSidebar()
  }

  const handleNoteClick = () => {
    if (uiStore.isMobile) uiStore.closeSidebar()
  }

  const handleDeleteNote = async (e: Event, noteId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Delete this note? This cannot be undone.')) {
      await notesStore.deleteNote(noteId)
    }
  }

  const handleTogglePin = async (e: Event, noteId: number) => {
    e.preventDefault()
    e.stopPropagation()
    await notesStore.togglePin(noteId)
  }

  const handleExport = async () => {
    await notesStore.exportNotes()
  }

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      try {
        const count = await notesStore.importNotesFromFile(file)
        alert(`Imported ${count} notes.`)
      } catch (error) {
        alert('Import failed. Check the file format.')
      }
      input.value = ''
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    if (scrollFrame) cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = target
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        void notesStore.loadMoreNotes()
      }
      scrollFrame = 0
    })
  }

  onDestroy(() => {
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }
  })

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'SELECT' ||
      target.closest('input') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('.settings-container') ||
      target.closest('.toolbar') ||
      target.closest('.search-box')
    ) {
      isDragging = false
      return
    }
    touchStartX = e.touches[0].clientX
    touchCurrentX = e.touches[0].clientX
    isDragging = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    touchCurrentX = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    const diff = touchCurrentX - touchStartX
    if (diff < -80 && uiStore.isMobile) uiStore.closeSidebar()
    isDragging = false
    touchStartX = 0
    touchCurrentX = 0
  }
</script>

<aside
  class="sidebar"
  class:open={uiStore.sidebarOpen}
  class:dragging={isDragging}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  aria-label="Notes navigation"
>
  <header class="sidebar-header">
    <a href="#/" class="brand" aria-label="MindNote home">
      <span class="brand-mark" aria-hidden="true">
        <Icon name="note" size={20} strokeWidth={1.5} />
      </span>
      <span class="brand-name">MindNote</span>
    </a>
    <button class="btn-primary" onclick={handleNewNote} title="New note">
      <Icon name="plus" size={16} strokeWidth={2} />
      <span class="btn-label">New</span>
    </button>
  </header>

  <div class="toolbar">
    <button class="btn-tool" onclick={handleExport} title="Export all notes as JSON">
      <Icon name="export" size={15} strokeWidth={1.75} />
      <span>Export</span>
    </button>
    <label class="btn-tool" title="Import notes from JSON">
      <Icon name="import" size={15} strokeWidth={1.75} />
      <span>Import</span>
      <input type="file" accept="application/json" onchange={handleImport} class="visually-hidden" />
    </label>
  </div>

  <Settings />

  <div class="search-box">
    <span class="search-icon" aria-hidden="true">
      <Icon name="search" size={16} strokeWidth={1.75} />
    </span>
    <input
      type="search"
      placeholder="Search notes…"
      value={searchInput}
      oninput={handleSearch}
      aria-label="Search notes"
    />
  </div>

  <div class="notes-list" bind:this={listContainer} onscroll={handleScroll}>
    {#if notesStore.isLoading && notesStore.notes.length === 0}
      <div class="state" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading notes…</p>
      </div>
    {:else if notesStore.notes.length === 0}
      <div class="state">
        <p class="state-title">No notes yet</p>
        <p class="state-hint">Create your first note to get started.</p>
      </div>
    {:else if notesStore.notes.length > 50}
      <VirtualList items={notesStore.notes} let:item height="calc(100% - 0px)" itemHeight={VIRTUAL_ITEM_HEIGHT}>
        {#if item.id}
          <a href="#/note/{item.id}" class="note-item" class:pinned={item.pinned} onclick={handleNoteClick}>
            <div class="note-content">
              <div class="note-header">
                <div class="note-title">
                  {#if item.pinned}
                    <span class="pin-icon" aria-label="Pinned">
                      <Icon name="pinned" size={13} strokeWidth={0} />
                    </span>
                  {/if}
                  <span class="title-text">{item.title || 'Untitled'}</span>
                </div>
                <span class="word-count" title="{item.wordCount} words, {item.charCount} characters">
                  {item.wordCount}w
                </span>
              </div>
              <div class="note-preview">{item.preview}</div>
              <div class="note-date">{formatDate(item.updatedAt)}</div>
            </div>
            <div class="note-actions">
              <button class="icon-btn" onclick={(e) => handleTogglePin(e, item.id!)} aria-label={item.pinned ? 'Unpin note' : 'Pin note'} title={item.pinned ? 'Unpin' : 'Pin'}>
                <Icon name={item.pinned ? 'pinned' : 'pin'} size={15} strokeWidth={item.pinned ? 0 : 1.75} />
              </button>
              <button class="icon-btn icon-btn-danger" onclick={(e) => handleDeleteNote(e, item.id!)} aria-label="Delete note" title="Delete">
                <Icon name="trash" size={15} strokeWidth={1.75} />
              </button>
            </div>
          </a>
        {/if}
      </VirtualList>
    {:else}
      {#each notesStore.notes as note (note.id)}
        {#if note.id}
          <a href="#/note/{note.id}" class="note-item" class:pinned={note.pinned} onclick={handleNoteClick}>
            <div class="note-content">
              <div class="note-header">
                <div class="note-title">
                  {#if note.pinned}
                    <span class="pin-icon" aria-label="Pinned">
                      <Icon name="pinned" size={13} strokeWidth={0} />
                    </span>
                  {/if}
                  <span class="title-text">{note.title || 'Untitled'}</span>
                </div>
                <span class="word-count" title="{note.wordCount} words, {note.charCount} characters">
                  {note.wordCount}w
                </span>
              </div>
              <div class="note-preview">{note.preview}</div>
              <div class="note-date">{formatDate(note.updatedAt)}</div>
            </div>
            <div class="note-actions">
              <button class="icon-btn" onclick={(e) => handleTogglePin(e, note.id!)} aria-label={note.pinned ? 'Unpin note' : 'Pin note'} title={note.pinned ? 'Unpin' : 'Pin'}>
                <Icon name={note.pinned ? 'pinned' : 'pin'} size={15} strokeWidth={note.pinned ? 0 : 1.75} />
              </button>
              <button class="icon-btn icon-btn-danger" onclick={(e) => handleDeleteNote(e, note.id!)} aria-label="Delete note" title="Delete">
                <Icon name="trash" size={15} strokeWidth={1.75} />
              </button>
            </div>
          </a>
        {/if}
      {/each}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    height: 100%;
    background: var(--bg-color);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform var(--motion-base) var(--ease-out), background-color var(--motion-base);
    position: relative;
    touch-action: pan-y;
  }

  .sidebar.dragging {
    transition: none;
    user-select: none;
  }

  /* Desktop: collapsible drawer (uses translate so main content can flow) */
  @media (min-width: 1025px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 30;
      transform: translateX(0);
    }
    .sidebar:not(.open) {
      transform: translateX(-100%);
    }
  }

  /* Tablet & Mobile: overlay drawer */
  @media (max-width: 1024px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transform: translateX(-100%);
      box-shadow: var(--shadow-lg);
    }
    .sidebar.open {
      transform: translateX(0);
    }
  }

  @media (max-width: 600px) {
    .sidebar {
      width: min(85%, 320px);
    }
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-color);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-color);
    text-decoration: none;
    font-weight: 600;
    font-size: var(--font-size-lg);
    letter-spacing: -0.01em;
    min-height: 36px;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    background: var(--card-bg);
    color: var(--primary-color);
    border: 1px solid var(--border-color);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    height: 36px;
    background: var(--primary-color);
    color: #fff;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out);
  }

  .btn-primary:hover {
    background: var(--primary-hover);
  }

  .btn-primary:active {
    transform: scale(0.97);
  }

  @media (max-width: 380px) {
    .btn-label {
      display: none;
    }
    .btn-primary {
      width: 36px;
      padding: 0;
      justify-content: center;
    }
  }

  .toolbar {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-color);
  }

  .btn-tool {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 36px;
    padding: 0 var(--space-3);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out);
  }

  .btn-tool:hover {
    background: var(--hover-bg);
    border-color: var(--primary-color);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-box {
    position: relative;
    padding: var(--space-3) var(--space-4);
  }

  .search-icon {
    position: absolute;
    left: calc(var(--space-4) + 10px);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    height: 40px;
    padding: 0 var(--space-3) 0 calc(var(--space-3) + 24px);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-color);
    font-size: var(--font-size-base);
    font-family: inherit;
    transition: border-color var(--motion-fast) var(--ease-out), background var(--motion-fast);
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--bg-color);
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-2) var(--space-2);
  }

  .state {
    text-align: center;
    padding: var(--space-8) var(--space-4);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .state-title {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--text-color);
  }

  .state-hint {
    margin: 0;
    font-size: var(--font-size-sm);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  :global(.note-item) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3);
    margin-bottom: var(--space-1);
    background: var(--card-bg);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: background var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out);
  }

  :global(.note-item:hover) {
    background: var(--hover-bg);
  }

  :global(.note-item:focus-visible) {
    border-color: var(--primary-color);
  }

  :global(.note-item.pinned) {
    background: var(--pinned-bg);
  }

  .note-content {
    flex: 1;
    min-width: 0;
  }

  .note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: 2px;
  }

  .note-title {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: var(--font-size-base);
    color: var(--text-color);
  }

  .title-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pin-icon {
    color: var(--primary-color);
    display: inline-flex;
    flex-shrink: 0;
  }

  .word-count {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    opacity: 0.75;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .note-preview {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.45;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .note-date {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    opacity: 0.75;
  }

  .note-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-out);
  }

  :global(.note-item:hover) .note-actions,
  :global(.note-item:focus-within) .note-actions {
    opacity: 1;
  }

  .icon-btn {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    min-height: 30px;
    transition: background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }

  .icon-btn:hover {
    background: var(--hover-bg);
    color: var(--text-color);
  }

  .icon-btn-danger:hover {
    background: rgba(220, 38, 38, 0.12);
    color: rgb(220, 38, 38);
  }

  /* Always show actions on touch */
  @media (hover: none) {
    .note-actions {
      opacity: 1;
    }
  }
</style>
