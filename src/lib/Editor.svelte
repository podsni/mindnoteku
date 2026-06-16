<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Component } from 'svelte'
  import { notesStore } from './store.svelte'
  import { router } from './router'
  import { noteService, type NoteMetadata } from './db'
  import EditorToolbar from './EditorToolbar.svelte'
  import * as imageHandler from './ImageHandler.svelte'
  import * as commands from './editorCommands'
  import Icon from './Icons.svelte'

  interface Props {
    id: string
  }

  let { id }: Props = $props()

  let titleInput: HTMLInputElement | undefined = $state()
  let contentTextarea: HTMLTextAreaElement | undefined = $state()
  let previewMode = $state(false)
  let splitView = $state(false)
  let backlinks = $state<NoteMetadata[]>([])
  let isDragging = $state(false)
  let showOutline = $state(false)

  // Toolbar visibility — persisted across sessions, defaults to true.
  // Read from localStorage on mount; write on every toggle.
  const TOOLBAR_KEY = 'mindnote-show-toolbar'
  function readToolbarPref(): boolean {
    if (typeof localStorage === 'undefined') return true
    const v = localStorage.getItem(TOOLBAR_KEY)
    return v === null ? true : v === 'true'
  }
  let showToolbar = $state(true)

  // Lazy-loaded components (mermaid, markdown rendering, outline). Keeps
  // the initial route bundle small — the editor mounts empty chrome first
  // and these arrive on demand when the user enables them.
  let MarkdownPreviewComp: Component<any> | null = $state(null)
  let OutlineViewComp: Component<any> | null = $state(null)
  let MermaidViewerComp: Component<any> | null = $state(null)

  $effect(() => {
    if ((previewMode || splitView) && !MarkdownPreviewComp) {
      import('./MarkdownPreview.svelte').then((m) => {
        MarkdownPreviewComp = m.default
      })
    }
  })
  $effect(() => {
    if (showOutline && !OutlineViewComp) {
      import('./OutlineView.svelte').then((m) => {
        OutlineViewComp = m.default
      })
    }
  })

  // Local content for instant preview update (no debounce delay)
  let localContent = $state('')
  
  // Scroll sync for split view
  let previewPane: HTMLDivElement | undefined = $state()
  let isScrollingSynced = $state(false) // Prevent infinite loop
  let scrollSyncTimeout: number | null = null
  
  // Load note when component mounts or ID changes
  $effect(() => {
    const noteId = parseInt(id)
    if (!isNaN(noteId)) {
      notesStore.loadNote(noteId)
      // Load backlinks
      loadBacklinks(noteId)
    }
  })
  
  // Sync localContent with store content
  $effect(() => {
    if (notesStore.currentNote) {
      localContent = notesStore.currentNote.content
    }
  })

  // Load backlinks from database
  const loadBacklinks = async (noteId: number) => {
    backlinks = await noteService.getBacklinks(noteId)
  }

  const countWords = (text: string) => text.split(/\s+/).filter((word) => word.length > 0).length

  const handleTitleChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const noteId = parseInt(id)
    if (!isNaN(noteId)) {
      notesStore.updateNote(noteId, { title: target.value })
    }
  }

  const handleContentChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement
    const noteId = parseInt(id)
    
    // Update local content instantly for real-time preview
    localContent = target.value
    
    // Update store (will debounce save to DB)
    if (!isNaN(noteId)) {
      notesStore.updateNote(noteId, { content: target.value })
    }

  }

  // Update content from commands
  const updateContent = (newContent: string) => {
    const noteId = parseInt(id)
    
    // Update local content instantly for real-time preview
    localContent = newContent
    
    // Update store (will debounce save to DB)
    if (!isNaN(noteId)) {
      notesStore.updateNote(noteId, { content: newContent })
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this note?')) {
      const noteId = parseInt(id)
      if (!isNaN(noteId)) {
        await notesStore.deleteNote(noteId)
        router.navigate('/')
      }
    }
  }

  const handleTogglePin = async () => {
    const noteId = parseInt(id)
    if (!isNaN(noteId)) {
      await notesStore.togglePin(noteId)
    }
  }

  const handleNewNote = async () => {
    const newId = await notesStore.createNote('New Note', '')
    router.navigate(`/note/${newId}`)
  }

  const togglePreview = () => {
    previewMode = !previewMode
    if (previewMode) {
      splitView = false // Disable split view when entering full preview
    }
  }

  const toggleSplitView = () => {
    splitView = !splitView
    if (splitView) {
      previewMode = false // Disable full preview when entering split view
    }
  }

  const toggleOutline = () => {
    showOutline = !showOutline
  }

  const toggleToolbar = () => {
    showToolbar = !showToolbar
    try { localStorage.setItem(TOOLBAR_KEY, String(showToolbar)) } catch {}
  }

  // Toolbar action handlers
  const handleBold = () => {
    if (!contentTextarea) return
    const newContent = commands.toggleWrap(contentTextarea, '**')
    updateContent(newContent)
  }

  const handleItalic = () => {
    if (!contentTextarea) return
    const newContent = commands.toggleWrap(contentTextarea, '*')
    updateContent(newContent)
  }

  const handleStrikethrough = () => {
    if (!contentTextarea) return
    const newContent = commands.toggleWrap(contentTextarea, '~~')
    updateContent(newContent)
  }

  const handleCode = () => {
    if (!contentTextarea) return
    const newContent = commands.toggleWrap(contentTextarea, '`')
    updateContent(newContent)
  }

  const handleLink = () => {
    if (!contentTextarea) return
    const url = prompt('Enter URL:')
    if (url) {
      const newContent = commands.insertLink(contentTextarea, url)
      updateContent(newContent)
    }
  }

  const handleImage = () => {
    if (!contentTextarea) return
    const url = prompt('Enter image URL (or paste image directly):')
    if (url) {
      // Check if it's a URL or try to fetch it
      imageHandler.urlToBase64(url).then(base64 => {
        const newContent = commands.insertImage(contentTextarea!, base64)
        updateContent(newContent)
      })
    }
  }

  const handleHeading = (level: number) => {
    if (!contentTextarea) return
    const newContent = commands.insertHeading(contentTextarea, level)
    updateContent(newContent)
  }

  const handleList = (ordered: boolean) => {
    if (!contentTextarea) return
    const newContent = commands.insertListItem(contentTextarea, ordered)
    updateContent(newContent)
  }

  const handleCheckbox = () => {
    if (!contentTextarea) return
    const newContent = commands.insertTaskItem(contentTextarea)
    updateContent(newContent)
  }

  const handleTable = () => {
    if (!contentTextarea) return
    const newContent = commands.insertTable(contentTextarea, 3, 3)
    updateContent(newContent)
  }

  // Scroll to header from outline
  const handleHeaderClick = (headerId: string) => {
    if (!contentTextarea) return
    
    // Find the header in content
    const lines = contentTextarea.value.split('\n')
    let lineNumber = 0
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const text = match[2].trim()
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
        
        if (id === headerId) {
          lineNumber = i
          break
        }
      }
    }
    
    // Scroll to line
    const lineHeight = 24 // Approximate line height
    contentTextarea.scrollTop = lineNumber * lineHeight
    contentTextarea.focus()
  }

  // Scroll synchronization between editor and preview (real-time)
  const handleEditorScroll = (e: Event) => {
    if (!splitView || !contentTextarea || !previewPane || isScrollingSynced) return
    
    const target = e.target as HTMLElement
    const maxScroll = target.scrollHeight - target.clientHeight
    
    // Prevent division by zero
    if (maxScroll <= 0) return
    
    const scrollPercentage = target.scrollTop / maxScroll
    
    // Use requestAnimationFrame for smooth sync
    isScrollingSynced = true
    requestAnimationFrame(() => {
      if (previewPane) {
        const previewMaxScroll = previewPane.scrollHeight - previewPane.clientHeight
        previewPane.scrollTop = scrollPercentage * previewMaxScroll
      }
      // Reset flag after a short delay
      setTimeout(() => { isScrollingSynced = false }, 10)
    })
  }

  const handlePreviewScroll = (e: Event) => {
    if (!splitView || !contentTextarea || !previewPane || isScrollingSynced) return
    
    const target = e.target as HTMLElement
    const maxScroll = target.scrollHeight - target.clientHeight
    
    // Prevent division by zero
    if (maxScroll <= 0) return
    
    const scrollPercentage = target.scrollTop / maxScroll
    
    // Use requestAnimationFrame for smooth sync
    isScrollingSynced = true
    requestAnimationFrame(() => {
      if (contentTextarea) {
        const textareaMaxScroll = contentTextarea.scrollHeight - contentTextarea.clientHeight
        contentTextarea.scrollTop = scrollPercentage * textareaMaxScroll
      }
      // Reset flag after a short delay
      setTimeout(() => { isScrollingSynced = false }, 10)
    })
  }

  // Cleanup on destroy
  onDestroy(() => {
    if (scrollSyncTimeout) cancelAnimationFrame(scrollSyncTimeout)
  })

  // Handle drag and drop
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isDragging = false
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    isDragging = false

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    if (!contentTextarea) return

    // Use new image handler
    const imageMarkdowns = await imageHandler.handleImageDrop(files)
    
    for (const imageMarkdown of imageMarkdowns) {
      const newContent = imageHandler.insertImageAtCursor(contentTextarea, imageMarkdown)
      updateContent(newContent)
    }
  }

  // Handle paste event for images and URLs
  const handlePaste = async (e: ClipboardEvent) => {
    if (!contentTextarea) return

    const imageMarkdown = await imageHandler.handleImagePaste(e)
    if (imageMarkdown) {
      e.preventDefault()
      const newContent = imageHandler.insertImageAtCursor(contentTextarea, imageMarkdown)
      updateContent(newContent)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!contentTextarea) return

    const ctrl = e.ctrlKey || e.metaKey
    
    // Tab for list indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const newContent = commands.handleTab(contentTextarea, e.shiftKey)
      updateContent(newContent)
      return
    }

    // Ctrl+B for bold
    if (ctrl && e.key === 'b') {
      e.preventDefault()
      const newContent = commands.toggleWrap(contentTextarea, '**')
      updateContent(newContent)
      return
    }

    // Ctrl+I for italic
    if (ctrl && e.key === 'i') {
      e.preventDefault()
      const newContent = commands.toggleWrap(contentTextarea, '*')
      updateContent(newContent)
      return
    }

    // Ctrl+Shift+X for strikethrough
    if (ctrl && e.shiftKey && e.key === 'X') {
      e.preventDefault()
      const newContent = commands.toggleWrap(contentTextarea, '~~')
      updateContent(newContent)
      return
    }

    // Ctrl+` for inline code
    if (ctrl && e.key === '`') {
      e.preventDefault()
      const newContent = commands.toggleWrap(contentTextarea, '`')
      updateContent(newContent)
      return
    }

    // Ctrl+K for link
    if (ctrl && e.key === 'k') {
      e.preventDefault()
      const url = prompt('Enter URL:')
      if (url) {
        const newContent = commands.insertLink(contentTextarea, url)
        updateContent(newContent)
      }
      return
    }
  }

  // Focus title on mount and read toolbar preference
  onMount(() => {
    showToolbar = readToolbarPref()
    titleInput?.focus()
  })

  // Cleanup on unmount
  onDestroy(() => {
    notesStore.clearCurrentNote()
  })
</script>

<div class="editor">
  {#if notesStore.currentNote}
    <div class="editor-header">
      <div class="title-row">
        <input
          bind:this={titleInput}
          type="text"
          class="title-input editor-title"
          value={notesStore.currentNote.title}
          oninput={handleTitleChange}
          placeholder="Untitled"
        />
      </div>
      <div class="header-actions">
        <button
          onclick={toggleToolbar}
          class="btn-icon btn-toolbar-toggle"
          class:active={showToolbar}
          title={showToolbar ? 'Hide formatting toolbar' : 'Show formatting toolbar'}
          aria-pressed={showToolbar}
          aria-label={showToolbar ? 'Hide formatting toolbar' : 'Show formatting toolbar'}
        >
          <Icon name={showToolbar ? 'eye-off' : 'tool'} size={16} strokeWidth={1.75} />
          <span class="btn-label" aria-hidden="true">{showToolbar ? 'Hide tools' : 'Show tools'}</span>
        </button>
        <button
          onclick={toggleOutline}
          class="btn-icon btn-outline desktop-only"
          class:active={showOutline}
          title={showOutline ? 'Hide outline' : 'Show outline (TOC)'}
          aria-pressed={showOutline}
        >
          <Icon name="list" size={16} strokeWidth={1.75} />
          <span class="btn-label" aria-hidden="true">Outline</span>
        </button>
        <button
          onclick={toggleSplitView}
          class="btn-icon btn-split desktop-only"
          class:active={splitView}
          title={splitView ? 'Exit split view' : 'Split view'}
          aria-pressed={splitView}
        >
          <Icon name="columns" size={16} strokeWidth={1.75} />
          <span class="btn-label" aria-hidden="true">Split</span>
        </button>
        <button
          onclick={togglePreview}
          class="btn-icon btn-preview"
          class:active={previewMode}
          title={previewMode ? 'Edit mode' : 'Preview mode'}
          aria-pressed={previewMode}
        >
          <Icon name={previewMode ? 'edit' : 'eye'} size={16} strokeWidth={1.75} />
          <span class="btn-label" aria-hidden="true">{previewMode ? 'Edit' : 'Preview'}</span>
        </button>
        <button
          onclick={handleTogglePin}
          class="btn-icon btn-pin"
          class:pinned={notesStore.currentNote.pinned}
          title={notesStore.currentNote.pinned ? 'Unpin note' : 'Pin note'}
          aria-pressed={notesStore.currentNote.pinned}
        >
          <Icon name={notesStore.currentNote.pinned ? 'pinned' : 'pin'} size={16} strokeWidth={notesStore.currentNote.pinned ? 0 : 1.75} />
          <span class="btn-label" aria-hidden="true">{notesStore.currentNote.pinned ? 'Pinned' : 'Pin'}</span>
        </button>
        <button
          onclick={handleDelete}
          class="btn-icon btn-delete"
          title="Delete note"
          aria-label="Delete note"
        >
          <Icon name="trash" size={16} strokeWidth={1.75} />
          <span class="btn-label" aria-hidden="true">Delete</span>
        </button>
      </div>
    </div>

    <!-- Editor Toolbar -->
    {#if showToolbar && !previewMode}
      <EditorToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onStrikethrough={handleStrikethrough}
        onCode={handleCode}
        onLink={handleLink}
        onImage={handleImage}
        onHeading={handleHeading}
        onList={handleList}
        onCheckbox={handleCheckbox}
        onTable={handleTable}
      />
    {/if}

    
    <div 
      class="editor-content" 
      class:split-view={splitView}
      class:with-outline={showOutline}
      class:dragging={isDragging}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      role="application"
      aria-label="Note editor with drag and drop support"
    >
      {#if previewMode && MarkdownPreviewComp}
        <MarkdownPreviewComp content={localContent} mode="full" />
        {:else if splitView}
          <!-- Split view: editor on left, preview on right, outline on far right -->
          <div class="split-container">
            <div class="split-pane editor-pane">
              <textarea
                bind:this={contentTextarea}
                bind:value={localContent}
                class="content-textarea editor-text split-textarea"
                oninput={handleContentChange}
                onpaste={handlePaste}
                onkeydown={handleKeyDown}
                onscroll={handleEditorScroll}
                placeholder="Start writing..."
              ></textarea>
            </div>
            <div class="split-divider"></div>
            <div 
              class="split-pane preview-pane" 
              bind:this={previewPane}
              onscroll={handlePreviewScroll}
            >
              {#if MarkdownPreviewComp}
                <MarkdownPreviewComp content={localContent} mode="split" />
              {/if}
            </div>
            {#if showOutline && OutlineViewComp}
              <div class="split-divider"></div>
              <div class="split-pane outline-pane">
                <OutlineViewComp content={localContent} onHeaderClick={handleHeaderClick} />
              </div>
            {/if}
          </div>
        {:else}
          <div class="edit-container">
            <textarea
              bind:this={contentTextarea}
              bind:value={localContent}
              class="content-textarea editor-text"
              oninput={handleContentChange}
              onpaste={handlePaste}
              onkeydown={handleKeyDown}
              placeholder="Start writing..."
            ></textarea>
            {#if showOutline && OutlineViewComp}
              <div class="outline-sidebar">
                <OutlineViewComp content={localContent} onHeaderClick={handleHeaderClick} />
              </div>
            {/if}
          </div>
      {/if}
      
      <!-- Drag overlay -->
      {#if isDragging}
        <div class="drag-overlay">
          <div class="drag-message">
            Drop files here to embed
          </div>
        </div>
      {/if}
    </div>

    <div class="editor-footer">
      <div class="footer-left">
        <span class="word-count" title="Detailed statistics">
          {countWords(localContent)} words · 
          {localContent.length} characters · 
          {localContent.replace(/\s/g, '').length} chars (no spaces)
        </span>
        {#if backlinks.length > 0}
          <span class="backlinks-count" title="Notes linking to this note">
            {backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}
          </span>
        {/if}
      </div>
      <span class="last-updated">
        Last updated: {new Date(notesStore.currentNote.updatedAt).toLocaleString()}
      </span>
    </div>

    <!-- Backlinks section -->
    {#if backlinks.length > 0}
      <div class="backlinks-section">
        <h3>Linked from:</h3>
        <div class="backlinks-list">
          {#each backlinks as backlink}
            <a href="#/note/{backlink.id}" class="backlink-item">
              <span class="backlink-title">{backlink.title}</span>
              <span class="backlink-preview">{backlink.preview}</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="editor-empty">
      <div class="empty-icon">Note</div>
      <h2>No note selected</h2>
      <p>Select a note from the sidebar or create a new one</p>
    </div>
  {/if}

</div>

<style>
  .editor {
    flex: 1;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
    overflow: hidden;
    position: relative;
    transition: background-color 0.3s;
  }

  .editor-header {
    /* Two-row stack: title on top, actions below.
       On wide screens (>= 769px) it becomes a single row with the title
       taking the remaining space and actions on the right. */
    padding: 0.9rem 1.5rem;
    padding-left: 4rem; /* space for the floating sidebar toggle */
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    flex-shrink: 0;
    background: var(--bg-color);
  }

  .title-row {
    min-width: 0;
  }

  .header-actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: nowrap;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px; /* room for the focus ring on the last button */
  }
  .header-actions::-webkit-scrollbar { display: none; }

  .btn-icon {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background: transparent;
    border: 1px solid var(--border-color);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    opacity: 0.75;
    min-height: 34px;
    padding: 0 0.6rem;
    border-radius: var(--radius-sm);
    color: var(--text-color);
    white-space: nowrap;
    flex: 0 0 auto;
    transition:
      opacity var(--motion-fast) var(--ease-out),
      background var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }
  .btn-icon:hover { opacity: 1; }
  .btn-icon:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }

  .btn-icon.active,
  .btn-icon[aria-pressed='true'] {
    opacity: 1;
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  .btn-icon.btn-preview.active,
  .btn-icon.btn-preview[aria-pressed='true'] {
    background: var(--primary-color);
    color: #fff;
  }

  .btn-icon.btn-toolbar-toggle[aria-pressed='true'] {
    background: var(--card-bg);
    color: var(--primary-color);
  }
  .btn-icon.btn-toolbar-toggle[aria-pressed='false'] {
    border-style: dashed;
    opacity: 0.7;
  }

  .btn-icon.btn-pin.pinned,
  .btn-icon.btn-pin[aria-pressed='true'] {
    color: var(--primary-color);
    border-color: var(--primary-color);
  }

  .btn-icon.btn-delete:hover {
    opacity: 1;
    border-color: #ff4444;
    background: #ff4444;
    color: #fff;
  }

  .desktop-only { display: none; }

  @media (min-width: 769px) {
    .editor-header {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.75rem 1rem 4.25rem;
    }
    .title-row { flex: 1 1 auto; min-width: 0; }
    .header-actions {
      flex: 0 0 auto;
      overflow-x: visible;
    }
    .desktop-only { display: inline-flex; }
  }

  .editor-content {
    flex: 1;
    overflow: auto; /* Allow scrolling for full preview mode */
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Split view styles */
  .editor-content.split-view {
    overflow: hidden; /* In split view, children handle scroll */
  }

  .split-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    height: 100%;
  }

  .split-pane {
    flex: 1;
    overflow: hidden; /* Prevent double scrollbar */
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .editor-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .preview-pane {
    background: var(--bg-color);
    overflow-y: auto;
    overflow-x: hidden;
    /* Remove smooth scroll for instant sync */
    -webkit-overflow-scrolling: touch; /* Better mobile scrolling */
  }

  .outline-pane {
    width: 250px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Edit container for single pane with optional outline */
  .edit-container {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .outline-sidebar {
    width: 250px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    border-left: 1px solid var(--border-color);
  }

  /* Textarea in split view needs to be scrollable */
  .split-textarea {
    flex: 1;
    height: 100%;
    overflow-y: scroll !important; /* Force scrollbar to always show */
    overflow-x: hidden;
    /* Remove smooth scroll for instant sync */
    -webkit-overflow-scrolling: touch; /* Better mobile scrolling */
  }

  .split-divider {
    width: 4px;
    background: var(--border-color);
    cursor: col-resize;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .split-divider:hover {
    background: var(--primary-color);
  }

  /* Drag and drop styles */
  .editor-content.dragging::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 122, 204, 0.1);
    border: 3px dashed var(--primary-color);
    pointer-events: none;
    z-index: 99;
  }

  .drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 122, 204, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    pointer-events: none;
  }

  .drag-message {
    background: var(--primary-color);
    color: white;
    padding: 2rem 3rem;
    border-radius: 12px;
    font-size: 1.5rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0, 122, 204, 0.4);
  }

  .title-input {
    flex: 1;
    font-size: 1.5rem;
    font-weight: 650;
    background: transparent;
    border: none;
    color: var(--text-color);
    outline: none;
    padding: 0;
    transition: color 0.3s;
    min-width: 0;
    width: 100%;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .title-input::placeholder {
    color: var(--text-secondary);
  }

  .content-textarea {
    flex: 1;
    padding: 2rem;
    background: transparent;
    border: none;
    color: var(--text-color);
    font-size: 1rem;
    line-height: 1.6;
    resize: none;
    outline: none;
    font-family: 'Segoe UI', system-ui, sans-serif;
    transition: all 0.3s ease;
    min-width: 0;
    min-height: 0;
  }

  .content-textarea::placeholder {
    color: var(--text-secondary);
  }

  /* Font changing animation */
  :global(.editor-content.font-changing) {
    animation: fontFlash 0.3s ease;
  }

  @keyframes fontFlash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .editor-footer {
    padding: 0.75rem 2rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .footer-left {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .backlinks-count {
    color: var(--primary-color);
    font-weight: 500;
    cursor: help;
  }

  /* Backlinks section */
  .backlinks-section {
    padding: 1rem 2rem;
    border-top: 1px solid var(--border-color);
    background: var(--card-bg);
    max-height: 200px;
    overflow-y: auto;
  }

  .backlinks-section h3 {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .backlinks-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .backlink-item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .backlink-item:hover {
    border-color: var(--primary-color);
    background: var(--hover-bg);
  }

  .backlink-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-color);
    margin-bottom: 0.25rem;
  }

  .backlink-preview {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .editor-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .editor-empty h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: var(--text-color);
  }

  .editor-empty p {
    margin: 0;
    font-size: 1rem;
  }

  /* ===== Mobile polish — make the chrome fit a 320-768px screen. =====
     These rules intentionally override the default editor-header /
     btn-icon rules above for the narrow viewport. */
  @media (max-width: 768px) {
    .editor {
      overflow: hidden;
    }

    .editor-header {
      padding: calc(env(safe-area-inset-top, 0px) + 0.4rem) 0.5rem 0.35rem 3.4rem;
      gap: 0.3rem;
    }

    .title-input {
      height: 1.9rem;
      font-size: 1.0625rem;
      line-height: 1.2;
      font-weight: 650;
      letter-spacing: -0.01em;
    }

    .header-actions {
      width: 100%;
      max-width: 100%;
      gap: 0.25rem;
      padding-bottom: 0.125rem;
    }

    .btn-icon {
      min-width: 36px;
      min-height: 30px;
      padding: 0 0.45rem;
      font-size: 0.7rem;
      border-radius: 7px;
      background: var(--card-bg);
      opacity: 0.95;
    }

    /* Hide labels on phones (was 480px — now 600px so labels vanish
       sooner and the row is a true icon strip). The hide/show toggle
       keeps its label so the user knows what the button does. */
    @media (max-width: 600px) {
      .btn-icon .btn-label {
        display: none;
      }
      .btn-icon {
        padding: 0 0.4rem;
        min-width: 34px;
      }
    }

    .editor-content {
      min-height: 0;
      overflow: hidden;
    }

    .edit-container,
    .split-container {
      min-height: 0;
      min-width: 0;
    }

    .content-textarea {
      height: 100%;
      min-height: 0;
      padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
      font-size: 1rem;
      line-height: 1.58;
      font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
      overflow-y: auto;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .content-textarea::placeholder {
      color: var(--text-secondary);
      opacity: 0.85;
    }

    .editor-footer,
    .backlinks-section {
      display: none;
    }
  }
</style>
