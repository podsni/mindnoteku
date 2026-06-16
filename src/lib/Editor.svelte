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

  // Per-note download menu — opens a small popover offering Markdown
  // (.md) or plain text (.txt) export of the current note. The menu
  // closes when the user picks a format or clicks outside.
  let showDownloadMenu = $state(false)

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

  /** Strip markdown syntax to produce a plain-text version of the note
      body. Used by the .txt download. Keeps the content readable as
      raw text without trying to be a full markdown-to-text converter. */
  const stripMarkdown = (md: string): string => {
    return md
      // Remove code fences ```lang ... ```
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?/g, '').replace(/```/g, ''))
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Images: ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Links: [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Bold/italic/strike markers
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      // Heading hashes
      .replace(/^#{1,6}\s+/gm, '')
      // Blockquote markers
      .replace(/^>\s?/gm, '')
      // Unordered list markers
      .replace(/^[-*+]\s+/gm, '• ')
      // Ordered list markers
      .replace(/^\d+\.\s+/gm, '')
      // Horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Task list checkboxes
      .replace(/\[[ xX]\]\s*/g, '')
      .trim()
  }

  /** Sanitize a note title for use as a filename. Replaces characters
      that are invalid on Windows/macOS with hyphens and trims
      whitespace. Falls back to 'note' if the result is empty. */
  const sanitizeFilename = (title: string): string => {
    const cleaned = title
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80)
    return cleaned || 'note'
  }

  const downloadNoteAs = (format: 'md' | 'txt') => {
    if (!notesStore.currentNote) return
    const note = notesStore.currentNote
    const filename = sanitizeFilename(note.title) + '.' + format
    const body = format === 'md' ? note.content : stripMarkdown(note.content)

    // Prepend the title as a heading in markdown; in plain text, just
    // a separator line so the document is recognisable.
    const fullContent =
      format === 'md'
        ? `# ${note.title}\n\n${body}\n`
        : `${note.title}\n${'='.repeat(Math.min(60, note.title.length))}\n\n${body}\n`

    const mime = format === 'md' ? 'text/markdown' : 'text/plain'
    const blob = new Blob([fullContent], { type: mime + ';charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Defer revoke so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    showDownloadMenu = false
  }

  const toggleDownloadMenu = () => {
    showDownloadMenu = !showDownloadMenu
  }

  const closeDownloadMenu = () => {
    showDownloadMenu = false
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

    // Close the download popover when the user clicks anywhere outside
    // it. Bound to `pointerdown` so it fires before the click that would
    // re-open the menu (which lives inside the wrapper).
    const onDocPointerDown = (e: PointerEvent) => {
      if (!showDownloadMenu) return
      const target = e.target as HTMLElement | null
      if (target && !target.closest('.download-wrapper')) {
        showDownloadMenu = false
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
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
        <div class="download-wrapper">
          <button
            onclick={toggleDownloadMenu}
            class="btn-icon btn-download"
            class:active={showDownloadMenu}
            title="Download this note"
            aria-haspopup="menu"
            aria-expanded={showDownloadMenu}
          >
            <Icon name="download" size={16} strokeWidth={1.75} />
            <span class="btn-label" aria-hidden="true">Download</span>
          </button>
          {#if showDownloadMenu}
            <div class="download-menu" role="menu">
              <button
                type="button"
                class="download-option"
                role="menuitem"
                onclick={() => downloadNoteAs('md')}
              >
                <span class="download-fmt">.md</span>
                <span class="download-desc">Markdown</span>
              </button>
              <button
                type="button"
                class="download-option"
                role="menuitem"
                onclick={() => downloadNoteAs('txt')}
              >
                <span class="download-fmt">.txt</span>
                <span class="download-desc">Plain text</span>
              </button>
            </div>
          {/if}
        </div>
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
              placeholder="Start writing — Markdown supported. Press Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for link."
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
       taking the remaining space and actions on the right.
       `position: relative` + `z-index: 2` lifts the header above the
       .editor-content sibling so popovers inside the header (download
       menu, future overflow menus) aren't hidden behind the toolbar. */
    padding: 0.9rem 1.5rem;
    padding-left: 4rem; /* space for the floating sidebar toggle */
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    flex-shrink: 0;
    background: var(--bg-color);
    position: relative;
    z-index: 2;
  }

  .title-row {
    min-width: 0;
  }

  .header-actions {
    display: flex;
    /* Push action buttons to the right on mobile. On desktop the row
       becomes a single-line flex alongside the title, where each item
       is its own flex child. justify-content:flex-end keeps the icon
       strip tight against the right edge on narrow viewports instead
       of leaving a dead zone on the right side of the title row. */
    justify-content: flex-end;
    gap: 0.4rem;
    flex-wrap: nowrap;
    min-width: 0;
    /* `overflow: visible` so popovers anchored inside (download menu,
       future overflow menus) aren't clipped by the slim header bar.
       Horizontal scroll is unnecessary — the action strip is already
       capped at 60% of the row width and the icons compress on small
       screens, so they never overflow. */
    overflow: visible;
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
    /* Full-opacity text on the icon — opacity:0.75 brought the contrast
       against the dark chrome to ~3.4:1, below WCAG AA's 4.5:1 for
       non-text UI components (the 3:1 floor is for text ≥18px / bold
       ≥14px, not for icon affordances). Use a slightly cooler text
       color at full opacity and reserve dimming for hover/disabled. */
    opacity: 1;
    min-height: 34px;
    padding: 0 0.6rem;
    border-radius: var(--radius-sm);
    color: var(--text-color);
    white-space: nowrap;
    flex: 0 0 auto;
    transition:
      background var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }
  .btn-icon:hover { background: var(--hover-bg); }
  .btn-icon:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }

  .btn-icon.active,
  .btn-icon[aria-pressed='true'] {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--hover-bg);
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

  .btn-icon.btn-download[aria-expanded='true'] {
    background: var(--card-bg);
    color: var(--primary-color);
    border-color: var(--primary-color);
  }

  /* Download popover — sits below the trigger button and is right-aligned
     so it doesn't get clipped by the right edge of the viewport on
     narrow phones. Two stacked options: Markdown and plain text. */
  .download-wrapper {
    position: relative;
    flex: 0 0 auto;
  }
  .download-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 170px;
    background: color-mix(in srgb, var(--bg-color) 85%, var(--card-bg));
    border: 1px solid var(--border-hover);
    border-radius: 10px;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    padding: 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    z-index: 50;
    animation: downloadMenuIn 140ms var(--ease-out);
  }
  @keyframes downloadMenuIn {
    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .download-option {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.6rem;
    padding: 0.5rem 0.65rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-color);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    min-height: 32px;
    transition: background var(--motion-fast) var(--ease-out);
  }
  .download-option:hover,
  .download-option:focus-visible {
    background: var(--hover-bg);
    outline: none;
  }
  .download-fmt {
    font-weight: 700;
    color: var(--primary-color);
    min-width: 32px;
    text-align: center;
    background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-size: 0.72rem;
    letter-spacing: 0.02em;
  }
  .download-desc {
    color: var(--text-secondary);
    font-weight: 400;
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
      overflow: visible;
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
    min-width: 0;
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

  /* Split view on phones: the three-pane row (editor + preview + outline)
     would overflow a 375px viewport by 100+ pixels. Stack the panes
     vertically with a divider so the user can still see the preview
     below the editor without the writing area becoming a sliver. */
  @media (max-width: 768px) {
    .split-container {
      flex-direction: column;
    }
    .split-pane {
      flex: 1 1 auto;
      min-height: 0;
    }
    .editor-pane {
      flex: 1 1 60%;
    }
    .preview-pane {
      flex: 1 1 40%;
      border-top: 1px solid var(--border-color);
    }
    .outline-pane {
      display: none;
    }
    /* Hide the horizontal dividers between panes — they only make sense
       when panes are side-by-side. */
    .split-divider {
      display: none;
    }
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

  /* On phones the outline sidebar is 250px wide. Forcing it beside the
     editor textarea would crush the writing area to ~125px on a 375px
     screen — unusable. Hide it; users can use the desktop-only Outline
     button on a wider screen, or scroll to headers manually. */
  @media (max-width: 768px) {
    .outline-sidebar { display: none; }
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
      /* Single-row layout on mobile: title-input on the left flexes to
         fill, action buttons on the right are a fixed-width icon strip.
         The 3rem left padding clears the floating 32×32 sidebar toggle
         (which sits at left:12 + width:32 = 44px) with a 4px breathing
         gap. The top padding respects the iPhone notch via
         env(safe-area-inset-top); both vertical paddings are kept to
         the minimum so the writing area below gets as much room as
         possible. */
      padding: calc(env(safe-area-inset-top, 0px) + 0.25rem) 0.5rem 0.25rem 3rem;
      gap: 0.4rem;
      flex-direction: row;
      align-items: center;
    }

    .title-row {
      flex: 1 1 auto;
      min-width: 0;
    }

    .title-input {
      height: 1.6rem;
      font-size: 1rem;
      line-height: 1.2;
      font-weight: 650;
      letter-spacing: -0.01em;
    }

    .header-actions {
      flex: 0 0 auto;
      width: auto;
      max-width: 60%;
      gap: 0.2rem;
      padding-bottom: 0;
    }

    .btn-icon {
      /* WCAG 2.5.5 — minimum 36×36px interactive target on mobile.
         The compact chrome (39px header) needs all 4 visible icons
         plus a 4px gap, so we keep min-size at 36 to fit comfortably
         in the 60%-width action strip. */
      min-width: 36px;
      min-height: 36px;
      padding: 0 0.4rem;
      font-size: 0.7rem;
      border-radius: 7px;
      background: var(--card-bg);
      opacity: 0.95;
    }

    /* Hide labels on phones so the 4 mobile-visible buttons fit
       comfortably in the right-side icon strip without competing for
       the title's space. */
    .btn-icon .btn-label {
      display: none;
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
