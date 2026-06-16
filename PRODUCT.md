# Product

## Register

product

A focus writing app. SPA, PWA, offline-first, IndexedDB-backed. Not a marketing site.

## Users

Solo writers, students, and people who keep a personal notebook. They open the app dozens of times a day for short, focused writing sessions. They use a mix of phone, laptop, and tablet. They want the UI to disappear so the words can stay. Many use it offline on the train or plane; some sync to Dropbox. Few want accounts, social, or sharing.

## Product Purpose

Capture and find their writing. Fast capture without modal interruptions; reliable search across years of notes; markdown that exports cleanly. Local-first means notes survive without a vendor. Success looks like: open app, write, close app, never see the UI.

## Brand Personality

Quiet. Calm. Tools-resembling. Slightly monastic. Single accent, no decoration, no gamification, no streak counters. 3-word personality: quiet, sharp, durable.

## Anti-references

- Notion (too many surfaces, too many modals).
- Evernote (cluttered chrome, badges, banners).
- Bear (tasteful but it nudges too often, gradient accents).
- AI note apps that auto-summarize, add chat bubbles, or color-code everything.
- Glass blur, gradient text, hero illustrations, animated empty states with characters.

## Design Principles

1. **Disappear first.** Every pixel must earn its place. No decorative spacing, no status chips that don't inform a decision, no eyebrows above sections.
2. **One accent, one elevation.** A single accent color, used only for the primary action and current note. A single hairline border as the only elevation. No glass, no shadow stacks.
3. **Text is the surface.** The note content is the UI. The chrome around it is the minimum needed to navigate. No borders inside the editor. No floating toolbars over text.
4. **Touch and keyboard equal citizens.** Both must work fully. Every action is reachable by `⌘K`, every action is also tappable on a 375px screen with a 44×44 hit area.
5. **Failure modes are honest.** No toasts that disappear in 3 seconds. A failed save says so until the save succeeds. A deleted note asks once, briefly, and remembers nothing.

## Accessibility & Inclusion

WCAG 2.2 AA. Visible focus ring on every interactive element. Contrast ≥ 4.5:1 for body, ≥ 3:1 for large display type. All actions operable by keyboard. No motion-only feedback; every state change has a static indicator. Respects `prefers-reduced-motion` and `prefers-color-scheme`. RTL-ready. No emoji-as-icon.
