<script lang="ts">
  // Editor toolbar for inline formatting and quick actions
  
  interface Props {
    onBold?: () => void
    onItalic?: () => void
    onStrikethrough?: () => void
    onCode?: () => void
    onLink?: () => void
    onImage?: () => void
    onHeading?: (level: number) => void
    onList?: (ordered: boolean) => void
    onCheckbox?: () => void
    onTable?: () => void
  }
  
  let {
    onBold,
    onItalic,
    onStrikethrough,
    onCode,
    onLink,
    onImage,
    onHeading,
    onList,
    onCheckbox,
    onTable
  }: Props = $props()
  
  let showHeadingMenu = $state(false)
  
  const handleHeading = (level: number) => {
    showHeadingMenu = false
    onHeading?.(level)
  }
</script>

<div class="toolbar">
  <!-- Text formatting -->
  <div class="toolbar-group">
    <button
      type="button"
      class="toolbar-btn"
      title="Bold (Ctrl+B)"
      onclick={onBold}
    >
      <strong>B</strong>
    </button>
    
    <button
      type="button"
      class="toolbar-btn"
      title="Italic (Ctrl+I)"
      onclick={onItalic}
    >
      <em>I</em>
    </button>
    
    <button
      type="button"
      class="toolbar-btn"
      title="Strikethrough (Ctrl+Shift+X)"
      onclick={onStrikethrough}
    >
      <s>S</s>
    </button>
    
    <button
      type="button"
      class="toolbar-btn"
      title="Inline Code (Ctrl+`)"
      onclick={onCode}
    >
      <code>{'<>'}</code>
    </button>
  </div>
  
  <div class="toolbar-separator"></div>
  
  <!-- Heading menu -->
  <div class="toolbar-group">
    <div class="toolbar-dropdown">
      <button
        type="button"
        class="toolbar-btn"
        title="Heading"
        onclick={() => showHeadingMenu = !showHeadingMenu}
      >
        H▾
      </button>
      
      {#if showHeadingMenu}
        <div class="dropdown-menu">
          {#each [1, 2, 3, 4, 5, 6] as level}
            <button
              type="button"
              class="dropdown-item"
              onclick={() => handleHeading(level)}
            >
              <span style="font-size: {20 - level}px; font-weight: bold;">
                H{level}
              </span>
              Heading {level}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <div class="toolbar-separator"></div>
  
  <!-- Lists -->
  <div class="toolbar-group">
    <button
      type="button"
      class="toolbar-btn"
      title="Unordered list"
      aria-label="Bulleted list"
      onclick={() => onList?.(false)}
    >
      <span aria-hidden="true">•</span>
    </button>

    <button
      type="button"
      class="toolbar-btn"
      title="Numbered list"
      aria-label="Numbered list"
      onclick={() => onList?.(true)}
    >
      <span aria-hidden="true">1.</span>
    </button>

    <button
      type="button"
      class="toolbar-btn"
      title="Task list"
      aria-label="Task list"
      onclick={onCheckbox}
    >
      <span aria-hidden="true">☐</span>
    </button>
  </div>

  <div class="toolbar-separator" aria-hidden="true"></div>

  <!-- Insert -->
  <div class="toolbar-group">
    <button
      type="button"
      class="toolbar-btn"
      title="Insert link (Ctrl+K)"
      data-icon-only="true"
      onclick={onLink}
    >
      <span class="btn-icon" aria-hidden="true">↗</span>
      <span class="btn-label">Link</span>
    </button>

    <button
      type="button"
      class="toolbar-btn"
      title="Insert image"
      data-icon-only="true"
      onclick={onImage}
    >
      <span class="btn-icon" aria-hidden="true">▣</span>
      <span class="btn-label">Img</span>
    </button>

    <button
      type="button"
      class="toolbar-btn"
      title="Insert table"
      data-icon-only="true"
      onclick={onTable}
    >
      <span class="btn-icon" aria-hidden="true">▦</span>
      <span class="btn-label">Table</span>
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
    gap: 0.4rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    position: relative;
  }

  .toolbar::-webkit-scrollbar {
    display: none;
  }

  /* Edge-fade affordance: a position:absolute overlay pinned to the right
     edge of the the visible toolbar on mobile. The fade paints a dark
     gradient on top of the buttons so the last visible button appears
     to fade out — telling the user there's more content to scroll to.
     The fade color uses the live theme bg (--bg-color) so it blends
     cleanly in dark, light, typewriter, and glassmorphism themes
     instead of stamping a hard black overlay. */
  @media (max-width: 768px) {
    .toolbar::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 1px;
      width: 44px;
      pointer-events: none;
      background: linear-gradient(
        to right,
        color-mix(in srgb, var(--bg-color) 0%, transparent),
        color-mix(in srgb, var(--bg-color) 70%, transparent) 60%,
        var(--bg-color) 100%
      );
    }
  }

  .toolbar-group {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    flex: 0 0 auto;
  }

  .toolbar-btn {
    min-width: 36px;
    min-height: 36px;
    padding: 0.4rem 0.55rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 7px;
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--motion-fast) var(--ease-out),
      border-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);
  }
  .toolbar-btn:hover {
    background: var(--hover-bg);
  }
  .toolbar-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }
  .toolbar-btn:active {
    background: var(--hover-bg);
  }

  .toolbar-separator {
    width: 1px;
    height: 18px;
    background-color: var(--border-color);
    margin: 0 0.15rem;
    flex: 0 0 auto;
  }

  .toolbar-dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
    z-index: 1000;
    min-width: 160px;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.55rem 0.7rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-color);
    transition: background-color var(--motion-fast) var(--ease-out);
  }

  .dropdown-item:hover {
    background: var(--hover-bg);
  }

  @media (max-width: 768px) {
    .toolbar {
      padding: 0.3rem 0.5rem;
      gap: 0.2rem;
    }
    .toolbar-separator {
      height: 18px;
      opacity: 0.55;
    }
    .toolbar-btn {
      min-width: 32px;
      min-height: 30px;
      padding: 0.25rem 0.4rem;
      border-radius: 7px;
      font-size: 0.72rem;
    }
    /* On phone widths, only show icons / no labels for the most
       space-hungry buttons. Keep the labels on Bold/Italic/Code since
       the letterforms themselves ARE the icons. */
    .toolbar-btn[data-no-label='true'] .btn-label,
    .toolbar-btn[data-icon-only='true'] .btn-label {
      display: none;
    }
    .dropdown-menu {
      position: fixed;
      left: 0.75rem;
      right: 0.75rem;
      top: auto;
      bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
      min-width: 0;
      border-radius: 12px;
      overflow: hidden;
      z-index: 1001;
    }
  }
</style>
