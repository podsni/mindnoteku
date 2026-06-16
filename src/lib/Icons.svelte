<script lang="ts">
  // Inline SVG icon set. stroke uses currentColor so it inherits from the
  // surrounding text/button color and themes adapt automatically.
  interface Props {
    name:
      | 'menu'
      | 'close'
      | 'plus'
      | 'search'
      | 'pin'
      | 'pinned'
      | 'trash'
      | 'export'
      | 'import'
      | 'note'
      | 'bolt'
      | 'phone'
      | 'lock'
      | 'arrow-left'
      | 'eye'
      | 'eye-off'
      | 'tool'
      | 'list'
      | 'columns'
      | 'edit'
      | 'chevron-down'
      | 'download'
    size?: number | string
    strokeWidth?: number
    label?: string
  }

  let { name, size = 18, strokeWidth = 1.75, label }: Props = $props()
</script>

{#if name === 'menu'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
{:else if name === 'close'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
{:else if name === 'plus'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
{:else if name === 'search'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.5" y2="16.5" />
  </svg>
{:else if name === 'pin'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M12 17v5" />
    <path d="M9 10.76V6a3 3 0 0 1 6 0v4.76l2 1.5V14H7v-1.74l2-1.5Z" />
  </svg>
{:else if name === 'pinned'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M12 17v5" />
    <path d="M9 10.76V6a3 3 0 0 1 6 0v4.76l2 1.5V14H7v-1.74l2-1.5Z" />
  </svg>
{:else if name === 'trash'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <line x1="10" y1="11" x2="10" y2="18" />
    <line x1="14" y1="11" x2="14" y2="18" />
  </svg>
{:else if name === 'export'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 21h14" />
  </svg>
{:else if name === 'import'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M12 21V9" />
    <path d="M7 16l5 5 5-5" />
    <path d="M5 3h14" />
  </svg>
{:else if name === 'note'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M15 4v4h4" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="14" y2="16" />
  </svg>
{:else if name === 'bolt'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
{:else if name === 'phone'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
{:else if name === 'lock'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
{:else if name === 'arrow-left'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
{:else if name === 'eye'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
{:else if name === 'eye-off'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.1 4" />
    <path d="M6.2 6.2A17.7 17.7 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.8" />
    <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
  </svg>
{:else if name === 'tool'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5Z" />
  </svg>
{:else if name === 'list'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <line x1="8" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="20" y2="12" />
    <line x1="8" y1="18" x2="20" y2="18" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </svg>
{:else if name === 'columns'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
{:else if name === 'edit'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
{:else if name === 'chevron-down'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
{:else if name === 'download'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
{/if}
