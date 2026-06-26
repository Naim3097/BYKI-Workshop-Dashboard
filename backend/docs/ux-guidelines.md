# UX guidelines and design system

One design system is shared by the storefront (bengkelgearbox.my, `assets/shop.css`)
and the owner area (this Next.js app). Both use the same dark navy + cyan palette
and the same type system, so the experience is consistent end to end. The owner
area is intentionally more straightforward (data-dense, fewer flourishes) but
visually of a piece with the storefront.

## Principles

- One system, two surfaces. The storefront and the owner area look like the same
  product.
- Dark navy canvas, cyan as the single accent. Red/amber/green only for status.
- Clarity over decoration. Generous spacing, few borders, one primary action per
  screen.
- Mobile first. Tables scroll inside cards; primary actions go full width; the
  owner nav collapses to a second row of tabs.
- Money is always MYR via `formatMYR`. No emojis in the owner area; the storefront
  keeps its own small SVG icons.

## Colour tokens

Defined in `tailwind.config.ts`, mirroring `assets/shop.css`.

| Token | Value | Use |
|---|---|---|
| `night` | #050b1c | Page base, modal overlays |
| `canvas` | #050b1c | Page background |
| `surface` | #0b1a3a | Card background |
| `surface-2` | #102448 | Elevated surface, inputs hover |
| `line` | rgba(52,185,240,.18) | Borders, dividers |
| `line-soft` | rgba(52,185,240,.10) | Subtle borders |
| `ink` | #eaf4ff | Primary text |
| `ink-soft` | #c4dcf0 | Secondary text |
| `ink-muted` | #8ba6c4 | Tertiary text, captions |
| `brand` | #34b9f0 | Cyan accent, links, active |
| `brand-bright` | #5fd2ff | Hover, highlights |
| `brand-dark` | #1f8fc4 | Gradients |
| `brand-soft` | rgba(52,185,240,.12) | Active chips, badges |
| `positive` | #5ad19a | Paid, in stock |
| `warning` | #ffd24a | Pending, low stock, workshop usage |
| `danger` | #ff5b63 | Failed, out of stock |

`borderRadius.card` = 12px. `maxWidth.page` = 1180px.

## Type system

Same three families as the storefront, loaded from Google Fonts in the root
layout:

- `Saira` (var `--font-head`) - headings (`font-head`, applied to h1-h4).
- `Inter` (var `--font-sans`) - body text.
- `JetBrains Mono` (var `--font-mono`) - eyebrow labels (`.eyebrow`, `font-mono`).

## Component classes

In `app/globals.css` under `@layer components`:

| Class | Purpose |
|---|---|
| `.container-page` | Centred page container, responsive padding |
| `.card` | Dark surface with a subtle cyan border |
| `.btn-primary` | Cyan gradient button, dark text, glow on hover |
| `.btn-secondary` | Outlined button on the dark surface |
| `.btn-ghost` | Text button in cyan |
| `.input` | Dark field with cyan focus ring |
| `.label`, `.badge`, `.eyebrow` | Field labels, status pills, mono eyebrow |

Reusable React components: `components/ui.tsx` (`StatusBadge`, `PaymentBadge`,
`StockBadge`, `SectionTitle`), `CustomerFields.tsx`, `ProductCard.tsx`,
`OwnerNav.tsx`, `SiteHeader.tsx`, `components/dashboard/*`.

## Status colour mapping

| State | Token |
|---|---|
| paid / fulfilled / SUCCESS / in stock | positive (green) |
| pending / awaiting payment / low stock / workshop usage | warning (amber) |
| cancelled / FAILED / out of stock | danger (red) |
| active selection, links | brand (cyan) |

Workshop usage keeps the amber treatment and a bordered panel so own-shop
consumption reads as distinct from sales.

## Responsive patterns

- Product grid: 1 / 2 / 3 columns (mobile / small / large).
- Dashboard KPIs: 2 columns on mobile, 4 on large.
- Tables: wrapped in `overflow-x-auto` with a `min-w` so they scroll rather than
  squash.
- Owner nav: brand + sign-out on the top row, section tabs on a second row on
  mobile.

## Accessibility

- Inputs have associated labels; steppers expose `aria-label`s.
- Colour is always paired with text (e.g. "Out of stock"), never colour alone.
- Cyan-on-navy and white-on-navy meet contrast for body and headings.
